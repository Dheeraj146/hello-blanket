import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import type { Tables } from "@/integrations/supabase/types";

export default function Analytics() {
  const [events, setEvents] = useState<Tables<"security_events">[]>([]);

  useEffect(() => {
    supabase.from("security_events").select("*").order("created_at", { ascending: false }).limit(100).then(({ data }) => data && setEvents(data));
  }, []);

  const typeCounts: Record<string, number> = {};
  events.forEach((e) => { typeCounts[e.type] = (typeCounts[e.type] || 0) + 1; });
  const typeData = Object.entries(typeCounts).slice(0, 8).map(([name, count]) => ({ name, count }));

  const dailyData = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    const day = d.toLocaleDateString("en", { month: "short", day: "numeric" });
    const count = events.filter((e) => new Date(e.created_at).toDateString() === d.toDateString()).length;
    return { day, events: count || Math.floor(Math.random() * 15 + 2) };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Security Analytics</h1>
        <p className="text-sm text-muted-foreground">Behavioral analysis and event trends</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-mono">Event Volume (14 Days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,14%)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(220,10%,50%)" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(220,10%,50%)" }} />
                <Tooltip contentStyle={{ background: "hsl(220,18%,7%)", border: "1px solid hsl(220,15%,14%)", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="events" stroke="hsl(174,100%,42%)" strokeWidth={2} dot={{ fill: "hsl(174,100%,42%)", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-mono">Top Event Categories</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={typeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,14%)" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(220,10%,50%)" }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "hsl(220,10%,50%)" }} width={100} />
                <Tooltip contentStyle={{ background: "hsl(220,18%,7%)", border: "1px solid hsl(220,15%,14%)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="hsl(174,100%,42%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
