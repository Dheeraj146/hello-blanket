import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Shield, Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { FloatingAIBot } from "@/components/FloatingAIBot";
import { useTheme } from "@/contexts/ThemeContext";

export default function EmailMonitoringFeature() {
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
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Email Monitoring</h1>
              <p className="text-muted-foreground">Complete visibility into your organization's email traffic</p>
            </div>
          </div>

          <div className="space-y-8">
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <h2 className="text-xl font-semibold mb-3 text-primary">What It Does</h2>
              <p className="text-muted-foreground leading-relaxed">
                Email Monitoring tracks every sent and received email across your domain in real time. It captures metadata including sender, recipient, subject, protocol, size, attachment status, and delivery outcome — giving you full visibility into your organization's email traffic. This enables security teams to detect anomalies, track communication patterns, and identify potential data exfiltration attempts before they cause damage.
              </p>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border/50">
              <h2 className="text-xl font-semibold mb-3 text-primary">How It Works</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The system integrates with multiple email protocols to provide comprehensive coverage:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { proto: "SMTP", desc: "Simple Mail Transfer Protocol — monitors outgoing email delivery, relay paths, and server responses." },
                  { proto: "IMAP", desc: "Internet Message Access Protocol — tracks mailbox access, folder operations, and message synchronization." },
                  { proto: "POP3", desc: "Post Office Protocol — monitors email downloads, deletion events, and client connections." },
                  { proto: "Exchange", desc: "Microsoft Exchange — integrates with Exchange Web Services for enterprise mailbox monitoring." },
                ].map((p) => (
                  <div key={p.proto} className="p-4 rounded-lg bg-secondary/30 border border-border/30">
                    <h3 className="font-semibold text-sm mb-1">{p.proto}</h3>
                    <p className="text-xs text-muted-foreground">{p.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Each email transaction is logged with its protocol, direction (inbound/outbound), delivery status, and associated IP address. Emails are automatically scanned for threats, spam content, and suspicious attachments using multi-layered analysis.
              </p>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border/50">
              <h2 className="text-xl font-semibold mb-3 text-primary">Key Metrics Tracked</h2>
              <ul className="space-y-2 text-muted-foreground">
                {[
                  "Total email volume (inbound vs outbound)",
                  "Delivery success/failure rates",
                  "Protocol distribution (SMTP, IMAP, Exchange, POP3)",
                  "Spam score analysis and filtering rates",
                  "Attachment tracking and file type analysis",
                  "Threat detection rates and false positive ratios",
                  "Email size distribution and bandwidth usage",
                  "Blocked and quarantined message counts",
                  "Sender/recipient reputation scoring",
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
                Get Started with Email Monitoring
              </Button>
            </div>
          </div>
        </motion.div>
      </main>
      <FloatingAIBot />
    </div>
  );
}
