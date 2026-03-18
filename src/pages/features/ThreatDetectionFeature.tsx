import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldAlert, Shield, Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { FloatingAIBot } from "@/components/FloatingAIBot";
import { useTheme } from "@/contexts/ThemeContext";

export default function ThreatDetectionFeature() {
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
              <ShieldAlert className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Threat Detection</h1>
              <p className="text-muted-foreground">Real-time identification and classification of security threats</p>
            </div>
          </div>

          <div className="space-y-8">
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <h2 className="text-xl font-semibold mb-3 text-primary">What It Does</h2>
              <p className="text-muted-foreground leading-relaxed">
                Threat Detection identifies and classifies security threats across your infrastructure in real time. It monitors for phishing attempts, malware delivery, spoofing attacks, spam campaigns, and other malicious activities targeting your domain. Every detected threat is categorized by severity, tracked through its lifecycle, and correlated with other events to provide a complete picture of your security posture.
              </p>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border/50">
              <h2 className="text-xl font-semibold mb-3 text-primary">How It Works</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The system uses multi-layered analysis combining multiple detection methodologies:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { method: "Signature-Based Detection", desc: "Compares incoming data against known threat signatures and indicators of compromise (IoCs) from global threat intelligence feeds." },
                  { method: "Heuristic Analysis", desc: "Uses rule-based algorithms to identify suspicious patterns that may indicate new or unknown threats not yet in signature databases." },
                  { method: "Behavioral Analysis", desc: "Monitors communication patterns and user behavior to detect anomalies that deviate from established baselines." },
                  { method: "Domain Validation", desc: "Checks SPF, DKIM, and DMARC records to verify sender authenticity and detect domain spoofing attempts." },
                ].map((p) => (
                  <div key={p.method} className="p-4 rounded-lg bg-secondary/30 border border-border/30">
                    <h3 className="font-semibold text-sm mb-1">{p.method}</h3>
                    <p className="text-xs text-muted-foreground">{p.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Threats are classified by severity (Critical, High, Medium, Low) and tracked from detection through investigation to resolution. Automated alerts notify security teams of critical threats immediately.
              </p>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border/50">
              <h2 className="text-xl font-semibold mb-3 text-primary">Key Metrics Tracked</h2>
              <ul className="space-y-2 text-muted-foreground">
                {[
                  "Active vs resolved threats with lifecycle tracking",
                  "Severity distribution (Critical/High/Medium/Low)",
                  "Threat source identification and geolocation",
                  "Mean time to detect (MTTD) and mean time to resolve (MTTR)",
                  "Threat type classification (phishing, malware, spoofing, spam)",
                  "False positive rates and tuning recommendations",
                  "Attack vector analysis and trending patterns",
                  "Correlated events and threat chain mapping",
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
                Get Started with Threat Detection
              </Button>
            </div>
          </div>
        </motion.div>
      </main>
      <FloatingAIBot />
    </div>
  );
}
