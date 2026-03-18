import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/integrations/supabase/types";

interface PageVisit {
  id: string;
  user_id: string;
  page: string;
  visited_at: string;
}

export default function Admin() {
  const [profiles, setProfiles] = useState<Tables<"profiles">[]>([]);
  const [roles, setRoles] = useState<Tables<"user_roles">[]>([]);
  const [logs, setLogs] = useState<Tables<"audit_logs">[]>([]);
  const [visits, setVisits] = useState<PageVisit[]>([]);

  useEffect(() => {
    supabase.from("profiles").select("*").order("created_at", { ascending: false }).then(({ data }) => data && setProfiles(data));
    supabase.from("user_roles").select("*").then(({ data }) => data && setRoles(data));
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(50).then(({ data }) => data && setLogs(data));
    supabase.from("page_visits").select("*").order("visited_at", { ascending: false }).limit(200).then(({ data }) => data && setVisits(data as PageVisit[]));
  }, []);

  const getUserRole = (userId: string) => roles.find((r) => r.user_id === userId)?.role || "viewer";

  // Visitor stats
  const visitsByUser: Record<string, number> = {};
  const visitsByPage: Record<string, number> = {};
  visits.forEach((v) => {
    visitsByUser[v.user_id] = (visitsByUser[v.user_id] || 0) + 1;
    visitsByPage[v.page] = (visitsByPage[v.page] || 0) + 1;
  });

  const topPages = Object.entries(visitsByPage).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const userVisitCounts = Object.entries(visitsByUser).sort((a, b) => b[1] - a[1]);

  const getDisplayName = (userId: string) => {
    const p = profiles.find((pr) => pr.user_id === userId);
    return p?.display_name || userId.slice(0, 8) + "…";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-sm text-muted-foreground">User management, audit logs, and visitor statistics</p>
      </div>
      <Tabs defaultValue="users">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="visitors">Visitor Stats</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="bg-card border-border/50">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Visits</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.display_name || "—"}</TableCell>
                      <TableCell><Badge variant="outline" className="font-mono text-xs capitalize">{getUserRole(p.user_id)}</Badge></TableCell>
                      <TableCell className="font-mono text-sm">{visitsByUser[p.user_id] || 0}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visitors">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-card border-border/50">
              <CardContent className="pt-4">
                <h3 className="text-sm font-semibold mb-3">Most Visited Pages</h3>
                <div className="space-y-2">
                  {topPages.map(([page, count]) => (
                    <div key={page} className="flex items-center justify-between">
                      <span className="font-mono text-sm">{page}</span>
                      <Badge variant="secondary" className="font-mono">{count}</Badge>
                    </div>
                  ))}
                  {topPages.length === 0 && <p className="text-sm text-muted-foreground">No visit data yet</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border/50">
              <CardContent className="pt-4">
                <h3 className="text-sm font-semibold mb-3">Visits per User</h3>
                <div className="space-y-2">
                  {userVisitCounts.map(([userId, count]) => (
                    <div key={userId} className="flex items-center justify-between">
                      <span className="text-sm">{getDisplayName(userId)}</span>
                      <Badge variant="secondary" className="font-mono">{count}</Badge>
                    </div>
                  ))}
                  {userVisitCounts.length === 0 && <p className="text-sm text-muted-foreground">No visit data yet</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card border-border/50 mt-4">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Page</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visits.slice(0, 50).map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="text-sm">{getDisplayName(v.user_id)}</TableCell>
                      <TableCell className="font-mono text-sm">{v.page}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{new Date(v.visited_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {visits.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No visits recorded</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card className="bg-card border-border/50">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No audit logs</TableCell></TableRow>
                  ) : logs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-mono text-sm">{l.action}</TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{l.details || "—"}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{l.ip_address || "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{new Date(l.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
