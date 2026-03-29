import { useState } from "react";
import { useLocation } from "wouter";
import { useVetLogin } from "@workspace/api-client-react";
import { useVetAuth } from "@/hooks/use-vet-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stethoscope, Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function VetLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useVetAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { mutate, isPending } = useVetLogin({
    mutation: {
      onSuccess(data) {
        login(data.token, data.vet);
        navigate("/vet");
      },
      onError() {
        toast({
          title: "Login failed",
          description: "Invalid username or password.",
          variant: "destructive",
        });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    mutate({ data: { username, password } });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Stethoscope className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Vet Portal Login</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Access the veterinarian dashboard to manage pet health records
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(v => !v)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Sign In as Vet
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-border">
            <div className="flex items-start gap-3 text-sm text-muted-foreground bg-muted/40 rounded-xl p-3">
              <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
              <div>
                <p className="font-medium text-foreground">Demo credentials</p>
                <p className="mt-0.5">Username: <code className="bg-muted px-1 rounded">vetdemo</code></p>
                <p>Password: <code className="bg-muted px-1 rounded">vet1234</code></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
