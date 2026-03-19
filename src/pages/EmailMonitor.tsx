import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Mail, MailWarning, ShieldAlert, ArrowUpRight, ArrowDownLeft, Paperclip } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { FeatureExplanationDialog } from "@/components/FeatureExplanation";

interface DomainEmail {
  id: string;
  message_id: string | null;
  sender: string;
  recipient: string;
  subject: string | null;
  domain: string;
  protocol: string;
  direction: string;
  status: string;
  size_bytes: number | null;
  has_attachment: boolean | null;
  spam_score: number | null;
  threat_detected: boolean | null;
  threat_type: string | null;
  ip_address: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  delivered: "bg-cyber-green/20 text-cyber-green border-cyber-green/30",
  bounced: "bg-cyber-amber/20 text-cyber-amber border-cyber-amber/30",
  quarantined: "bg-cyber-purple/20 text-cyber-purple border-cyber-purple/30",
  blocked: "bg-destructive/20 text-destructive border-destructive/30",
  pending: "bg-muted text-muted-foreground border-border",
  failed: "bg-destructive/20 text-destructive border-destructive/30",
};

const PIE_COLORS = ["hsl(0,72%,51%)", "hsl(142,76%,45%)", "hsl(38,92%,50%)", "hsl(270,76%,55%)", "hsl(220,10%,50%)"];

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function EmailMonitor() {
  const [emails, setEmails] = useState<DomainEmail[]>([]);
  const [search, setSearch] = useState("");
  const [directionFilter, setDirectionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [protocolFilter, setProtocolFilter] = useState("all");

  useEffect(() => {
    supabase.from("domain_emails").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setEmails(data as DomainEmail[]); });
  }, []);

  const filtered = emails.filter((e) => {
    if (search) {
      const q = search.toLowerCase();
      if (!e.sender.toLowerCase().includes(q) && !e.recipient.toLowerCase().includes(q) && !(e.subject || "").toLowerCase().includes(q)) return false;
    }
    if (directionFilter !== "all" && e.direction !== directionFilter) return false;
    if (statusFilter !== "all" && e.status !== statusFilter) return false;
    if (protocolFilter !== "all" && e.protocol !== protocolFilter) return false;
    return true;
  });

  const totalEmails = emails.length;
  const inbound = emails.filter((e) => e.direction === "inbound").length;
  const outbound = emails.filter((e) => e.direction === "outbound").length;
  const threats = emails.filter((e) => e.threat_detected).length;
  const blocked = emails.filter((e) => e.status === "blocked").length;
  const quarantined = emails.filter((e) => e.status === "quarantined").length;

  const protocolCounts: Record<string, number> = {};
  emails.forEach((e) => { protocolCounts[e.protocol] = (protocolCounts[e.protocol] || 0) + 1; });
  const protocolData = Object.entries(protocolCounts).map(([name, value]) => ({ name, value }));

  const statusCounts: Record<string, number> = {};
  emails.forEach((e) => { statusCounts[e.status] = (statusCounts[e.status] || 0) + 1; });
  const statusData = Object.entries(statusCounts).map(([name, count]) => ({ name, count }));

  const stats = [
    { label: "Total Emails", value: totalEmails, icon: Mail, color: "text-primary" },
    { label: "Inbound", value: inbound, icon: ArrowDownLeft, color: "text-cyber-green" },
    { label: "Outbound", value: outbound, icon: ArrowUpRight, color: "text-primary" },
    { label: "Threats Detected", value: threats, icon: ShieldAlert, color: "text-destructive" },
    { label: "Blocked", value: blocked, icon: MailWarning, color: "text-cyber-amber" },
    { label: "Quarantined", value: quarantined, icon: MailWarning, color: "text-cyber-purple" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email Security Monitor</h1>
          <p className="text-sm text-muted-foreground">Real-time email tracking for <span className="font-mono text-primary">telesoft.com</span></p>
        </div>
        <FeatureExplanationDialog featureKey="email-monitoring" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="bg-card border-border/50 cyber-gradient">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <s.icon className={`h-5 w-5 ${s.color} opacity-60`} />
                <div>
                  <p className="text-[10px] text-muted-foreground font-mono uppercase">{s.label}</p>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-mono">Email Status Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-mono">Protocol Breakdown</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={protocolData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                  {protocolData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center">
              {protocolData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1 text-[10px]">
                  <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-muted-foreground">{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Search sender, recipient, subject..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs bg-secondary/50" />
        <Select value={directionFilter} onValueChange={setDirectionFilter}>
          <SelectTrigger className="w-32 bg-secondary/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Direction</SelectItem>
            <SelectItem value="inbound">Inbound</SelectItem>
            <SelectItem value="outbound">Outbound</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 bg-secondary/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
            <SelectItem value="quarantined">Quarantined</SelectItem>
            <SelectItem value="bounced">Bounced</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={protocolFilter} onValueChange={setProtocolFilter}>
          <SelectTrigger className="w-32 bg-secondary/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Protocols</SelectItem>
            <SelectItem value="SMTP">SMTP</SelectItem>
            <SelectItem value="IMAP">IMAP</SelectItem>
            <SelectItem value="EXCHANGE">Exchange</SelectItem>
            <SelectItem value="POP3">POP3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-card border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Direction</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Protocol</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Threat</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No email data yet — configure email servers in the Admin Panel to start monitoring</TableCell></TableRow>
              ) : filtered.map((e) => (
                <TableRow key={e.id} className={e.threat_detected ? "bg-destructive/5" : ""}>
                  <TableCell>
                    {e.direction === "inbound" ? (
                      <span className="flex items-center gap-1 text-xs text-cyber-green"><ArrowDownLeft className="h-3 w-3" />IN</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-primary"><ArrowUpRight className="h-3 w-3" />OUT</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] capitalize ${STATUS_COLORS[e.status] || ""}`}>{e.status}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs max-w-[140px] truncate">{e.sender}</TableCell>
                  <TableCell className="font-mono text-xs max-w-[140px] truncate">{e.recipient}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">
                    <span className="flex items-center gap-1">
                      {e.has_attachment && <Paperclip className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                      {e.subject || <span className="text-muted-foreground italic">No subject</span>}
                    </span>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px] font-mono">{e.protocol}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">{formatBytes(e.size_bytes)}</TableCell>
                  <TableCell>
                    {e.threat_detected ? (
                      <Badge variant="destructive" className="text-[10px] capitalize">{e.threat_type}</Badge>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Clean</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(e.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
