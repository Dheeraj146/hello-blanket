import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SeverityBadge } from "@/components/SeverityBadge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Tables } from "@/integrations/supabase/types";

export default function Threats() {
  const [alerts, setAlerts] = useState<Tables<"threat_alerts">[]>([]);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");

  useEffect(() => {
    supabase.from("threat_alerts").select("*").order("detected_at", { ascending: false }).then(({ data }) => data && setAlerts(data));
  }, []);

  const filtered = alerts.filter((a) => {
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (severityFilter !== "all" && a.severity !== severityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Threat Landscape</h1>
        <p className="text-sm text-muted-foreground">Active and resolved threat intelligence</p>
      </div>
      <div className="flex gap-3 flex-wrap">
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
                  <TableCell>{a.resolved ? <span className="text-cyber-green text-xs">Resolved</span> : <span className="text-cyber-red text-xs">Active</span>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
