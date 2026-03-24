import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Minimal IMAP client using Deno TLS
class ImapClient {
  private conn: Deno.TlsConn | Deno.Conn | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private buffer = "";
  private tagCounter = 0;
  private decoder = new TextDecoder();
  private encoder = new TextEncoder();

  async connect(host: string, port: number, useTls: boolean): Promise<string> {
    if (useTls) {
      this.conn = await Deno.connectTls({ hostname: host, port });
    } else {
      this.conn = await Deno.connect({ hostname: host, port });
    }
    this.reader = this.conn.readable.getReader();
    // Read server greeting
    return await this.readUntilLine("*");
  }

  private nextTag(): string {
    this.tagCounter++;
    return `A${String(this.tagCounter).padStart(4, "0")}`;
  }

  private async writeCommand(tag: string, command: string): Promise<void> {
    const line = `${tag} ${command}\r\n`;
    const writer = this.conn!.writable.getWriter();
    await writer.write(this.encoder.encode(line));
    writer.releaseLock();
  }

  private async readUntilLine(prefix: string): Promise<string> {
    const lines: string[] = [];
    const timeout = 15000;
    const start = Date.now();

    while (Date.now() - start < timeout) {
      // Check buffer for complete lines
      while (this.buffer.includes("\r\n")) {
        const idx = this.buffer.indexOf("\r\n");
        const line = this.buffer.substring(0, idx);
        this.buffer = this.buffer.substring(idx + 2);
        lines.push(line);
        if (line.startsWith(prefix)) {
          return lines.join("\n");
        }
      }
      // Read more data
      try {
        const { value, done } = await this.reader!.read();
        if (done) break;
        if (value) this.buffer += this.decoder.decode(value, { stream: true });
      } catch {
        break;
      }
    }
    return lines.join("\n");
  }

  async command(cmd: string): Promise<{ tag: string; response: string }> {
    const tag = this.nextTag();
    await this.writeCommand(tag, cmd);
    const response = await this.readUntilLine(tag);
    return { tag, response };
  }

  async login(username: string, password: string): Promise<boolean> {
    const { response } = await this.command(`LOGIN "${username}" "${password}"`);
    return response.includes("OK");
  }

  async selectInbox(): Promise<{ exists: number }> {
    const { response } = await this.command("SELECT INBOX");
    const existsMatch = response.match(/\*\s+(\d+)\s+EXISTS/i);
    return { exists: existsMatch ? parseInt(existsMatch[1]) : 0 };
  }

