import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Shield, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && isAdmin) {
      navigate("/dashboard", { replace: true });
    } else if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Map username to admin email format
    const email = username.includes("@") ? username : `${username}@nazar.security`;

    const { error } = await signIn(email, password);
    if (error) {
      toast.error("Invalid admin credentials");
    } else {
      navigate("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-destructive/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-sm relative">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 cyber-glow">
              <Lock className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wider text-primary cyber-glow-text">NAZAR</h1>
            <p className="text-sm text-muted-foreground mt-1">Admin Access Portal</p>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Admin Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="bg-secondary/50 border-border"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-secondary/50 border-border"
            />

            <Button type="submit" className="w-full font-semibold" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Shield className="mr-2 h-4 w-4" />
              Admin Sign In
            </Button>

            <div className="text-center">
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-primary"
                onClick={() => navigate("/login")}
              >
                ← Back to User Login
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
