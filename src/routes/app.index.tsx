import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { AdminGuard } from "@/components/admin-guard";
import { prospectsSeed } from "@/data/catalog";
import { useCatalog } from "@/lib/catalog-data";
import {
  Package, FolderTree, Tag, Users, FileText, ArrowRight, Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Tableau de bord Admin — Innova Lab Solutions" },
      { name: "description", content: "Espace d'administration : gestion du catalogue, prospects et demandes de devis." },
    ],
  }),
  component: () => (<AdminGuard><AdminDashboard /></AdminGuard>),
});

const today = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());

function AdminDashboard() {
  const { categories, products } = useCatalog();
  const brandsCount = new Set(products.map((p) => p.brand)).size;
  const totalDevis = prospectsSeed.reduce((s, p) => s + (p.quoteCount ?? 0), 0);

  const stats = [
    { icon: Package, label: "Produits", value: products.length, hint: "Catalogue actif", to: "/admin/produits" },
    { icon: FolderTree, label: "Catégories", value: categories.length, hint: "Familles produits", to: "/catalogue" },
    { icon: Tag, label: "Marques", value: brandsCount, hint: "Fournisseurs", to: "/admin/fournisseurs" },
    { icon: Users, label: "Prospects", value: prospectsSeed.length, hint: "Fiches CRM", to: "/prospects" },
    { icon: FileText, label: "Devis", value: totalDevis, hint: "Demandes générées", to: "/prospects" },
  ];

  const shortcuts = [
    { icon: Package, label: "Gérer les produits", hint: "Créer, modifier, archiver", to: "/admin/produits" },
    { icon: FolderTree, label: "Catalogue", hint: "Parcourir par catégorie", to: "/catalogue" },
    { icon: Users, label: "Prospects & clients", hint: "CRM commercial", to: "/prospects" },
    { icon: Settings, label: "Paramètres", hint: "Coordonnées du site", to: "/parametres" },
  ];

  return (
    <AppShell>
      <section className="mb-8">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Espace admin</div>
        <h1 className="font-display text-2xl md:text-3xl font-bold leading-tight">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground capitalize mt-1">{today}</p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </section>

      {/* Raccourcis gestion */}
      <section className="mb-10">
        <h2 className="font-display text-lg font-bold mb-4">Gestion rapide</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {shortcuts.map((s) => (
            <Link
              key={s.label}
              to={s.to}
              className="group rounded-xl bg-card border p-5 hover:border-accent hover:shadow-[var(--shadow-md)] transition-all flex flex-col gap-3"
            >
              <div className="grid place-items-center h-11 w-11 rounded-lg bg-[image:var(--gradient-primary)] text-primary-foreground group-hover:scale-110 transition-transform">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display font-semibold text-sm">{s.label}</div>
                <div className="text-xs text-muted-foreground">{s.hint}</div>
              </div>
              <div className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all">
                Ouvrir <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Devis récents */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="font-display text-lg font-bold">Activité prospects récente</h2>
            <p className="text-sm text-muted-foreground">Derniers contacts enregistrés</p>
          </div>
          <Link to="/prospects" className="text-sm font-medium text-accent hover:underline inline-flex items-center gap-1">
            Voir tout <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="bg-card rounded-xl border divide-y">
          {prospectsSeed.slice(0, 5).map((p) => (
            <div key={p.id} className="flex items-center gap-4 p-4">
              <div className="grid place-items-center h-10 w-10 rounded-lg bg-primary/10 text-primary shrink-0 font-semibold text-sm">
                {p.company.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm truncate">{p.company}</div>
                <div className="text-xs text-muted-foreground truncate">{p.contact} · {p.city}</div>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-accent/10 text-accent shrink-0">{p.status}</span>
              <span className="hidden md:inline text-xs text-muted-foreground shrink-0">{p.quoteCount ?? 0} devis</span>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function StatCard({ icon: Icon, label, value, hint, to }: { icon: LucideIcon; label: string; value: number; hint: string; to: string }) {
  return (
    <Link to={to} className="rounded-xl bg-card border p-5 hover:border-accent hover:shadow-[var(--shadow-md)] transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</div>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="font-display text-2xl font-bold mb-1">{value}</div>
      <div className="text-xs text-muted-foreground">{hint}</div>
    </Link>
  );
}