  async searchRecent(days: number = 3): Promise<number[]> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const dateStr = `${date.getDate()}-${months[date.getMonth()]}-${date.getFullYear()}`;
    const { response } = await this.command(`SEARCH SINCE ${dateStr}`);
    const searchLine = response.split("\n").find(l => l.startsWith("* SEARCH"));
    if (!searchLine) return [];
    const ids = searchLine.replace("* SEARCH", "").trim().split(/\s+/).filter(Boolean).map(Number);
    return ids.slice(-50); // Last 50 emails max
  }

  async fetchEnvelopes(ids: number[]): Promise<any[]> {
    if (ids.length === 0) return [];
    const idRange = ids.join(",");
    const { response } = await this.command(`FETCH ${idRange} (ENVELOPE RFC822.SIZE FLAGS)`);
    return this.parseEnvelopes(response);
  }

  private parseEnvelopes(raw: string): any[] {
    const results: any[] = [];
    // Split by FETCH responses
    const fetchPattern = /\*\s+\d+\s+FETCH\s+\((.+?)(?=\*\s+\d+\s+FETCH|\nA\d{4})/gs;
    const simplePattern = /\*\s+(\d+)\s+FETCH/g;
    
    // Simpler approach: parse line by line
    const lines = raw.split("\n");
    let currentFetch = "";
    
    for (const line of lines) {
      if (line.match(/^\*\s+\d+\s+FETCH/)) {
        if (currentFetch) {
          const parsed = this.parseSingleEnvelope(currentFetch);
          if (parsed) results.push(parsed);
        }
        currentFetch = line;
      } else if (line.match(/^A\d{4}/)) {
        if (currentFetch) {
          const parsed = this.parseSingleEnvelope(currentFetch);
          if (parsed) results.push(parsed);
        }
        currentFetch = "";
      } else {
        currentFetch += "\n" + line;
      }
    }
    
    return results;
  }

  private parseSingleEnvelope(raw: string): any | null {
    try {
      // Extract message sequence number
      const seqMatch = raw.match(/^\*\s+(\d+)\s+FETCH/);
      const seq = seqMatch ? parseInt(seqMatch[1]) : 0;

      // Extract RFC822.SIZE
      const sizeMatch = raw.match(/RFC822\.SIZE\s+(\d+)/i);
      const size = sizeMatch ? parseInt(sizeMatch[1]) : 0;

      // Extract ENVELOPE - find the ENVELOPE section
      const envStart = raw.indexOf("ENVELOPE (");
      if (envStart === -1) return null;

      // Extract subject from envelope (second quoted string after date)
      const envelopeStr = raw.substring(envStart);
      
      // Parse quoted strings from envelope
      const quotedStrings: string[] = [];
      let inQuote = false;
      let current = "";
      for (let i = 0; i < envelopeStr.length; i++) {
        const ch = envelopeStr[i];
        if (ch === '"' && (i === 0 || envelopeStr[i-1] !== '\\')) {
          if (inQuote) {
            quotedStrings.push(current);
            current = "";
          }
          inQuote = !inQuote;
        } else if (inQuote) {
          current += ch;
        }
      }

      // ENVELOPE format: (date subject from sender reply-to to cc bcc in-reply-to message-id)
      const date = quotedStrings[0] || "";
      const subject = quotedStrings[1] || "(no subject)";
      
      // Extract email addresses - look for patterns like ((NIL NIL "user" "domain.com"))
      const fromMatch = envelopeStr.match(/ENVELOPE\s*\([^)]*"[^"]*"\s*"[^"]*"\s*\(\((?:NIL|"[^"]*")\s+(?:NIL|"[^"]*")\s+"([^"]*)"\s+"([^"]*)"\)\)/);
      const sender = fromMatch ? `${fromMatch[1]}@${fromMatch[2]}` : "";
      
      // Try to find To address
      const addresses = this.extractAddresses(envelopeStr);
      
      // Extract message-id (last quoted string typically)
      const messageId = quotedStrings.length > 2 ? quotedStrings[quotedStrings.length - 1] : `${seq}-${Date.now()}`;

      // Check for FLAGS
      const hasAttachment = raw.includes("\\Attachment") || subject.toLowerCase().includes("attach");
      const flagsMatch = raw.match(/FLAGS\s*\(([^)]*)\)/i);
      const flags = flagsMatch ? flagsMatch[1] : "";

      return {
        seq,
        date,
        subject,
        sender: addresses.from || sender || "unknown@unknown",
        recipient: addresses.to || "unknown@unknown",
        messageId,
        size,
        hasAttachment,
        flags,
      };
    } catch {
      return null;
    }
  }

  private extractAddresses(envelope: string): { from: string; to: string } {
    let from = "";
    let to = "";
    
    // Find address groups: ((personal at-domain-list mailbox host))
    const addrGroups: string[][] = [];
    const addrPattern = /\(\((?:NIL|"[^"]*")\s+(?:NIL|"[^"]*")\s+"([^"]*)"\s+"([^"]*)"\)\)/g;
    let match;
    while ((match = addrPattern.exec(envelope)) !== null) {
      addrGroups.push([match[1], match[2]]);
    }
    
    if (addrGroups.length >= 1) from = `${addrGroups[0][0]}@${addrGroups[0][1]}`;
    // The To address is typically the 4th address group in ENVELOPE
    if (addrGroups.length >= 4) to = `${addrGroups[3][0]}@${addrGroups[3][1]}`;
    else if (addrGroups.length >= 2) to = `${addrGroups[1][0]}@${addrGroups[1][1]}`;
    
    return { from, to };
  }

  async logout(): Promise<void> {
    try {
      await this.command("LOGOUT");
    } catch { /* ignore */ }
    try {
      this.conn?.close();
    } catch { /* ignore */ }
  }
}

