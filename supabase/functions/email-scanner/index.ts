import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const callerId = claimsData.claims.sub;
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: roleData } = await adminClient.from("user_roles").select("role").eq("user_id", callerId).eq("role", "admin").single();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { server_id } = await req.json();

    // Get email server config
    let query = adminClient.from("email_server_configs").select("*").eq("is_active", true);
    if (server_id) query = query.eq("id", server_id);
    const { data: servers, error: serverErr } = await query;

    if (serverErr || !servers?.length) {
      return new Response(JSON.stringify({ error: "No active email servers configured", details: serverErr?.message }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const results: any[] = [];

    for (const server of servers) {
      try {
        // Attempt to connect to the email server
        // Note: Real IMAP/POP3 connections require network access to the mail server.
        // This will work when deployed locally on the same network.
        // For now, we attempt a TCP connection probe.
        
        const connectUrl = `${server.use_tls ? "https" : "http"}://${server.host}:${server.port}`;
        
        let scanStatus = "connection_failed";
        let errorMsg = "";
        
        try {
          const conn = await Deno.connect({ hostname: server.host, port: server.port });
          conn.close();
          scanStatus = "connected";
        } catch (connErr) {
          scanStatus = "connection_failed";
          errorMsg = connErr.message;
        }

        // Update last_scan_at
        await adminClient.from("email_server_configs").update({ last_scan_at: new Date().toISOString() }).eq("id", server.id);

        if (scanStatus === "connection_failed") {
          // Create a security event for failed connection
          await adminClient.from("security_events").insert({
            type: "email_server_unreachable",
            severity: "high",
            description: `Failed to connect to email server ${server.name} (${server.host}:${server.port}): ${errorMsg}`,
            source_endpoint: server.host,
            status: "open",
          });
        }

        results.push({
          server_id: server.id,
          server_name: server.name,
          status: scanStatus,
          error: errorMsg || undefined,
        });
      } catch (serverScanErr) {
        results.push({
          server_id: server.id,
          server_name: server.name,
          status: "error",
          error: serverScanErr.message,
        });
      }
    }

    return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
