import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Eye, Shield, Server, BarChart3, Bot, Lock } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { icon: Shield, title: "Zero Trust Security", desc: "Continuous verification of every user, device, and connection" },
  { icon: Server, title: "Endpoint Monitoring", desc: "Real-time surveillance of all network endpoints" },
  { icon: BarChart3, title: "Analytics & Reports", desc: "Comprehensive security analytics with PDF exports" },
  { icon: Bot, title: "AI Security Assistant", desc: "NVIDIA-powered AI for threat analysis guidance" },
  { icon: Lock, title: "Role-Based Access", desc: "Admin, analyst, and viewer role controls" },
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[300px] bg-cyber-purple/5 rounded-full blur-3xl" />
      </div>

      <header className="relative z-10 flex items-center justify-between p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Eye className="h-6 w-6 text-primary" />
          <span className="font-bold tracking-wider text-primary cyber-glow-text">CYBER EYE</span>
        </div>
        <Button onClick={() => navigate("/login")} variant="outline" className="border-primary/30 hover:bg-primary/10">
          Sign In
        </Button>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-32 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            <span className="text-primary cyber-glow-text">Zero Trust</span>{" "}
            <span className="text-foreground">Monitoring</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Enterprise-grade cybersecurity dashboard with real-time threat detection, endpoint monitoring, and AI-powered analysis.
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
            <div key={f.title} className="p-5 rounded-xl bg-card/50 border border-border/30 hover:border-primary/30 transition-colors group">
              <f.icon className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
