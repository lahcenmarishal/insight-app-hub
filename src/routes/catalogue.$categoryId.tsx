import { createFileRoute, Link } from "@tanstack/react-router";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PublicShell } from "@/components/public-shell";
import { fetchCatalog } from "@/lib/catalog.functions";
import { useDocumentMeta } from "@/lib/seo";
import { ChevronRight, X } from "lucide-react";
import { AddToQuoteButton } from "@/components/add-to-quote-button";
import { openProductSheet } from "@/components/product-sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { NotFound } from "@/components/not-found";

export const Route = createFileRoute("/catalogue/$categoryId")({
  component: CategoryPage,
});

function CategoryPage() {
  const { categoryId = "" } = useParams<{ categoryId: string }>();
  const [searchParams] = useSearchParams();
  const sub = searchParams.get("sub") || undefined;
  const isMobile = useIsMobile();

  const { data, isLoading } = useQuery({
    queryKey: ["catalog"],
    queryFn: fetchCatalog,
    staleTime: 30_000,
  });

  const category = data?.categories.find((c) => c.id === categoryId) ?? null;
  const products = (data?.products ?? []).filter(
    (p) => p.categoryId === categoryId && !p.archived,
  );

  useDocumentMeta({
    title: category ? `${category.name} — Innova Lab Solutions` : "Catégorie — Innova Lab",
    description: category?.description ?? "Catégorie produits",
  });

  if (!isLoading && !category) return <NotFound />;
  if (!category) {
    return (
      <PublicShell>
        <div className="text-center py-20 text-muted-foreground">Chargement…</div>
      </PublicShell>
    );
  }

  const filtered = sub ? products.filter((p) => p.subcategory === sub) : products;

  return (
    <PublicShell>
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
        <Link to="/categories" className="hover:text-foreground">Catégories</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{category.name}</span>
        {sub && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">{sub}</span>
          </>
        )}
      </nav>

      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold mb-2">{category.name}</h1>
        <p className="text-muted-foreground">{category.description}</p>
      </div>

      {category.subcategories && category.subcategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            to="/catalogue/$categoryId"
            params={{ categoryId: category.id }}
            className={"text-xs font-medium px-3 py-1.5 rounded-full border transition " + (!sub ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:border-accent")}
          >
            Toutes
          </Link>
          {category.subcategories.map((s) => (
            <Link
              key={s}
              to="/catalogue/$categoryId"
              params={{ categoryId: category.id }}
              search={{ sub: s }}
              className={"text-xs font-medium px-3 py-1.5 rounded-full border transition " + (sub === s ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:border-accent")}
            >
              {s}
            </Link>
          ))}
          {sub && (
            <Link
              to="/catalogue/$categoryId"
              params={{ categoryId: category.id }}
              className="text-xs inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-muted-foreground hover:text-destructive"
            >
              <X className="h-3 w-3" /> Réinitialiser
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="group rounded-xl bg-card border overflow-hidden hover:border-accent hover:shadow-[var(--shadow-md)] transition-all flex flex-col"
          >
            <CardOpen productId={p.id} isMobile={isMobile} className="block aspect-square bg-muted overflow-hidden">
              <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
            </CardOpen>
            <div className="p-3 sm:p-4 flex flex-col flex-1">
              <div className="text-[10px] sm:text-[11px] text-muted-foreground mb-1 uppercase tracking-wider truncate">{p.reference} · {p.brand}</div>
              <CardOpen productId={p.id} isMobile={isMobile} className="font-display font-semibold text-xs sm:text-sm leading-snug line-clamp-2 min-h-[2.5rem] mb-3 hover:text-accent transition-colors text-left">{p.name}</CardOpen>
              <div className="mt-auto flex items-center gap-2">
                <CardOpen
                  productId={p.id}
                  isMobile={isMobile}
                  className="inline-flex items-center justify-center gap-1 text-xs font-semibold text-primary border border-primary/30 hover:border-primary hover:bg-primary/5 transition-colors rounded-lg px-2.5 py-2 flex-1 sm:flex-initial"
                >
                  Détails <ChevronRight className="h-3.5 w-3.5" />
                </CardOpen>
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

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">Aucun produit dans cette {sub ? "sous-catégorie" : "catégorie"}.</div>
      )}
    </PublicShell>
  );
}

function CardOpen({
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
