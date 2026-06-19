import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Boxes, Users, Settings, Search, Bell, Truck, FileText, BarChart3, LogOut, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import type { ReactNode } from "react";

const LOGO_URL = "/assets/innova-logo.png";

const nav = [
  { to: "/app", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/admin/produits", label: "Produits", icon: Boxes },
  { to: "/admin/fournisseurs", label: "Fournisseurs", icon: Truck },
  { to: "/prospects", label: "Prospects", icon: Users },
  { to: "/admin/devis", label: "Devis", icon: FileText },
  { to: "/admin/stats", label: "Statistiques", icon: BarChart3 },
  { to: "/parametres", label: "Paramètres", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/admin" });
  }


  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <div className="flex items-center justify-center px-4 py-5 border-b border-sidebar-border bg-white">
          <img src={LOGO_URL} alt="Innova Lab Solutions" className="h-14 w-auto object-contain" />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => {
            const active = item.to === "/app" ? pathname === "/app" || pathname === "/app/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-sidebar-border text-xs text-sidebar-foreground/50">
          Innova Souss Import Export SARL<br />v1.0 — Mode démo
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 flex items-center gap-4 bg-surface/90 backdrop-blur border-b px-4 md:px-8 py-3">
          <div className="lg:hidden flex items-center gap-2">
            <img src={LOGO_URL} alt="Innova Lab Solutions" className="h-8 w-auto object-contain" />
          </div>

          <div className="hidden lg:flex flex-1 max-w-xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher un produit, une référence, une marque…"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface-muted border border-transparent focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 text-sm"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="grid place-items-center h-9 w-9 rounded-lg bg-surface-muted text-muted-foreground hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="grid place-items-center h-9 w-9 rounded-lg bg-surface-muted text-muted-foreground hover:text-destructive"
              aria-label="Déconnexion"
              title="Déconnexion"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>


        <main className="flex-1 px-4 md:px-8 py-6 md:py-8">{children}</main>

        <nav className="lg:hidden sticky bottom-0 z-20 bg-sidebar text-sidebar-foreground border-t border-sidebar-border grid grid-cols-5">
          {nav.map((item) => {
            const active = item.to === "/app" ? pathname === "/app" || pathname === "/app/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center justify-center py-2 text-[10px] gap-0.5",
                  active ? "text-sidebar-primary" : "text-sidebar-foreground/70",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate max-w-full px-1">{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
