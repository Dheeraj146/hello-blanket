import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Mail, Server, BarChart3, Lock, ShieldAlert, Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { FloatingAIBot } from "@/components/FloatingAIBot";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";

const features = [
  { icon: Mail, title: "Email Monitoring", desc: "Track all sent & received emails across SMTP, IMAP, and Exchange protocols", link: "/features/email-monitoring" },
  { icon: ShieldAlert, title: "Threat Detection", desc: "Real-time phishing, spam, malware, and spoofing detection", link: "/features/threat-detection" },
  { icon: Server, title: "Endpoint Monitoring", desc: "Continuous surveillance of all network endpoints", link: "/features/endpoint-monitoring" },
  { icon: BarChart3, title: "Reports & Analytics", desc: "Comprehensive security analytics with PDF exports", link: "/features/reports-analytics" },
  { icon: Lock, title: "Role-Based Access", desc: "Admin, analyst, and viewer role controls", link: "/features/role-based-access" },
];

export default function Index() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[300px] bg-destructive/5 rounded-full blur-3xl" />
      </div>

      <header className="relative z-10 flex items-center justify-between p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="font-bold tracking-wider text-primary cyber-glow-text">NAZAR</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button onClick={() => navigate("/login")} variant="outline" className="border-primary/30 hover:bg-primary/10">
            Sign In
          </Button>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-32 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            <span className="text-primary cyber-glow-text">Zero Trust</span>{" "}
            <span className="text-foreground">Monitoring</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Enterprise-grade zero trust security monitoring with real-time threat detection, email surveillance, and AI-powered insights for your domain.
          </p>
          <div className="flex gap-3 justify-center">
            <Button size="lg" onClick={() => navigate("/login")} className="font-semibold">
              <Shield className="mr-2 h-4 w-4" /> Get Started
            </Button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto text-left">
          {features.map((f) => (
            <div
              key={f.title}
              onClick={() => navigate(f.link)}
              className="p-5 rounded-xl bg-card/50 border border-border/30 hover:border-primary/30 transition-colors group cursor-pointer"
            >
              <f.icon className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>

      <FloatingAIBot />
    </div>
  );
}
