import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SeverityBadge } from "@/components/SeverityBadge";
import { Shield, AlertTriangle, Server, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { Tables } from "@/integrations/supabase/types";

const COLORS = ["hsl(0,72%,51%)", "hsl(38,92%,50%)", "hsl(174,100%,42%)", "hsl(142,76%,45%)"];

export default function Dashboard() {
  const [events, setEvents] = useState<Tables<"security_events">[]>([]);
  const [alerts, setAlerts] = useState<Tables<"threat_alerts">[]>([]);
  const [endpoints, setEndpoints] = useState<Tables<"endpoints">[]>([]);
  const [appUptime, setAppUptime] = useState("—");

  useEffect(() => {
    supabase.from("security_events").select("*").order("created_at", { ascending: false }).limit(50).then(({ data }) => data && setEvents(data));
    supabase.from("threat_alerts").select("*").order("detected_at", { ascending: false }).limit(20).then(({ data }) => data && setAlerts(data));
    supabase.from("endpoints").select("*").then(({ data }) => data && setEndpoints(data));
    
    // Calculate app uptime from earliest security event
    supabase.from("security_events").select("created_at").order("created_at", { ascending: true }).limit(1).then(({ data }) => {
      if (data && data.length > 0) {
        const earliest = new Date(data[0].created_at);
        const now = new Date();
        const diffMs = now.getTime() - earliest.getTime();
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        setAppUptime(`${days}d ${hours}h`);
      }
    });
  }, []);

  const activeIncidents = alerts.filter((a) => !a.resolved).length;
  const secureEndpoints = endpoints.filter((e) => e.status === "secure").length;
  const riskScore = endpoints.length > 0 ? Math.round(((endpoints.length - secureEndpoints) / endpoints.length) * 100) : 0;

  const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  events.forEach((e) => severityCounts[e.severity]++);
  const pieData = Object.entries(severityCounts).map(([name, value]) => ({ name, value }));

  const timeData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const day = d.toLocaleDateString("en", { weekday: "short" });
    const count = events.filter((e) => new Date(e.created_at).toDateString() === d.toDateString()).length;
    return { day, events: count };
  });

  const stats = [
    { label: "App Uptime", value: appUptime, icon: Activity, color: "text-cyber-green" },
    { label: "Active Incidents", value: activeIncidents.toString(), icon: AlertTriangle, color: activeIncidents > 0 ? "text-cyber-red" : "text-cyber-green" },
    { label: "Monitored Endpoints", value: endpoints.length.toString(), icon: Server, color: "text-primary" },
    { label: "Risk Score", value: `${riskScore}%`, icon: Shield, color: riskScore > 50 ? "text-cyber-red" : riskScore > 25 ? "text-cyber-amber" : "text-cyber-green" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Security Command Center</h1>
        <p className="text-sm text-muted-foreground">Real-time zero trust monitoring overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="bg-card border-border/50 cyber-gradient">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-mono uppercase">{s.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                </div>
                <s.icon className={`h-8 w-8 ${s.color} opacity-40`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 bg-card border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-mono">Event Timeline (7 Days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={timeData}>
                <defs><linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(174,100%,42%)" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(174,100%,42%)" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,14%)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(220,10%,50%)" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(220,10%,50%)" }} />
                <Tooltip contentStyle={{ background: "hsl(220,18%,7%)", border: "1px solid hsl(220,15%,14%)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="events" stroke="hsl(174,100%,42%)" fill="url(#cyanGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-mono">Severity Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(220,18%,7%)", border: "1px solid hsl(220,15%,14%)", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1 text-[10px]">
                  <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="capitalize text-muted-foreground">{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border/50">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-mono">Priority Incidents</CardTitle></CardHeader>
        <CardContent>
          {alerts.filter((a) => !a.resolved).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No active incidents — all clear ✓</p>
          ) : (
            <div className="space-y-2">
              {alerts.filter((a) => !a.resolved).slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/30">
                  <div className="flex items-center gap-3">
                    <SeverityBadge severity={a.severity} />
                    <div>
                      <p className="text-sm font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.source} · {new Date(a.detected_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
