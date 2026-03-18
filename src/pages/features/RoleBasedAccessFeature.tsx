import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, Shield, Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { FloatingAIBot } from "@/components/FloatingAIBot";
import { useTheme } from "@/contexts/ThemeContext";

export default function RoleBasedAccessFeature() {
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
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Role-Based Access Control</h1>
              <p className="text-muted-foreground">Granular permissions for every team member</p>
            </div>
          </div>

          <div className="space-y-8">
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <h2 className="text-xl font-semibold mb-3 text-primary">What It Does</h2>
              <p className="text-muted-foreground leading-relaxed">
                Role-Based Access Control (RBAC) ensures that every user in NAZAR has precisely the permissions they need — no more, no less. This follows the principle of least privilege, a cornerstone of zero trust security. Each user is assigned one or more roles that determine what data they can view, what actions they can perform, and which administrative functions they can access.
              </p>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border/50">
              <h2 className="text-xl font-semibold mb-3 text-primary">Available Roles</h2>
              <div className="space-y-4">
                {[
                  {
                    role: "Admin",
                    desc: "Full system access including user management, role assignment, system configuration, and audit log review. Admins can view all data, manage all users, generate reports, and configure security policies.",
                    color: "text-red-500",
                  },
                  {
                    role: "Analyst",
                    desc: "Access to security monitoring dashboards, threat investigation tools, email monitoring data, and report generation. Analysts can investigate threats, update threat statuses, and create security reports but cannot manage users or system settings.",
                    color: "text-yellow-500",
                  },
                  {
                    role: "Viewer",
                    desc: "Read-only access to dashboards and reports. Viewers can see security metrics, view threat summaries, and download existing reports but cannot modify any data or investigate threats.",
                    color: "text-blue-500",
                  },
                ].map((r) => (
                  <div key={r.role} className="p-4 rounded-lg bg-secondary/30 border border-border/30">
                    <h3 className={`font-semibold mb-1 ${r.color}`}>{r.role}</h3>
                    <p className="text-sm text-muted-foreground">{r.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="p-6 rounded-xl bg-card border border-border/50">
              <h2 className="text-xl font-semibold mb-3 text-primary">How It Works</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                RBAC is enforced at every layer of the system:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                {[
                  "Database-level Row Level Security (RLS) policies ensure data access rules are enforced server-side",
                  "API-level middleware validates user roles before processing any request",
                  "UI-level route protection hides pages and actions the user doesn't have permission for",
                  "Audit logging tracks all role changes, access attempts, and administrative actions",
                  "Role assignments are stored securely and validated on every authenticated request",
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
                Get Started with NAZAR
              </Button>
            </div>
          </div>
        </motion.div>
      </main>
      <FloatingAIBot />
    </div>
  );
}
