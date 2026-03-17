import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Eye, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isForgot) {
      const { error } = await resetPassword(email);
      if (error) toast.error(error.message);
      else toast.success("Check your email for reset link");
      setLoading(false);
      return;
    }

    if (isSignUp) {
      const { error } = await signUp(email, password, displayName);
      if (error) toast.error(error.message);
      else toast.success("Check your email to confirm your account");
    } else {
      const { error } = await signIn(email, password);
      if (error) toast.error(error.message);
      else navigate("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyber-purple/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-sm relative">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 cyber-glow">
              <Eye className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wider text-primary cyber-glow-text">CYBER EYE</h1>
            <p className="text-sm text-muted-foreground mt-1">Zero Trust Monitoring Dashboard</p>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && !isForgot && (
              <Input
                placeholder="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-secondary/50 border-border"
              />
            )}
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-secondary/50 border-border"
            />
            {!isForgot && (
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-secondary/50 border-border"
              />
            )}

            <Button type="submit" className="w-full font-semibold" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Shield className="mr-2 h-4 w-4" />
              {isForgot ? "Send Reset Link" : isSignUp ? "Create Account" : "Sign In"}
            </Button>

            <div className="flex justify-between text-xs">
              <button type="button" className="text-primary hover:underline" onClick={() => { setIsForgot(false); setIsSignUp(!isSignUp); }}>
                {isSignUp ? "Already have an account?" : "Create account"}
              </button>
              {!isSignUp && (
                <button type="button" className="text-muted-foreground hover:text-primary" onClick={() => setIsForgot(!isForgot)}>
                  {isForgot ? "Back to login" : "Forgot password?"}
                </button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
