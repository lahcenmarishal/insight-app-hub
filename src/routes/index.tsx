import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, ArrowRight } from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { useProducts } from "@/lib/catalog-data";
import { AddToQuoteButton } from "@/components/add-to-quote-button";
import { ProductGridSkeleton } from "@/components/product-card-skeleton";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { openProductSheet } from "@/components/product-sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQueryClient } from "@tanstack/react-query";
import { catalogQueryKey } from "@/lib/catalog-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Innova Lab Solutions — Catalogue produits" },
      { name: "description", content: "Catalogue de consommables, réactifs, équipements et dispositifs médicaux pour laboratoires, industrie et santé." },
    ],
  }),
  component: LandingCatalog,
});

function LandingCatalog() {
  const { products, categories, isLoading } = useProducts();
  const isMobile = useIsMobile();
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return products.filter((p) => {
      if (cat !== "all" && p.categoryId !== cat) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.reference.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
      );
    });
  }, [query, cat, products]);

  return (
    <PublicShell>
      <PullToRefresh onRefresh={() => qc.invalidateQueries({ queryKey: catalogQueryKey })} />
      {/* Recherche */}
      <div className="mb-5">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un produit, référence, marque…"
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-muted border border-transparent focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 text-sm"
          />
        </div>
      </div>

      {/* Filtres catégorie */}
      <div id="cat-chips" className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4 md:mx-0 md:px-0 scroll-mt-20">
        <CategoryChip active={cat === "all"} onClick={() => setCat("all")}>Tous ({products.length})</CategoryChip>
        {categories.map((c) => {
          const count = products.filter((p) => p.categoryId === c.id).length;
          return (
            <CategoryChip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
              {c.name} ({count})
            </CategoryChip>
          );
        })}
      </div>

      {/* Grille produits */}
      {isLoading && products.length === 0 ? (
        <ProductGridSkeleton count={8} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          Aucun produit ne correspond à votre recherche.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="group bg-card rounded-xl border overflow-hidden hover:border-accent hover:shadow-[var(--shadow-md)] transition-all flex flex-col"
            >
              <ProductLinkOrButton
                productId={p.id}
                isMobile={isMobile}
                className="block"
              >
                <img src={p.image} alt={p.name} className="h-36 sm:h-40 w-full object-cover bg-muted" loading="lazy" />
              </ProductLinkOrButton>
              <div className="p-3 sm:p-4 flex flex-col flex-1">
                <div className="text-[10px] sm:text-[11px] text-muted-foreground uppercase tracking-wider mb-1 truncate">
                  {p.reference} · {p.brand}
                </div>
                <ProductLinkOrButton
                  productId={p.id}
                  isMobile={isMobile}
                  className="font-display font-semibold text-xs sm:text-sm leading-snug line-clamp-2 mb-3 flex-1 hover:text-accent transition-colors text-left"
                >
                  {p.name}
                </ProductLinkOrButton>
                <div className="flex items-center gap-2">
                  <ProductLinkOrButton
                    productId={p.id}
                    isMobile={isMobile}
                    className="inline-flex items-center justify-center gap-1 text-xs font-semibold text-primary border border-primary/30 hover:border-primary hover:bg-primary/5 transition-colors rounded-lg px-2.5 py-2 flex-1 sm:flex-initial"
                  >
                    Détails <ArrowRight className="h-3.5 w-3.5" />
                  </ProductLinkOrButton>
                  <div className="sm:ml-auto">
                    <AddToQuoteButton
                      productId={p.id}
                      productName={p.name}
                      reference={p.reference}
                      price={p.salePrice}
                      compact
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PublicShell>
  );
}

function ProductLinkOrButton({
  productId,
  isMobile,
  className,
  children,
}: {
  productId: string;
  isMobile: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  if (isMobile) {
    return (
      <button type="button" onClick={() => openProductSheet(productId)} className={className}>
        {children}
      </button>
    );
  }
  return (
    <Link to="/produit/$productId" params={{ productId }} className={className}>
      {children}
    </Link>
  );
}

function CategoryChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-surface text-foreground/70 border-border hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
