import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, Shield, Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { FloatingAIBot } from "@/components/FloatingAIBot";
import { useTheme } from "@/contexts/ThemeContext";

export default function ReportsAnalyticsFeature() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between p-6 max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button onClick={() => navigate("/login")} variant="outline" className="border-primary/30 hover:bg-primary/10">Sign In</Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Reports & Analytics</h1>
              <p className="text-muted-foreground">Comprehensive security intelligence and reporting</p>
            </div>
          </div>

          <div className="space-y-8">
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <h2 className="text-xl font-semibold mb-3 text-primary">What It Does</h2>
              <p className="text-muted-foreground leading-relaxed">
                Reports & Analytics provides comprehensive security intelligence through interactive dashboards, trend analysis, and exportable PDF reports. It aggregates data from email monitoring, threat detection, and endpoint surveillance to deliver actionable insights that help security teams make informed decisions and demonstrate compliance.
              </p>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border/50">
              <h2 className="text-xl font-semibold mb-3 text-primary">How It Works</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The analytics engine continuously processes security events and generates insights:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { feature: "Real-Time Dashboards", desc: "Live-updating charts and metrics showing current security posture, active threats, and system health at a glance." },
                  { feature: "Trend Analysis", desc: "14-day and 30-day event volume analysis identifying patterns, spikes, and emerging threat trends over time." },
                  { feature: "PDF Export", desc: "One-click generation of professional PDF reports with executive summaries, detailed findings, and compliance data." },
                  { feature: "Event Correlation", desc: "Cross-references events from multiple data sources to identify complex attack patterns and reduce false positives." },
                ].map((f) => (
                  <div key={f.feature} className="p-4 rounded-lg bg-secondary/30 border border-border/30">
                    <h3 className="font-semibold text-sm mb-1">{f.feature}</h3>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border/50">
              <h2 className="text-xl font-semibold mb-3 text-primary">Key Metrics Tracked</h2>
              <ul className="space-y-2 text-muted-foreground">
                {[
                  "Event volume trends over configurable time periods",
                  "Top event categories and severity distributions",
                  "Threat detection and resolution rates",
                  "Email traffic volume and delivery statistics",
                  "Endpoint compliance and health scores",
                  "Automated report generation and scheduling",
                  "Custom metric dashboards and KPI tracking",
                ].map((m) => (
                  <li key={m} className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{m}</span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="flex justify-center pt-4">
              <Button size="lg" onClick={() => navigate("/login")} className="font-semibold">
                Get Started with Reports & Analytics
              </Button>
            </div>
          </div>
        </motion.div>
      </main>
      <FloatingAIBot />
    </div>
  );
}
