import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const configured = isSupabaseConfigured();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!configured) {
      toast.error("Supabase non è configurato. Aggiungi le variabili su Cloudflare Pages.");
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      toast.error("Inserisci una email valida.");
      return;
    }
    if (password.length < 8) {
      toast.error("La password deve avere almeno 8 caratteri.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      if (data.session) {
        toast.success("Account creato");
        void navigate({ to: "/" });
      } else {
        toast.success("Account creato — controlla la mail per confermare.");
        void navigate({ to: "/login" });
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">Crea account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Registrati per salvare i tuoi caroselli.
        </p>
        {!configured && (
          <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            ⚠️ Supabase non configurato. Le credenziali <code>VITE_SUPABASE_URL</code> e{" "}
            <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> devono essere impostate come{" "}
            <strong>Build variables</strong> su Cloudflare Pages.
          </div>
        )}
        {!configured && (
          <Button className="mt-4 w-full" onClick={() => void navigate({ to: "/" })}>
            Continua in modalità locale
          </Button>
        )}
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
            />
            <p className="text-xs text-muted-foreground">Almeno 8 caratteri.</p>
          </div>
          <Button type="submit" disabled={loading || !configured} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crea account
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Hai già un account?{" "}
          <Link to="/login" className="font-medium text-foreground hover:underline">
            Accedi
          </Link>
        </p>
      </div>
    </div>
  );
}
