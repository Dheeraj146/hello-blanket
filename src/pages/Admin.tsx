import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/integrations/supabase/types";

export default function Admin() {
  const [profiles, setProfiles] = useState<Tables<"profiles">[]>([]);
  const [roles, setRoles] = useState<Tables<"user_roles">[]>([]);
  const [logs, setLogs] = useState<Tables<"audit_logs">[]>([]);

  useEffect(() => {
    supabase.from("profiles").select("*").order("created_at", { ascending: false }).then(({ data }) => data && setProfiles(data));
    supabase.from("user_roles").select("*").then(({ data }) => data && setRoles(data));
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(50).then(({ data }) => data && setLogs(data));
  }, []);

  const getUserRole = (userId: string) => roles.find((r) => r.user_id === userId)?.role || "viewer";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-sm text-muted-foreground">User management and system audit</p>
      </div>
      <Tabs defaultValue="users">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="users">Users</TabsTrigger>
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
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.display_name || "—"}</TableCell>
                      <TableCell><Badge variant="outline" className="font-mono text-xs capitalize">{getUserRole(p.user_id)}</Badge></TableCell>
                      <TableCell className="text-muted-foreground text-xs">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
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
