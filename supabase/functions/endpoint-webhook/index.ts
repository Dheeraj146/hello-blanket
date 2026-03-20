import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
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

    const webhookSecret = req.headers.get("x-webhook-secret");
    const body = await req.json();

    // Validate webhook secret against endpoint configs
    if (webhookSecret) {
      const { data: config } = await adminClient
        .from("endpoint_configs")
        .select("*")
        .eq("webhook_secret", webhookSecret)
        .eq("is_active", true)
        .single();

      if (!config) {
        return new Response(JSON.stringify({ error: "Invalid webhook secret" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Accept log data in various formats
    const events = Array.isArray(body) ? body : body.events || body.logs || body.data || [body];

    let inserted = 0;
    for (const event of events.slice(0, 100)) {
      const { error } = await adminClient.from("security_events").insert({
        type: event.type || event.rule?.description || "webhook_event",
        description: event.message || event.description || event.full_log || JSON.stringify(event).slice(0, 1000),
        source_endpoint: event.source_ip || event.agent?.ip || event.src_ip || null,
        severity: mapSeverity(event.level || event.severity || event.rule?.level),
        status: "open",
      });
      if (!error) inserted++;
    }

    return new Response(JSON.stringify({ message: `${inserted} events ingested` }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

function mapSeverity(level: any): string {
  if (!level) return "low";
  const num = typeof level === "number" ? level : parseInt(level);
  if (!isNaN(num)) {
    if (num >= 12) return "critical";
    if (num >= 8) return "high";
    if (num >= 4) return "medium";
    return "low";
  }
  const str = String(level).toLowerCase();
  if (str === "critical" || str === "crit") return "critical";
  if (str === "high" || str === "error") return "high";
  if (str === "medium" || str === "warning" || str === "warn") return "medium";
  return "low";
}
