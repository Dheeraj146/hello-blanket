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

    const body = await req.json().catch(() => ({}));
    const { endpoint_id } = body;

    let query = adminClient.from("endpoint_configs").select("*").eq("is_active", true);
    if (endpoint_id) query = query.eq("id", endpoint_id);
    const { data: configs, error: configErr } = await query;

    if (configErr || !configs?.length) {
      return new Response(JSON.stringify({ error: "No active endpoints configured" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const results: any[] = [];

    for (const config of configs) {
      let status: "secure" | "warning" | "critical" | "offline" = "offline";
      let errorMsg = "";

      try {
        // Try TCP connection to common ports based on monitor_type
        const ports = config.monitor_type === "ssh" ? [22] : config.monitor_type === "http" ? [80, 443] : [80, 443, 22];
        let connected = false;

        for (const port of ports) {
          try {
            const conn = await Deno.connect({ hostname: config.ip_address, port, transport: "tcp" });
            conn.close();
            connected = true;
            break;
          } catch {
            // Try next port
          }
        }

        status = connected ? "secure" : "offline";
      } catch (err) {
        status = "offline";
        errorMsg = err.message;
      }

      // Update last_scan_at on config
      await adminClient.from("endpoint_configs").update({ last_scan_at: new Date().toISOString() }).eq("id", config.id);

      // Upsert into endpoints table
      const { data: existingEndpoint } = await adminClient.from("endpoints").select("id, status").eq("ip_address", config.ip_address).single();

      if (existingEndpoint) {
        const previousStatus = existingEndpoint.status;
        await adminClient.from("endpoints").update({
          status,
          last_seen: new Date().toISOString(),
          hostname: config.hostname,
          os: config.os,
        }).eq("id", existingEndpoint.id);

        // Create security event on status change
        if (previousStatus !== status) {
          await adminClient.from("security_events").insert({
            type: "endpoint_status_change",
            severity: status === "offline" ? "high" : status === "critical" ? "critical" : "low",
            description: `Endpoint ${config.hostname} (${config.ip_address}) changed from ${previousStatus} to ${status}`,
            source_endpoint: config.ip_address,
            status: "open",
          });
        }
      } else {
        await adminClient.from("endpoints").insert({
          hostname: config.hostname,
          ip_address: config.ip_address,
          os: config.os,
          status,
          last_seen: new Date().toISOString(),
        });
      }

      results.push({
        endpoint_id: config.id,
        hostname: config.hostname,
        ip_address: config.ip_address,
        status,
        error: errorMsg || undefined,
      });
    }

    return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
