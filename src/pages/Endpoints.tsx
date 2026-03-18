import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EndpointStatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { FeatureExplanationDialog } from "@/components/FeatureExplanation";
import type { Tables } from "@/integrations/supabase/types";

export default function Endpoints() {
  const [endpoints, setEndpoints] = useState<Tables<"endpoints">[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.from("endpoints").select("*").order("last_seen", { ascending: false }).then(({ data }) => data && setEndpoints(data));
  }, []);

  const filtered = endpoints.filter((e) => !search || e.hostname.toLowerCase().includes(search.toLowerCase()) || e.ip_address.includes(search));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Monitored Endpoints</h1>
          <p className="text-sm text-muted-foreground">{endpoints.length} endpoints under surveillance</p>
        </div>
        <FeatureExplanationDialog featureKey="endpoint-monitoring" />
      </div>
      <Input placeholder="Search by hostname or IP..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs bg-secondary/50" />
      <Card className="bg-card border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Hostname</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>OS</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Last Seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No endpoints found</TableCell></TableRow>
              ) : filtered.map((ep) => (
                <TableRow key={ep.id}>
                  <TableCell><EndpointStatusBadge status={ep.status} /></TableCell>
                  <TableCell className="font-mono text-sm">{ep.hostname}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{ep.ip_address}</TableCell>
                  <TableCell className="text-sm">{ep.os || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{ep.agent_version || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(ep.last_seen).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
