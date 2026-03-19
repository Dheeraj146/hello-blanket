import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Scan, Users, Mail, Server, Eye, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

interface PageVisit {
  id: string;
  user_id: string;
  page: string;
  visited_at: string;
}

interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  user_metadata?: { display_name?: string };
}

export default function Admin() {
  const [profiles, setProfiles] = useState<Tables<"profiles">[]>([]);
  const [roles, setRoles] = useState<Tables<"user_roles">[]>([]);
  const [logs, setLogs] = useState<Tables<"audit_logs">[]>([]);
  const [visits, setVisits] = useState<PageVisit[]>([]);
  const [emailServers, setEmailServers] = useState<any[]>([]);
  const [endpointConfigs, setEndpointConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Create user form
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newRole, setNewRole] = useState("viewer");
  const [createUserOpen, setCreateUserOpen] = useState(false);

  // Email server form
  const [serverName, setServerName] = useState("");
  const [serverProtocol, setServerProtocol] = useState("IMAP");
  const [serverHost, setServerHost] = useState("");
  const [serverPort, setServerPort] = useState("993");
  const [serverUsername, setServerUsername] = useState("");
  const [serverPassword, setServerPassword] = useState("");
  const [serverTls, setServerTls] = useState(true);
  const [addServerOpen, setAddServerOpen] = useState(false);

  // Endpoint config form
  const [epHostname, setEpHostname] = useState("");
  const [epIp, setEpIp] = useState("");
  const [epOs, setEpOs] = useState("");
  const [epMonitorType, setEpMonitorType] = useState("ping");
  const [epInterval, setEpInterval] = useState("5");
  const [addEndpointOpen, setAddEndpointOpen] = useState(false);

  const fetchAll = () => {
    supabase.from("profiles").select("*").order("created_at", { ascending: false }).then(({ data }) => data && setProfiles(data));
    supabase.from("user_roles").select("*").then(({ data }) => data && setRoles(data));
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(50).then(({ data }) => data && setLogs(data));
    supabase.from("page_visits").select("*").order("visited_at", { ascending: false }).limit(200).then(({ data }) => data && setVisits(data as PageVisit[]));
    supabase.from("email_server_configs").select("*").order("created_at", { ascending: false }).then(({ data }) => data && setEmailServers(data));
    supabase.from("endpoint_configs").select("*").order("created_at", { ascending: false }).then(({ data }) => data && setEndpointConfigs(data));
  };

  useEffect(() => { fetchAll(); }, []);

  const getUserRole = (userId: string) => roles.find((r) => r.user_id === userId)?.role || "viewer";

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

  // Create user
  const handleCreateUser = async () => {
    if (!newEmail || !newPassword || !newRole) { toast.error("All fields required"); return; }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("manage-users", {
        body: { action: "create", email: newEmail, password: newPassword, display_name: newDisplayName, role: newRole },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      toast.success("User created successfully");
      setCreateUserOpen(false);
      setNewEmail(""); setNewPassword(""); setNewDisplayName(""); setNewRole("viewer");
      fetchAll();
    } catch (err: any) { toast.error(err.message); }
    setLoading(false);
  };

  // Update role
  const handleUpdateRole = async (userId: string, role: string) => {
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("manage-users", {
        body: { action: "update_role", user_id: userId, role },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      toast.success("Role updated");
      fetchAll();
    } catch (err: any) { toast.error(err.message); }
    setLoading(false);
  };

  // Delete user
  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Delete this user permanently?")) return;
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("manage-users", {
        body: { action: "delete", user_id: userId },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      toast.success("User deleted");
      fetchAll();
    } catch (err: any) { toast.error(err.message); }
    setLoading(false);
  };

  // Add email server
  const handleAddServer = async () => {
    if (!serverName || !serverHost || !serverPort || !serverUsername || !serverPassword) { toast.error("All fields required"); return; }
    setLoading(true);
    const { error } = await supabase.from("email_server_configs").insert({
      name: serverName, protocol: serverProtocol, host: serverHost, port: parseInt(serverPort),
      username: serverUsername, encrypted_password: serverPassword, use_tls: serverTls,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Email server added");
      setAddServerOpen(false);
      setServerName(""); setServerHost(""); setServerPort("993"); setServerUsername(""); setServerPassword("");
      fetchAll();
    }
    setLoading(false);
  };

  // Delete email server
  const handleDeleteServer = async (id: string) => {
    if (!confirm("Remove this email server?")) return;
    const { error } = await supabase.from("email_server_configs").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Server removed"); fetchAll(); }
  };

  // Scan email server
  const handleScanServer = async (serverId?: string) => {
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("email-scanner", {
        body: { server_id: serverId },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      toast.success("Scan completed");
      fetchAll();
    } catch (err: any) { toast.error(err.message); }
    setLoading(false);
  };

  // Add endpoint config
  const handleAddEndpoint = async () => {
    if (!epHostname || !epIp) { toast.error("Hostname and IP required"); return; }
    setLoading(true);
    const { error } = await supabase.from("endpoint_configs").insert({
      hostname: epHostname, ip_address: epIp, os: epOs || null,
      monitor_type: epMonitorType, scan_interval_minutes: parseInt(epInterval),
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Endpoint added");
      setAddEndpointOpen(false);
      setEpHostname(""); setEpIp(""); setEpOs(""); setEpMonitorType("ping"); setEpInterval("5");
      fetchAll();
    }
    setLoading(false);
  };

  // Delete endpoint config
  const handleDeleteEndpoint = async (id: string) => {
    if (!confirm("Remove this endpoint?")) return;
    const { error } = await supabase.from("endpoint_configs").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Endpoint removed"); fetchAll(); }
  };

  // Scan endpoint
  const handleScanEndpoint = async (endpointId?: string) => {
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("endpoint-scanner", {
        body: { endpoint_id: endpointId },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      toast.success("Scan completed");
      fetchAll();
    } catch (err: any) { toast.error(err.message); }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-sm text-muted-foreground">Manage users, configure monitoring sources, and review activity</p>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="bg-secondary/50 flex-wrap">
          <TabsTrigger value="users" className="gap-1"><Users className="h-3.5 w-3.5" />Users</TabsTrigger>
          <TabsTrigger value="email-servers" className="gap-1"><Mail className="h-3.5 w-3.5" />Email Servers</TabsTrigger>
          <TabsTrigger value="endpoints" className="gap-1"><Server className="h-3.5 w-3.5" />Endpoints</TabsTrigger>
          <TabsTrigger value="visitors" className="gap-1"><Eye className="h-3.5 w-3.5" />Visitor Stats</TabsTrigger>
          <TabsTrigger value="audit" className="gap-1"><FileText className="h-3.5 w-3.5" />Audit Logs</TabsTrigger>
        </TabsList>

        {/* ===== USERS TAB ===== */}
        <TabsContent value="users">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">User Accounts</h2>
            <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" />Create User</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create New User</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Email</Label><Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="user@domain.com" /></div>
                  <div><Label>Password</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" /></div>
                  <div><Label>Display Name</Label><Input value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)} placeholder="John Doe" /></div>
                  <div>
                    <Label>Role</Label>
                    <Select value={newRole} onValueChange={setNewRole}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="analyst">Analyst</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateUser} disabled={loading} className="w-full">
                    {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Create User
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card className="bg-card border-border/50">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Visits</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No users yet</TableCell></TableRow>
                  ) : profiles.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.display_name || "—"}</TableCell>
                      <TableCell>
                        <Select value={getUserRole(p.user_id)} onValueChange={(v) => handleUpdateRole(p.user_id, v)}>
                          <SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="analyst">Analyst</SelectItem>
                            <SelectItem value="supervisor">Supervisor</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{visitsByUser[p.user_id] || 0}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteUser(p.user_id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== EMAIL SERVERS TAB ===== */}
        <TabsContent value="email-servers">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Email Server Configurations</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleScanServer()} disabled={loading || emailServers.length === 0}>
                {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Scan className="h-4 w-4 mr-1" />}Scan All
              </Button>
              <Dialog open={addServerOpen} onOpenChange={setAddServerOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Server</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Email Server</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Name</Label><Input value={serverName} onChange={(e) => setServerName(e.target.value)} placeholder="Mail Server 1" /></div>
                    <div>
                      <Label>Protocol</Label>
                      <Select value={serverProtocol} onValueChange={setServerProtocol}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IMAP">IMAP</SelectItem>
                          <SelectItem value="SMTP">SMTP</SelectItem>
                          <SelectItem value="POP3">POP3</SelectItem>
                          <SelectItem value="Exchange">Exchange</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2"><Label>Host</Label><Input value={serverHost} onChange={(e) => setServerHost(e.target.value)} placeholder="mail.domain.com" /></div>
                      <div><Label>Port</Label><Input value={serverPort} onChange={(e) => setServerPort(e.target.value)} placeholder="993" /></div>
                    </div>
                    <div><Label>Username</Label><Input value={serverUsername} onChange={(e) => setServerUsername(e.target.value)} placeholder="user@domain.com" /></div>
                    <div><Label>Password</Label><Input type="password" value={serverPassword} onChange={(e) => setServerPassword(e.target.value)} /></div>
                    <div className="flex items-center gap-2">
                      <Switch checked={serverTls} onCheckedChange={setServerTls} />
                      <Label>Use TLS</Label>
                    </div>
                    <Button onClick={handleAddServer} disabled={loading} className="w-full">
                      {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Add Server
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <Card className="bg-card border-border/50">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Protocol</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>Port</TableHead>
                    <TableHead>TLS</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Last Scan</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailServers.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No email servers configured — add one to start monitoring</TableCell></TableRow>
                  ) : emailServers.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell><Badge variant="outline" className="font-mono text-xs">{s.protocol}</Badge></TableCell>
                      <TableCell className="font-mono text-sm">{s.host}</TableCell>
                      <TableCell className="font-mono text-sm">{s.port}</TableCell>
                      <TableCell>{s.use_tls ? <Badge variant="secondary" className="text-xs">TLS</Badge> : "—"}</TableCell>
                      <TableCell>{s.is_active ? <Badge className="bg-cyber-green/20 text-cyber-green text-xs">Active</Badge> : <Badge variant="secondary" className="text-xs">Inactive</Badge>}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.last_scan_at ? new Date(s.last_scan_at).toLocaleString() : "Never"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleScanServer(s.id)} disabled={loading}>
                            <Scan className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteServer(s.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== ENDPOINTS TAB ===== */}
        <TabsContent value="endpoints">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Endpoint Configurations</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleScanEndpoint()} disabled={loading || endpointConfigs.length === 0}>
                {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Scan className="h-4 w-4 mr-1" />}Scan All
              </Button>
              <Dialog open={addEndpointOpen} onOpenChange={setAddEndpointOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Endpoint</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Endpoint to Monitor</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Hostname</Label><Input value={epHostname} onChange={(e) => setEpHostname(e.target.value)} placeholder="server-01" /></div>
                    <div><Label>IP Address</Label><Input value={epIp} onChange={(e) => setEpIp(e.target.value)} placeholder="192.168.1.100" /></div>
                    <div><Label>OS (optional)</Label><Input value={epOs} onChange={(e) => setEpOs(e.target.value)} placeholder="Ubuntu 22.04" /></div>
                    <div>
                      <Label>Monitor Type</Label>
                      <Select value={epMonitorType} onValueChange={setEpMonitorType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ping">Ping</SelectItem>
                          <SelectItem value="http">HTTP</SelectItem>
                          <SelectItem value="ssh">SSH</SelectItem>
                          <SelectItem value="agent">Agent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Scan Interval (minutes)</Label><Input value={epInterval} onChange={(e) => setEpInterval(e.target.value)} placeholder="5" /></div>
                    <Button onClick={handleAddEndpoint} disabled={loading} className="w-full">
                      {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Add Endpoint
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <Card className="bg-card border-border/50">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hostname</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>OS</TableHead>
                    <TableHead>Monitor</TableHead>
                    <TableHead>Interval</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Last Scan</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {endpointConfigs.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No endpoints configured — add network IPs to start monitoring</TableCell></TableRow>
                  ) : endpointConfigs.map((ep) => (
                    <TableRow key={ep.id}>
                      <TableCell className="font-mono text-sm font-medium">{ep.hostname}</TableCell>
                      <TableCell className="font-mono text-sm">{ep.ip_address}</TableCell>
                      <TableCell className="text-sm">{ep.os || "—"}</TableCell>
                      <TableCell><Badge variant="outline" className="font-mono text-xs">{ep.monitor_type}</Badge></TableCell>
                      <TableCell className="text-sm">{ep.scan_interval_minutes}m</TableCell>
                      <TableCell>{ep.is_active ? <Badge className="bg-cyber-green/20 text-cyber-green text-xs">Active</Badge> : <Badge variant="secondary" className="text-xs">Inactive</Badge>}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{ep.last_scan_at ? new Date(ep.last_scan_at).toLocaleString() : "Never"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleScanEndpoint(ep.id)} disabled={loading}>
                            <Scan className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteEndpoint(ep.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== VISITOR STATS TAB ===== */}
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

        {/* ===== AUDIT LOGS TAB ===== */}
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
