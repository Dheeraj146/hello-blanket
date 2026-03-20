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
    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { query, type } = await req.json();
    if (!query) {
      return new Response(JSON.stringify({ error: "query is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const results: Record<string, any> = {};

    // Determine query type
    const isIP = /^\d{1,3}(\.\d{1,3}){3}$/.test(query);
    const isDomain = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(query) && !isIP;
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query);

    // Shodan
    const shodanKey = Deno.env.get("SHODAN_API_KEY");
    if (shodanKey && isIP) {
      try {
        const res = await fetch(`https://api.shodan.io/shodan/host/${query}?key=${shodanKey}`);
        if (res.ok) results.shodan = await res.json();
        else results.shodan = { error: `${res.status}` };
      } catch (e) { results.shodan = { error: e.message }; }
    }

    // AbuseIPDB
    const abuseKey = Deno.env.get("ABUSEIPDB_API_KEY");
    if (abuseKey && isIP) {
      try {
        const res = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${query}&maxAgeInDays=90`, {
          headers: { "Key": abuseKey, "Accept": "application/json" },
        });
        if (res.ok) results.abuseipdb = await res.json();
        else results.abuseipdb = { error: `${res.status}` };
      } catch (e) { results.abuseipdb = { error: e.message }; }
    }

    // OTX (AlienVault)
    const otxKey = Deno.env.get("OTX_API_KEY");
    if (otxKey) {
      try {
        let url = "";
        if (isIP) url = `https://otx.alienvault.com/api/v1/indicators/IPv4/${query}/general`;
        else if (isDomain) url = `https://otx.alienvault.com/api/v1/indicators/domain/${query}/general`;
        if (url) {
          const res = await fetch(url, { headers: { "X-OTX-API-KEY": otxKey } });
          if (res.ok) results.otx = await res.json();
          else results.otx = { error: `${res.status}` };
        }
      } catch (e) { results.otx = { error: e.message }; }
    }

    // VirusTotal
    const vtKey = Deno.env.get("VIRUSTOTAL_API_KEY");
    if (vtKey) {
      try {
        let url = "";
        if (isIP) url = `https://www.virustotal.com/api/v3/ip_addresses/${query}`;
        else if (isDomain) url = `https://www.virustotal.com/api/v3/domains/${query}`;
        if (url) {
          const res = await fetch(url, { headers: { "x-apikey": vtKey } });
          if (res.ok) results.virustotal = await res.json();
          else results.virustotal = { error: `${res.status}` };
        }
      } catch (e) { results.virustotal = { error: e.message }; }
    }

    // IPInfo
    const ipinfoToken = Deno.env.get("IPINFO_TOKEN");
    if (ipinfoToken && isIP) {
      try {
        const res = await fetch(`https://ipinfo.io/${query}?token=${ipinfoToken}`);
        if (res.ok) results.ipinfo = await res.json();
        else results.ipinfo = { error: `${res.status}` };
      } catch (e) { results.ipinfo = { error: e.message }; }
    }

    // Hunter
    const hunterKey = Deno.env.get("HUNTER_API_KEY");
    if (hunterKey && (isDomain || isEmail)) {
      try {
        let url = "";
        if (isDomain) url = `https://api.hunter.io/v2/domain-search?domain=${query}&api_key=${hunterKey}`;
        else if (isEmail) url = `https://api.hunter.io/v2/email-verifier?email=${query}&api_key=${hunterKey}`;
        const res = await fetch(url);
        if (res.ok) results.hunter = await res.json();
        else results.hunter = { error: `${res.status}` };
      } catch (e) { results.hunter = { error: e.message }; }
    }

    // HIBP
    const hibpKey = Deno.env.get("HIBP_API_KEY");
    if (hibpKey && isEmail) {
      try {
        const res = await fetch(`https://haveibeenpwned.com/api/v3/breachedaccount/${query}`, {
          headers: { "hibp-api-key": hibpKey, "User-Agent": "NAZAR-Security-Dashboard" },
        });
        if (res.ok) results.hibp = await res.json();
        else if (res.status === 404) results.hibp = { message: "No breaches found" };
        else results.hibp = { error: `${res.status}` };
      } catch (e) { results.hibp = { error: e.message }; }
    }

    // SecurityTrails
    const stKey = Deno.env.get("SECURITYTRAILS_API_KEY");
    if (stKey && isDomain) {
      try {
        const res = await fetch(`https://api.securitytrails.com/v1/domain/${query}`, {
          headers: { "APIKEY": stKey },
        });
        if (res.ok) results.securitytrails = await res.json();
        else results.securitytrails = { error: `${res.status}` };
      } catch (e) { results.securitytrails = { error: e.message }; }
    }

    // ZoomEye
    const zoomeyeKey = Deno.env.get("ZOOMEYE_API_KEY");
    if (zoomeyeKey && isIP) {
      try {
        const res = await fetch(`https://api.zoomeye.org/host/search?query=ip:${query}`, {
          headers: { "API-KEY": zoomeyeKey },
        });
        if (res.ok) results.zoomeye = await res.json();
        else results.zoomeye = { error: `${res.status}` };
      } catch (e) { results.zoomeye = { error: e.message }; }
    }

    return new Response(JSON.stringify({ query, type: isIP ? "ip" : isDomain ? "domain" : isEmail ? "email" : "unknown", results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
