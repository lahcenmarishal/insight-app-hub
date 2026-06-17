import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PublicShell } from "@/components/public-shell";
import { useQuoteCart } from "@/lib/quote-store";
import { fetchCatalog } from "@/lib/catalog.functions";
import { useDocumentMeta } from "@/lib/seo";
import {
  ChevronRight, Plus, Minus, ShoppingCart, FileDown,
  Check, Package, Tag, Building2, ArrowRight, FileText, Layers,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { NotFound } from "@/components/not-found";

export const Route = createFileRoute("/produit/$productId")({
  component: ProductPage,
});

function ProductPage() {
  const { productId = "" } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { add } = useQuoteCart();
  const [qty, setQty] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["catalog"],
    queryFn: fetchCatalog,
    staleTime: 30_000,
  });

  const product = data?.products.find((p) => p.id === productId) ?? null;
  const category = product ? (data?.categories.find((c) => c.id === product.categoryId) ?? null) : null;
  const similar = product
    ? (data?.products ?? []).filter((p) => p.categoryId === product.categoryId && p.id !== product.id && !p.archived).slice(0, 4)
    : [];

  useDocumentMeta({
    title: product ? `${product.name} — Innova Lab Solutions` : "Produit",
    description: product?.description ?? "Fiche produit",
    ogImage: product?.image,
  });

  const images = product ? [product.image, ...(product.gallery ?? [])].filter(Boolean) : [];
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const currentImage = activeImage ?? images[0] ?? product?.image ?? "";
  const hasDoc = Boolean(product?.datasheetUrl);

  if (!isLoading && (!product || product.archived)) return <NotFound />;
  if (!product) {
    return (
      <PublicShell>
        <div className="text-center py-20 text-muted-foreground">Chargement…</div>
      </PublicShell>
    );
  }

  const addToQuote = (goToQuote = false) => {
    add({ productId: product.id, productName: product.name, reference: product.reference, quantity: qty });
    toast.success("Ajouté à la demande de devis", { description: `${qty} × ${product.name}` });
    if (goToQuote) navigate({ to: "/devis" });
  };

  return (
    <PublicShell>
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 flex-wrap">
        <Link to="/" className="hover:text-foreground">Catalogue</Link>
        {category && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to="/catalogue/$categoryId" params={{ categoryId: category.id }} className="hover:text-foreground">{category.name}</Link>
          </>
        )}
        {product.subcategory && category && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link
              to="/catalogue/$categoryId"
              params={{ categoryId: category.id }}
              search={{ sub: product.subcategory }}
              className="hover:text-foreground"
            >
              {product.subcategory}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium truncate">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-5 gap-8 mb-12">
        <div className="lg:col-span-2 space-y-3">
          <div className="aspect-square rounded-2xl overflow-hidden bg-card border shadow-[var(--shadow-md)]">
            <img src={currentImage} alt={product.name} className="h-full w-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {images.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImage(src)}
                  className={"aspect-square rounded-lg overflow-hidden border bg-muted " + (currentImage === src ? "ring-2 ring-accent" : "hover:border-accent")}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-3 flex flex-col">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 uppercase tracking-wider flex-wrap">
            <Tag className="h-3.5 w-3.5" />
            <span>{product.reference}</span>
            <span>·</span>
            <Building2 className="h-3.5 w-3.5" />
            <span>{product.brand}</span>
            {category && (
              <>
                <span>·</span>
                <Link to="/catalogue/$categoryId" params={{ categoryId: category.id }} className="hover:text-accent inline-flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" /> {category.name}
                </Link>
              </>
            )}
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-bold mb-4 leading-tight">{product.name}</h1>

          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-lg font-semibold text-sm">
              {product.salePrice && product.salePrice > 0
                ? `${product.salePrice.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD HT`
                : "Prix sur demande"}
            </span>
            {hasDoc && (
              <a
                href={product.datasheetUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-sm bg-primary/10 text-primary hover:bg-primary/20"
              >
                <FileText className="h-4 w-4" /> Fiche technique PDF
              </a>
            )}
          </div>

          <p className="text-muted-foreground leading-relaxed mb-4">{product.description}</p>

          {product.keywords?.length > 0 && (
            <div className="mb-6">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Mots-clés</div>
              <div className="flex flex-wrap gap-1.5">
                {product.keywords.map((k) => (
                  <span key={k} className="text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground border">#{k}</span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-6">
            {product.sectors.map((s) => (
              <span key={s} className="text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary">{s}</span>
            ))}
          </div>

          <div className="rounded-xl bg-card border p-5 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-surface-muted rounded-lg">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="grid place-items-center h-10 w-10 hover:text-accent" aria-label="Diminuer">
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  type="number"
                  min={1}
                  className="w-14 text-center bg-transparent border-0 focus:outline-none font-semibold"
                />
                <button onClick={() => setQty(qty + 1)} className="grid place-items-center h-10 w-10 hover:text-accent" aria-label="Augmenter">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={() => addToQuote(true)}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-5 py-3 font-semibold text-sm hover:bg-primary-deep transition-colors shadow-[var(--shadow-md)]"
              >
                <ShoppingCart className="h-4 w-4" /> Ajouter au devis
              </button>
            </div>
          </div>

          {hasDoc && (
            <a
              href={product.datasheetUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-card border rounded-lg py-2.5 px-4 font-medium text-sm hover:bg-muted transition self-start"
            >
              <FileDown className="h-4 w-4" /> Télécharger la fiche PDF
            </a>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <div className="bg-card rounded-xl border p-6">
          <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
            <Check className="h-5 w-5 text-accent" /> Avantages
          </h2>
          <ul className="space-y-2.5">
            {product.advantages.map((a) => (
              <li key={a} className="flex items-start gap-2.5 text-sm">
                <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-card rounded-xl border p-6">
          <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-accent" /> Applications
          </h2>
          <ul className="space-y-2.5">
            {product.applications.map((a) => (
              <li key={a} className="flex items-start gap-2.5 text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-accent mt-2 shrink-0" />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {similar.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-bold mb-4">Produits similaires</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {similar.map((p) => (
              <Link
                key={p.id}
                to="/produit/$productId"
                params={{ productId: p.id }}
                className="group bg-card rounded-xl border overflow-hidden hover:border-accent hover:shadow-[var(--shadow-md)] transition-all flex flex-col"
              >
                <img src={p.image} alt={p.name} className="h-36 w-full object-cover bg-muted" loading="lazy" />
                <div className="p-4 flex flex-col flex-1">
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">
                    {p.reference} · {p.brand}
                  </div>
                  <div className="font-display font-semibold text-sm leading-snug line-clamp-2 mb-3 flex-1">
                    {p.name}
                  </div>
                  <div className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all">
                    Voir détails <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </PublicShell>
  );
}
