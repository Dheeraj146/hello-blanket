import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { endpoint_id } = await req.json().catch(() => ({}));

    let query = adminClient.from("endpoint_configs").select("*").eq("is_active", true);
    if (endpoint_id) query = query.eq("id", endpoint_id);
    const { data: configs } = await query;

    if (!configs || configs.length === 0) {
      return new Response(JSON.stringify({ message: "No active endpoints to collect from" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const results = [];

    for (const config of configs) {
      const result: any = { hostname: config.hostname, ip: config.ip_address, log_source: config.log_source };

      try {
        if (config.log_source === "wazuh" && config.api_url && config.api_key) {
          // Fetch from Wazuh API
          const res = await fetch(`${config.api_url}/agents?select=id,name,status,os.name,os.version,lastKeepAlive`, {
            headers: { "Authorization": `Bearer ${config.api_key}` },
          });
          if (res.ok) {
            const data = await res.json();
            result.status = "collected";
            result.agents = data?.data?.affected_items?.length || 0;

            // Store events
            if (data?.data?.affected_items) {
              for (const agent of data.data.affected_items) {
                await adminClient.from("security_events").insert({
                  type: "wazuh_agent_status",
                  description: `Agent ${agent.name} (${agent.id}): ${agent.status}`,
                  source_endpoint: config.ip_address,
                  severity: agent.status === "active" ? "low" : "high",
                  status: "open",
                });
              }
            }
          } else {
            result.status = "error";
            result.error = `Wazuh API returned ${res.status}`;
          }
        } else if (config.log_source === "suricata" && config.api_url && config.api_key) {
          // Fetch from Suricata/EveBox API
          const res = await fetch(`${config.api_url}/api/1/alerts?size=50`, {
            headers: { "Authorization": `Bearer ${config.api_key}` },
          });
          if (res.ok) {
            const data = await res.json();
            result.status = "collected";
            result.alerts = data?.data?.length || 0;

            if (data?.data) {
              for (const alert of data.data.slice(0, 20)) {
                await adminClient.from("security_events").insert({
                  type: "suricata_alert",
                  description: alert.event?.alert?.signature || "Suricata alert",
                  source_endpoint: config.ip_address,
                  severity: (alert.event?.alert?.severity || 3) <= 1 ? "critical" : (alert.event?.alert?.severity || 3) <= 2 ? "high" : "medium",
                  status: "open",
                });
              }
            }
          } else {
            result.status = "error";
            result.error = `Suricata API returned ${res.status}`;
          }
        } else if (config.log_source === "custom_api" && config.api_url) {
          // Generic API endpoint that returns JSON logs
          const headers: any = { "Content-Type": "application/json" };
          if (config.api_key) headers["Authorization"] = `Bearer ${config.api_key}`;

          const res = await fetch(config.api_url, { headers });
          if (res.ok) {
            const data = await res.json();
            result.status = "collected";
            const logs = Array.isArray(data) ? data : data.logs || data.events || data.data || [];
            result.log_count = logs.length;

            for (const log of logs.slice(0, 50)) {
              await adminClient.from("security_events").insert({
                type: log.type || "custom_log",
                description: log.message || log.description || JSON.stringify(log).slice(0, 500),
                source_endpoint: config.ip_address,
                severity: log.severity || "low",
                status: "open",
              });
            }
          } else {
            result.status = "error";
            result.error = `API returned ${res.status}`;
          }
        } else {
          result.status = "skipped";
          result.reason = "No API URL configured or unsupported log source";
        }

        // Update last_scan_at
        await adminClient.from("endpoint_configs").update({ last_scan_at: new Date().toISOString() }).eq("id", config.id);

        // Update endpoints table
        await adminClient.from("endpoints").upsert({
          hostname: config.hostname,
          ip_address: config.ip_address,
          os: config.os,
          status: result.status === "collected" ? "secure" : result.status === "error" ? "warning" : "offline",
          last_seen: new Date().toISOString(),
        }, { onConflict: "ip_address" });

      } catch (err) {
        result.status = "error";
        result.error = err.message;
      }

      results.push(result);
    }

    return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
