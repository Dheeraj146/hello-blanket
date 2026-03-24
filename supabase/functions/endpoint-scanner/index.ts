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

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: roleData } = await adminClient.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").single();
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
      let eventCount = 0;

      try {
        if (config.log_source === "windows_event_api" && config.api_url) {
          // Check connectivity by fetching from Windows Event API
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (config.api_key) headers["Authorization"] = `Bearer ${config.api_key}`;

          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);

          try {
            const res = await fetch(config.api_url, { headers, signal: controller.signal });
            clearTimeout(timeout);

            if (res.ok) {
              const data = await res.json();
              const events = Array.isArray(data) ? data : data.events || data.data || [];
              eventCount = events.length;

              // Check for critical events to determine status
              let hasCritical = false;
              let hasWarning = false;
              for (const evt of events.slice(0, 20)) {
                const level = evt.Level || evt.level || 4;
                if (level <= 1) hasCritical = true;
                if (level <= 2) hasWarning = true;
              }

              status = hasCritical ? "critical" : hasWarning ? "warning" : "secure";
            } else {
              status = "warning";
              errorMsg = `API returned ${res.status}`;
            }
          } catch (fetchErr) {
            clearTimeout(timeout);
            status = "offline";
            errorMsg = fetchErr.message;
          }
        } else if (config.api_url) {
          // For other log sources with API URLs, check connectivity
          const headers: Record<string, string> = {};
          if (config.api_key) headers["Authorization"] = `Bearer ${config.api_key}`;

          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);

          try {
            const res = await fetch(config.api_url, { headers, signal: controller.signal });
            clearTimeout(timeout);
            status = res.ok ? "secure" : "warning";
            if (!res.ok) errorMsg = `API returned ${res.status}`;
          } catch (fetchErr) {
            clearTimeout(timeout);
            status = "offline";
            errorMsg = fetchErr.message;
          }
        } else {
          // No API URL — try basic TCP connectivity check
          try {
            const conn = await Deno.connect({ hostname: config.ip_address, port: 5000, transport: "tcp" });
            conn.close();
            status = "secure";
          } catch {
            // Try common ports
            for (const port of [22, 3389, 80, 443]) {
              try {
                const conn = await Deno.connect({ hostname: config.ip_address, port, transport: "tcp" });
                conn.close();
                status = "secure";
                break;
              } catch { /* try next */ }
            }
          }
          if (status === "offline") {
            errorMsg = "No API URL configured and host unreachable on common ports";
          }
        }
      } catch (err) {
        status = "offline";
        errorMsg = err.message;
      }

      // Update last_scan_at
      await adminClient.from("endpoint_configs").update({ last_scan_at: new Date().toISOString() }).eq("id", config.id);

      // Upsert endpoints table
      const { data: existingEndpoint } = await adminClient.from("endpoints").select("id, status").eq("ip_address", config.ip_address).single();

      if (existingEndpoint) {
        const previousStatus = existingEndpoint.status;
        await adminClient.from("endpoints").update({
          status,
          last_seen: new Date().toISOString(),
          hostname: config.hostname,
          os: config.os,
        }).eq("id", existingEndpoint.id);

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
        event_count: eventCount,
        error: errorMsg || undefined,
      });
    }

    return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
