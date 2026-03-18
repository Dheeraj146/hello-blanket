import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Server, Shield, Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { FloatingAIBot } from "@/components/FloatingAIBot";
import { useTheme } from "@/contexts/ThemeContext";

export default function EndpointMonitoringFeature() {
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
              <Server className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Endpoint Monitoring</h1>
              <p className="text-muted-foreground">Continuous surveillance of all network-connected devices</p>
            </div>
          </div>

          <div className="space-y-8">
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <h2 className="text-xl font-semibold mb-3 text-primary">What It Does</h2>
              <p className="text-muted-foreground leading-relaxed">
                Endpoint Monitoring provides continuous surveillance of all network-connected devices and servers in your infrastructure. It tracks device health, agent status, operating system information, and the security posture of each endpoint. This ensures that every device in your network is accounted for, compliant with security policies, and free from active threats.
              </p>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border/50">
              <h2 className="text-xl font-semibold mb-3 text-primary">How It Works</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Lightweight monitoring agents are deployed on each endpoint. These agents continuously report back to the central dashboard:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { status: "Secure", desc: "Fully compliant with all security policies. Agent is up-to-date, no threats detected, all patches applied.", color: "text-green-500" },
                  { status: "Warning", desc: "Minor issues detected such as outdated agent versions, pending patches, or unusual but non-critical activity.", color: "text-yellow-500" },
                  { status: "Critical", desc: "Active threats detected, major vulnerabilities found, or significant policy violations requiring immediate attention.", color: "text-red-500" },
                  { status: "Offline", desc: "Endpoint is unreachable. Could indicate network issues, device shutdown, or potential compromise.", color: "text-muted-foreground" },
                ].map((s) => (
                  <div key={s.status} className="p-4 rounded-lg bg-secondary/30 border border-border/30">
                    <h3 className={`font-semibold text-sm mb-1 ${s.color}`}>{s.status}</h3>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground leading-relaxed mt-4">
                The system tracks last-seen timestamps to detect offline endpoints quickly and triggers alerts when endpoints go dark unexpectedly. All endpoint data is correlated with threat intelligence to identify compromised devices.
              </p>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border/50">
              <h2 className="text-xl font-semibold mb-3 text-primary">Key Metrics Tracked</h2>
              <ul className="space-y-2 text-muted-foreground">
                {[
                  "Total endpoints under surveillance with status breakdown",
                  "Status distribution (Secure/Warning/Critical/Offline)",
                  "Operating system inventory and version tracking",
                  "Agent version compliance and update status",
                  "Last-seen timestamps and uptime percentages",
                  "IP address mapping and network topology",
                  "Hostname registry and asset management",
                  "Vulnerability scan results per endpoint",
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
                Get Started with Endpoint Monitoring
              </Button>
            </div>
          </div>
        </motion.div>
      </main>
      <FloatingAIBot />
    </div>
  );
}