// Threat analysis
function analyzeEmail(email: any): { threatDetected: boolean; threatType: string | null; spamScore: number } {
  let spamScore = 0;
  let threatType: string | null = null;
  const subject = (email.subject || "").toLowerCase();
  const sender = (email.sender || "").toLowerCase();

  // Phishing indicators
  const phishingKeywords = ["urgent", "verify your account", "suspended", "click here immediately", "confirm your identity", "unusual activity", "security alert", "your account will be", "reset your password", "act now"];
  for (const kw of phishingKeywords) {
    if (subject.includes(kw)) { spamScore += 3; threatType = "phishing"; }
  }

  // Spam indicators
  const spamKeywords = ["free", "winner", "congratulations", "prize", "lottery", "million dollars", "discount", "limited time", "unsubscribe", "bulk"];
  for (const kw of spamKeywords) {
    if (subject.includes(kw)) spamScore += 1;
  }

  // Suspicious sender patterns
  const suspiciousDomains = ["temp-mail", "guerrillamail", "throwaway", "fakeinbox", "mailinator"];
  for (const d of suspiciousDomains) {
    if (sender.includes(d)) { spamScore += 5; threatType = "suspicious_sender"; }
  }

  // Executable attachment keywords in subject
  if (subject.match(/\.(exe|bat|cmd|scr|js|vbs|ps1|msi)/)) {
    spamScore += 4;
    threatType = "malware_risk";
  }

  const threatDetected = spamScore >= 3 || threatType !== null;
  if (spamScore >= 5 && !threatType) threatType = "spam";

  return { threatDetected, threatType, spamScore: Math.min(spamScore, 10) };
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

    const { server_id } = await req.json().catch(() => ({}));

    let query = adminClient.from("email_server_configs").select("*").eq("is_active", true);
    if (server_id) query = query.eq("id", server_id);
    const { data: servers, error: serverErr } = await query;

    if (serverErr || !servers?.length) {
      return new Response(JSON.stringify({ error: "No active email servers configured", details: serverErr?.message }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const results: any[] = [];

    for (const server of servers) {
      const result: any = {
        server_id: server.id,
        server_name: server.name,
        status: "pending",
        emails_found: 0,
        threats_found: 0,
      };

      try {
        if (server.protocol !== "IMAP") {
          result.status = "skipped";
          result.reason = `Protocol ${server.protocol} not supported for scanning — only IMAP is supported for reading emails`;
          results.push(result);
          continue;
        }

        const imap = new ImapClient();
        
        // Connect
        console.log(`Connecting to ${server.host}:${server.port} (TLS: ${server.use_tls})`);
        await imap.connect(server.host, server.port, server.use_tls);
        
        // Login
        const loginOk = await imap.login(server.username, server.encrypted_password);
        if (!loginOk) {
          result.status = "auth_failed";
          result.error = "IMAP login failed — check username/password";
          await imap.logout();
          results.push(result);
          continue;
        }

        // Select INBOX
        const inbox = await imap.selectInbox();
        result.inbox_messages = inbox.exists;

        // Search recent emails (last 3 days)
        const ids = await imap.searchRecent(3);
        result.recent_ids = ids.length;

        if (ids.length > 0) {
          // Fetch envelopes
          const envelopes = await imap.fetchEnvelopes(ids);
          result.emails_found = envelopes.length;

          // Process each email
          for (const email of envelopes) {
            const analysis = analyzeEmail(email);

            // Determine direction based on domain
            const serverDomain = server.username.includes("@") ? server.username.split("@")[1] : server.host;
            const direction = email.sender.includes(serverDomain) ? "outbound" : "inbound";

            // Upsert into domain_emails (deduplicate by message_id)
            const { error: insertErr } = await adminClient.from("domain_emails").upsert({
              message_id: email.messageId,
              sender: email.sender,
              recipient: email.recipient,
              subject: email.subject,
              domain: serverDomain,
              protocol: server.protocol,
              direction,
              status: analysis.threatDetected ? "flagged" : "delivered",
              size_bytes: email.size,
              has_attachment: email.hasAttachment,
              spam_score: analysis.spamScore,
              threat_detected: analysis.threatDetected,
              threat_type: analysis.threatType,
              ip_address: server.host,
            }, { onConflict: "message_id" });

            if (insertErr) {
              console.error("Insert error:", insertErr.message);
            }

            // Create threat alert if needed
            if (analysis.threatDetected) {
              result.threats_found++;
              await adminClient.from("threat_alerts").insert({
                title: `${analysis.threatType || "Suspicious"} email detected`,
                description: `From: ${email.sender} | Subject: ${email.subject} | Spam Score: ${analysis.spamScore}/10`,
                severity: analysis.spamScore >= 7 ? "critical" : analysis.spamScore >= 5 ? "high" : "medium",
                source: server.name,
              });

              await adminClient.from("security_events").insert({
                type: `email_threat_${analysis.threatType || "suspicious"}`,
                description: `${analysis.threatType || "Suspicious"} email from ${email.sender}: "${email.subject}"`,
                severity: analysis.spamScore >= 7 ? "critical" : analysis.spamScore >= 5 ? "high" : "medium",
                source_endpoint: server.host,
                status: "open",
              });
            }
          }
        }

        await imap.logout();

        // Update last_scan_at
        await adminClient.from("email_server_configs").update({ last_scan_at: new Date().toISOString() }).eq("id", server.id);

        result.status = "success";
      } catch (err) {
        result.status = "error";
        result.error = err.message;

        // Log connection failure as security event
        await adminClient.from("security_events").insert({
          type: "email_server_error",
          severity: "high",
          description: `Failed to scan email server ${server.name} (${server.host}:${server.port}): ${err.message}`,
          source_endpoint: server.host,
          status: "open",
        });
      }

      results.push(result);
    }

    return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
