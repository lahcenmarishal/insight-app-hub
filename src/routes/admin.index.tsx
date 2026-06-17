import { AdminGuard } from "@/components/admin-guard";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { prospectsSeed } from "@/data/catalog";
import { useCatalog } from "@/lib/catalog-data";
import { Package, FolderTree, Users, FileText, Tag, Database, Boxes, ArrowRight, CheckCircle2, Circle, Cloud, Truck } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Administration — Innova Lab Solutions" },
      { name: "description", content: "Gestion du catalogue, des prospects et des devis." },
    ],
  }),
  component: () => (<AdminGuard><AdminPage /></AdminGuard>),
});

function AdminPage() {
  const { categories, products } = useCatalog();
  const sections = [
    { icon: Package, label: "Produits", value: products.length, hint: "Catalogue complet" },
    { icon: FolderTree, label: "Catégories", value: categories.length, hint: "Familles produits" },
    { icon: Tag, label: "Marques", value: new Set(products.map(p => p.brand)).size, hint: "Fournisseurs référencés" },
    { icon: Users, label: "Prospects", value: prospectsSeed.length, hint: "Fiches CRM" },
    { icon: FileText, label: "Devis", value: prospectsSeed.reduce((s, p) => s + (p.quoteCount ?? 0), 0), hint: "Demandes générées" },
    { icon: Database, label: "Documents PDF", value: 0, hint: "Fiches techniques" },
  ];

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">Administration</h1>
        <p className="text-muted-foreground">Gérez l'ensemble de votre écosystème commercial.</p>
      </div>

      <Link
        to="/admin/produits"
        className="group flex items-center gap-4 rounded-xl bg-card border p-5 mb-8 hover:border-accent hover:shadow-[var(--shadow-md)] transition-all"
      >
        <div className="grid place-items-center h-12 w-12 rounded-lg bg-[image:var(--gradient-accent)] text-primary-foreground">
          <Boxes className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <div className="font-display font-bold">Gestion des produits</div>
          <div className="text-sm text-muted-foreground">Créer, modifier et archiver les produits du catalogue.</div>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
      </Link>

      <Link
        to="/admin/fournisseurs"
        className="group flex items-center gap-4 rounded-xl bg-card border p-5 mb-8 hover:border-accent hover:shadow-[var(--shadow-md)] transition-all"
      >
        <div className="grid place-items-center h-12 w-12 rounded-lg bg-[image:var(--gradient-accent)] text-primary-foreground">
          <Truck className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <div className="font-display font-bold">Fournisseurs &amp; marges</div>
          <div className="text-sm text-muted-foreground">Référencer les fournisseurs, saisir prix d'achat / vente et suivre les marges.</div>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
      </Link>

      <div className="rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground p-6 mb-8 shadow-[var(--shadow-lg)]">
        <div className="flex items-center gap-2 mb-1">
          <Cloud className="h-5 w-5" />
          <div className="font-display font-bold text-lg">Lovable Cloud actif — V2 en cours de déploiement</div>
        </div>
        <p className="text-sm text-primary-foreground/80">
          Base PostgreSQL connectée, catalogue et devis persistés. V2 livrée : fournisseurs &amp; marges, devis chiffrés, PDF serveur, signature électronique, statistiques avancées et application installable (PWA). Restent optionnels : espace client B2B, envoi email automatique, notifications push et synchronisation hors ligne.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {sections.map((s) => (
          <button key={s.label} className="text-left rounded-xl bg-card border p-5 hover:border-accent hover:shadow-[var(--shadow-md)] transition-all">
            <div className="grid place-items-center h-11 w-11 rounded-lg bg-[image:var(--gradient-accent)] text-primary-foreground mb-4">
              <s.icon className="h-5 w-5" />
            </div>
            <div className="font-display font-bold text-2xl mb-0.5">{s.value}</div>
            <div className="font-semibold text-sm">{s.label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.hint}</div>
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <RoadmapCard title="Feuille de route V2" items={[
          { label: "Gestion des fournisseurs et tarifs d'achat", done: true },
          { label: "Calcul automatique des marges", done: true },
          { label: "Génération automatique de devis chiffrés", done: true },
          { label: "Signature électronique des devis", done: true },
          { label: "Statistiques commerciales avancées", done: true },
          { label: "Espace client B2B avec commandes en ligne", done: false },
        ]} />
        <RoadmapCard title="Intégrations" items={[
          { label: "Lovable Cloud (PostgreSQL + storage + auth)", done: true },
          { label: "Génération PDF serveur (pdf-lib)", done: true },
          { label: "Application installable (PWA)", done: true },
          { label: "Envoi email automatique (Lovable Emails)", done: false },
          { label: "Cache offline complet", done: false },
          { label: "Notifications push tablette", done: false },
          { label: "Synchronisation bidirectionnelle hors ligne", done: false },
        ]} />
      </div>
    </AppShell>
  );
}

function RoadmapCard({ title, items }: { title: string; items: { label: string; done: boolean }[] }) {
  const done = items.filter((i) => i.done).length;
  return (
    <div className="bg-card rounded-xl border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-bold">{title}</h2>
        <span className="text-xs text-muted-foreground">{done}/{items.length}</span>
      </div>
      <ul className="space-y-2 text-sm">
        {items.map((i) => (
          <li key={i.label} className="flex items-start gap-2">
            {i.done ? (
              <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0" />
            )}
            <span className={i.done ? "text-foreground" : "text-muted-foreground"}>{i.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
