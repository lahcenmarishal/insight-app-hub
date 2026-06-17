import { AdminGuard } from "@/components/admin-guard";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/app-shell";
import { fetchQuotesFn } from "@/lib/catalog.functions";
import { useCatalog } from "@/lib/catalog-data";
import { BarChart3, TrendingUp, FileText, CheckCircle2, Euro, Trophy } from "lucide-react";

export const Route = createFileRoute("/admin/stats")({
  head: () => ({
    meta: [
      { title: "Statistiques commerciales — Administration" },
      { name: "description", content: "Indicateurs clés : devis, conversion, chiffre d'affaires, top produits." },
    ],
  }),
  component: () => (<AdminGuard><StatsPage /></AdminGuard>),
});

function StatsPage() {
  const fetchFn = useServerFn(fetchQuotesFn);
  const { data: quotes = [] } = useQuery({ queryKey: ["quotes"], queryFn: () => fetchFn() });
  const { products } = useCatalog();

  const totalCount = quotes.length;
  const signed = quotes.filter((q) => q.status === "Signé").length;
  const conversion = totalCount > 0 ? Math.round((signed / totalCount) * 100) : 0;
  const caTotal = quotes.reduce((s, q) => s + q.totalHt, 0);
  const caSigned = quotes.filter((q) => q.status === "Signé").reduce((s, q) => s + q.totalHt, 0);
  const avgBasket = totalCount > 0 ? caTotal / totalCount : 0;

  // Top produits (par quantité demandée)
  const counter = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const q of quotes) {
    for (const it of q.items) {
      const key = it.reference || it.productName;
      const prev = counter.get(key) ?? { name: it.productName, qty: 0, revenue: 0 };
      prev.qty += it.quantity;
      prev.revenue += it.lineTotal;
      counter.set(key, prev);
    }
  }
  const topProducts = [...counter.entries()].sort((a, b) => b[1].qty - a[1].qty).slice(0, 8);

  // Marge potentielle catalogue
  const totalMargin = products.reduce((s, p) => s + (p.salePrice - p.purchasePrice), 0);

  const kpis = [
    { icon: FileText, label: "Devis générés", value: totalCount, hint: "Toutes statuts confondus" },
    { icon: CheckCircle2, label: "Devis signés", value: signed, hint: `${conversion}% de conversion` },
    { icon: Euro, label: "CA potentiel HT", value: `${caTotal.toFixed(0)} €`, hint: "Somme de tous les devis" },
    { icon: TrendingUp, label: "CA signé HT", value: `${caSigned.toFixed(0)} €`, hint: "Devis confirmés" },
    { icon: BarChart3, label: "Panier moyen", value: `${avgBasket.toFixed(0)} €`, hint: "Par devis" },
    { icon: Trophy, label: "Marge catalogue", value: `${totalMargin.toFixed(0)} €`, hint: "Vente - Achat par produit" },
  ];

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-2">
          <BarChart3 className="h-7 w-7 text-accent" /> Statistiques commerciales
        </h1>
        <p className="text-muted-foreground">Pilotage en temps réel de l'activité devis.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className="bg-card border rounded-xl p-5">
            <div className="grid place-items-center h-11 w-11 rounded-lg bg-[image:var(--gradient-accent)] text-primary-foreground mb-3">
              <k.icon className="h-5 w-5" />
            </div>
            <div className="font-display font-bold text-2xl">{k.value}</div>
            <div className="font-semibold text-sm mt-0.5">{k.label}</div>
            <div className="text-xs text-muted-foreground">{k.hint}</div>
          </div>
        ))}
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b font-display font-bold flex items-center gap-2">
          <Trophy className="h-4 w-4 text-accent" /> Top produits demandés
        </div>
        {topProducts.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Aucune donnée pour le moment.</div>
        ) : (
          <div className="divide-y">
            {topProducts.map(([ref, p], i) => {
              const max = topProducts[0][1].qty || 1;
              const pct = Math.round((p.qty / max) * 100);
              return (
                <div key={ref} className="grid grid-cols-12 gap-3 px-5 py-3 items-center text-sm">
                  <div className="col-span-1 text-muted-foreground font-mono">#{i + 1}</div>
                  <div className="col-span-5 min-w-0">
                    <div className="font-semibold truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{ref}</div>
                  </div>
                  <div className="col-span-4">
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-[image:var(--gradient-accent)]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="col-span-1 text-right font-semibold">{p.qty}</div>
                  <div className="col-span-1 text-right text-xs text-muted-foreground">{p.revenue.toFixed(0)} €</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}