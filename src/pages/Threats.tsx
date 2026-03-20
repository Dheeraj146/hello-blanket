import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeverityBadge } from "@/components/SeverityBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FeatureExplanationDialog } from "@/components/FeatureExplanation";
import { Search, Loader2, Shield, Globe, Mail } from "lucide-react";
import { toast } from "sonner";
import type { Tables as DbTables } from "@/integrations/supabase/types";

export default function Threats() {
  const [alerts, setAlerts] = useState<DbTables<"threat_alerts">[]>([]);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");

  // Threat intel
  const [intelQuery, setIntelQuery] = useState("");
  const [intelLoading, setIntelLoading] = useState(false);
  const [intelResults, setIntelResults] = useState<any>(null);

  useEffect(() => {
    supabase.from("threat_alerts").select("*").order("detected_at", { ascending: false }).then(({ data }) => data && setAlerts(data));
  }, []);

  const filtered = alerts.filter((a) => {
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (severityFilter !== "all" && a.severity !== severityFilter) return false;
    return true;
  });

  const handleIntelLookup = async () => {
    if (!intelQuery.trim()) return;
    setIntelLoading(true);
    setIntelResults(null);
    try {
      const { data, error } = await supabase.functions.invoke("threat-intel", {
        body: { query: intelQuery.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setIntelResults(data);
    } catch (err: any) {
      toast.error(err.message || "Lookup failed");
    }
    setIntelLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Threat Landscape</h1>
          <p className="text-sm text-muted-foreground">Active and resolved threat intelligence</p>
        </div>
        <FeatureExplanationDialog featureKey="threat-detection" />
      </div>

      <Tabs defaultValue="alerts">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="alerts" className="gap-1"><Shield className="h-3.5 w-3.5" />Alerts</TabsTrigger>
          <TabsTrigger value="intel" className="gap-1"><Search className="h-3.5 w-3.5" />Threat Intel Lookup</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts">
          <div className="flex gap-3 flex-wrap mb-4">
            <Input placeholder="Search threats..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs bg-secondary/50" />
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-36 bg-secondary/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card className="bg-card border-border/50">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Severity</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Detected</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No threats found</TableCell></TableRow>
                  ) : filtered.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell><SeverityBadge severity={a.severity} /></TableCell>
                      <TableCell className="font-medium">{a.title}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">{a.source || "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{new Date(a.detected_at).toLocaleString()}</TableCell>
                      <TableCell>{a.resolved ? <span className="text-cyber-green text-xs">Resolved</span> : <span className="text-destructive text-xs">Active</span>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intel">
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-mono">Threat Intelligence Lookup</CardTitle>
              <p className="text-xs text-muted-foreground">Query IPs, domains, or emails against Shodan, AbuseIPDB, OTX, VirusTotal, IPInfo, Hunter, HIBP, SecurityTrails, ZoomEye</p>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  value={intelQuery}
                  onChange={(e) => setIntelQuery(e.target.value)}
                  placeholder="Enter IP, domain, or email..."
                  className="bg-secondary/50"
                  onKeyDown={(e) => e.key === "Enter" && handleIntelLookup()}
                />
                <Button onClick={handleIntelLookup} disabled={intelLoading || !intelQuery.trim()}>
                  {intelLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />}
                  Lookup
                </Button>
              </div>

              {intelResults && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {intelResults.type === "ip" && <Globe className="h-4 w-4 text-primary" />}
                    {intelResults.type === "domain" && <Globe className="h-4 w-4 text-primary" />}
                    {intelResults.type === "email" && <Mail className="h-4 w-4 text-primary" />}
                    <span className="font-mono font-semibold">{intelResults.query}</span>
                    <Badge variant="outline" className="text-xs">{intelResults.type}</Badge>
                  </div>

                  {Object.entries(intelResults.results || {}).map(([source, data]: [string, any]) => (
                    <Card key={source} className="bg-secondary/20 border-border/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-mono uppercase flex items-center gap-2">
                          {source}
                          {data?.error ? (
                            <Badge variant="destructive" className="text-[10px]">Error</Badge>
                          ) : (
                            <Badge className="bg-cyber-green/20 text-cyber-green text-[10px]">OK</Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {data?.error ? (
                          <p className="text-xs text-destructive">{data.error}</p>
                        ) : (
                          <pre className="text-xs text-muted-foreground overflow-auto max-h-48 whitespace-pre-wrap break-words">
                            {JSON.stringify(data, null, 2)}
                          </pre>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
