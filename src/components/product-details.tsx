import { Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronRight, Plus, Minus, ShoppingCart, FileDown,
  Check, Package, Tag, Building2, FileText, Layers,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useQuoteCart } from "@/lib/quote-store";
import { haptic } from "@/lib/haptic";
import type { AdminProduct } from "@/lib/catalog.functions";
import type { Category } from "@/data/catalog";

type Props = {
  product: AdminProduct;
  category: Category | null;
  showBreadcrumb?: boolean;
  onAdded?: () => void;
};

export function ProductDetails({ product, category, showBreadcrumb = true, onAdded }: Props) {
  const { add } = useQuoteCart();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const images = [product.image, ...(product.gallery ?? [])].filter(Boolean);
  const [activeImage, setActiveImage] = useState(images[0] ?? product.image);
  const hasDoc = Boolean(product.datasheetUrl);

  const addToQuote = (goToQuote = false) => {
    add({ productId: product.id, productName: product.name, reference: product.reference, quantity: qty });
    haptic(15);
    toast.success("Ajouté à la demande de devis", { description: `${qty} × ${product.name}` });
    onAdded?.();
    if (goToQuote) navigate({ to: "/devis" });
  };

  return (
    <>
      {showBreadcrumb && (
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 flex-wrap">
          <Link to="/" className="hover:text-foreground">Catalogue</Link>
          {category && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link to="/catalogue/$categoryId" params={{ categoryId: category.id }} className="hover:text-foreground">{category.name}</Link>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium truncate">{product.name}</span>
        </nav>
      )}

      <div className="grid lg:grid-cols-5 gap-6 lg:gap-8 mb-8">
        <div className="lg:col-span-2 space-y-3">
          <div className="aspect-square rounded-2xl overflow-hidden bg-card border shadow-[var(--shadow-md)]">
            <img src={activeImage} alt={product.name} className="h-full w-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {images.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImage(src)}
                  className={"aspect-square rounded-lg overflow-hidden border bg-muted " + (activeImage === src ? "ring-2 ring-accent" : "hover:border-accent")}
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

          <h1 className="font-display text-2xl md:text-3xl font-bold mb-4 leading-tight">{product.name}</h1>

          <div className="flex flex-wrap items-center gap-2 mb-5">
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

          <p className="text-muted-foreground leading-relaxed mb-4 text-sm">{product.description}</p>

          {product.keywords?.length > 0 && (
            <div className="mb-5">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Mots-clés</div>
              <div className="flex flex-wrap gap-1.5">
                {product.keywords.map((k: string) => (
                  <span key={k} className="text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground border">#{k}</span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-5">
            {product.sectors?.map((s: string) => (
              <span key={s} className="text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary">{s}</span>
            ))}
          </div>

          <div className="rounded-xl bg-card border p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-surface-muted rounded-lg">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="grid place-items-center h-11 w-11 hover:text-accent" aria-label="Diminuer">
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  type="number"
                  min={1}
                  className="w-12 text-center bg-transparent border-0 focus:outline-none font-semibold"
                />
                <button onClick={() => setQty(qty + 1)} className="grid place-items-center h-11 w-11 hover:text-accent" aria-label="Augmenter">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={() => addToQuote(true)}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-5 py-3 font-semibold text-sm hover:bg-primary-deep active:scale-95 transition-all shadow-[var(--shadow-md)]"
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

      <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-6">
        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-display text-base md:text-lg font-bold mb-3 flex items-center gap-2">
            <Check className="h-5 w-5 text-accent" /> Avantages
          </h2>
          <ul className="space-y-2">
            {product.advantages?.map((a: string) => (
              <li key={a} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-display text-base md:text-lg font-bold mb-3 flex items-center gap-2">
            <Package className="h-5 w-5 text-accent" /> Applications
          </h2>
          <ul className="space-y-2">
            {product.applications?.map((a: string) => (
              <li key={a} className="flex items-start gap-2 text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-accent mt-2 shrink-0" />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}