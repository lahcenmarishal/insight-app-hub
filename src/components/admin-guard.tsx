import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock, LogOut, ShieldAlert, Loader2, ArrowLeft } from "lucide-react";

type State =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "denied"; email: string }
  | { status: "admin"; email: string };

export function AdminGuard({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function checkUser(user: { id: string; email?: string | null } | null) {
      if (cancelled) return;
      if (!user) return setState({ status: "guest" });
      const { data: isAdmin, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (cancelled) return;
      if (error) {
        console.error(error);
        return setState({ status: "denied", email: user.email ?? "" });
      }
      setState(
        isAdmin
          ? { status: "admin", email: user.email ?? "" }
          : { status: "denied", email: user.email ?? "" },
      );
    }

    // Initial check from cached session (no network round-trip, no deadlock)
    supabase.auth.getSession().then(({ data }) => {
      checkUser(data.session?.user ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // Do not await inside the callback — fire and forget
      setState({ status: "loading" });
      checkUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (state.status === "guest") {
    return <LoginScreen />;
  }

  if (state.status === "denied") {
    return (
      <div className="min-h-screen grid place-items-center bg-background p-6">
        <div className="max-w-md w-full bg-card border rounded-2xl p-8 text-center shadow-[var(--shadow-md)]">
          <div className="grid place-items-center h-12 w-12 rounded-full bg-destructive/10 text-destructive mx-auto mb-4">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="font-display text-xl font-bold mb-1">Accès refusé</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Le compte <span className="font-semibold">{state.email}</span> n'a pas le rôle administrateur.
          </p>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90"
          >
            <LogOut className="h-4 w-4" /> Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function LoginScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Connecté");
    navigate("/app");
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <form
        onSubmit={submit}
        className="max-w-sm w-full bg-card border rounded-2xl p-8 shadow-[var(--shadow-md)]"
      >
        <div className="grid place-items-center h-12 w-12 rounded-full bg-[image:var(--gradient-accent)] text-primary-foreground mx-auto mb-4">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="font-display text-xl font-bold text-center mb-1">Connexion administrateur</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Espace réservé aux administrateurs Innova Lab.
        </p>
        <label className="block text-xs font-semibold mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full mb-4 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <label className="block text-xs font-semibold mb-1">Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="w-full mb-6 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[image:var(--gradient-accent)] text-primary-foreground py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}