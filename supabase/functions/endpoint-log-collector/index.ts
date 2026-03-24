import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map Windows Event levels to severity
function mapWindowsLevel(level: number | string): "critical" | "high" | "medium" | "low" {
  const lvl = typeof level === "string" ? parseInt(level) : level;
  if (lvl <= 1) return "critical"; // Critical
  if (lvl === 2) return "high";    // Error
  if (lvl === 3) return "medium";  // Warning
  return "low";                     // Information, Verbose
}

// Flag security-relevant Windows Event IDs
function classifyWindowsEvent(eventId: number, source: string): { type: string; severity: "critical" | "high" | "medium" | "low" } | null {
  const securityEvents: Record<number, { type: string; severity: "critical" | "high" | "medium" | "low" }> = {
    4625: { type: "failed_login", severity: "high" },
    4624: { type: "successful_login", severity: "low" },
    4648: { type: "explicit_credential_logon", severity: "medium" },
    4672: { type: "admin_privilege_assigned", severity: "medium" },
    4688: { type: "new_process_created", severity: "low" },
    4720: { type: "user_account_created", severity: "medium" },
    4722: { type: "user_account_enabled", severity: "medium" },
    4725: { type: "user_account_disabled", severity: "medium" },
    4726: { type: "user_account_deleted", severity: "high" },
    4732: { type: "member_added_to_security_group", severity: "high" },
    4735: { type: "security_group_changed", severity: "high" },
    4740: { type: "account_locked_out", severity: "high" },
    4756: { type: "member_added_to_universal_group", severity: "medium" },
    1102: { type: "audit_log_cleared", severity: "critical" },
    7045: { type: "new_service_installed", severity: "high" },
    20001: { type: "usb_device_connected", severity: "medium" },
    1116: { type: "defender_malware_detected", severity: "critical" },
    1117: { type: "defender_action_taken", severity: "high" },
    5156: { type: "network_connection_allowed", severity: "low" },
    5157: { type: "network_connection_blocked", severity: "medium" },
  };

  if (securityEvents[eventId]) return securityEvents[eventId];

  // Check source for Windows Defender
  if (source?.toLowerCase().includes("defender") || source?.toLowerCase().includes("antimalware")) {
    return { type: "defender_event", severity: "high" };
  }

  return null;
}

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
        if (config.log_source === "windows_event_api" && config.api_url) {
          // Fetch from Windows Event Log API running on the endpoint
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (config.api_key) headers["Authorization"] = `Bearer ${config.api_key}`;

          const res = await fetch(config.api_url, { headers });
          if (res.ok) {
            const data = await res.json();
            const events = Array.isArray(data) ? data : data.events || data.data || [];
            result.status = "collected";
            result.event_count = events.length;
            let securityEventsCount = 0;

            for (const evt of events.slice(0, 100)) {
              const eventId = evt.EventID || evt.Id || evt.event_id || 0;
              const level = evt.Level || evt.level || 4;
              const source = evt.Source || evt.ProviderName || evt.source || "";
              const message = evt.Message || evt.message || "";
              const timeCreated = evt.TimeCreated || evt.time_created || evt.timestamp || new Date().toISOString();

              // Classify event
              const classification = classifyWindowsEvent(eventId, source);
              const severity = classification?.severity || mapWindowsLevel(level);
              const eventType = classification?.type || `windows_event_${eventId}`;

              // Only store security-relevant events or errors/warnings
              if (classification || level <= 3) {
                securityEventsCount++;
                await adminClient.from("security_events").insert({
                  type: eventType,
                  description: `[EventID: ${eventId}] [Source: ${source}] ${message}`.slice(0, 1000),
                  source_endpoint: config.ip_address,
                  severity,
                  status: "open",
                });

                // Create threat alert for critical/high events
                if (severity === "critical" || severity === "high") {
                  await adminClient.from("threat_alerts").insert({
                    title: `${eventType.replace(/_/g, " ")} on ${config.hostname}`,
                    description: `EventID ${eventId} from ${source}: ${message}`.slice(0, 500),
                    severity,
                    source: config.ip_address,
                  });
                }
              }
            }

            result.security_events_stored = securityEventsCount;
          } else {
            result.status = "error";
            result.error = `Windows Event API returned ${res.status}: ${res.statusText}`;
          }
        } else if (config.log_source === "wazuh" && config.api_url && config.api_key) {
          const res = await fetch(`${config.api_url}/agents?select=id,name,status,os.name,os.version,lastKeepAlive`, {
            headers: { "Authorization": `Bearer ${config.api_key}` },
          });
          if (res.ok) {
            const data = await res.json();
            result.status = "collected";
            result.agents = data?.data?.affected_items?.length || 0;
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
          const headers: Record<string, string> = { "Content-Type": "application/json" };
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
          result.reason = config.log_source === "windows_event_api"
            ? "No API URL configured — set up the Windows Event Collector script on the endpoint and provide its URL"
            : "No API URL configured or unsupported log source";
        }

        // Update last_scan_at
        await adminClient.from("endpoint_configs").update({ last_scan_at: new Date().toISOString() }).eq("id", config.id);

        // Update endpoints table
        const endpointStatus = result.status === "collected" ? "secure" : result.status === "error" ? "warning" : "offline";
        const { data: existingEp } = await adminClient.from("endpoints").select("id").eq("ip_address", config.ip_address).single();
        if (existingEp) {
          await adminClient.from("endpoints").update({
            status: endpointStatus,
            last_seen: new Date().toISOString(),
            hostname: config.hostname,
            os: config.os,
          }).eq("id", existingEp.id);
        } else {
          await adminClient.from("endpoints").insert({
            hostname: config.hostname,
            ip_address: config.ip_address,
            os: config.os,
            status: endpointStatus,
            last_seen: new Date().toISOString(),
          });
        }
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
