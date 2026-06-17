import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { X, ShoppingCart, Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import { useQuoteCart } from "@/lib/quote-store";
import { useProducts } from "@/lib/catalog-data";

const OPEN_EVENT = "ils:quote-drawer-open";

export function openQuoteDrawer() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPEN_EVENT));
  }
}

export function QuoteDrawer() {
  const [open, setOpen] = useState(false);
  const { items, update, remove, clear, count } = useQuoteCart();
  const { products } = useProducts();

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const priceFor = (id: string) => products.find((p) => p.id === id)?.salePrice ?? 0;
  const totalHt = items.reduce((s, it) => s + priceFor(it.productId) * it.quantity, 0);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* Drawer — top dropdown sur mobile, side panel sur desktop */}
      <aside
        className={`fixed z-50 bg-card shadow-2xl flex flex-col transition-all duration-300 ease-out
          inset-x-2 top-2 max-h-[85vh] rounded-2xl overflow-hidden
          sm:inset-y-0 sm:right-0 sm:left-auto sm:top-0 sm:max-h-none sm:w-[420px] sm:rounded-none sm:inset-x-auto
          ${open
            ? "opacity-100 translate-y-0 sm:translate-x-0"
            : "opacity-0 -translate-y-4 pointer-events-none sm:opacity-100 sm:translate-y-0 sm:translate-x-full sm:pointer-events-auto"
          }`}
        aria-hidden={!open}
        role="dialog"
        aria-label="Mon devis"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b bg-primary text-primary-foreground">
          <div className="flex items-center gap-2.5">
            <ShoppingCart className="h-5 w-5" />
            <div>
              <div className="font-display font-bold text-base leading-tight">Mon devis</div>
              <div className="text-[11px] opacity-80">{count} article{count > 1 ? "s" : ""}</div>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="grid place-items-center h-9 w-9 rounded-full hover:bg-white/10 active:scale-90 transition-all"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="h-full grid place-items-center p-8 text-center">
              <div>
                <div className="grid place-items-center h-16 w-16 rounded-full bg-muted text-muted-foreground mx-auto mb-4">
                  <ShoppingCart className="h-7 w-7" />
                </div>
                <div className="font-semibold mb-1">Votre devis est vide</div>
                <p className="text-sm text-muted-foreground">Ajoutez des produits depuis le catalogue.</p>
              </div>
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((it) => {
                const p = products.find((pp) => pp.id === it.productId);
                const price = priceFor(it.productId);
                return (
                  <li key={it.productId} className="p-4 flex gap-3">
                    {p?.image && (
                      <img src={p.image} alt={it.productName} className="h-16 w-16 rounded-lg object-cover bg-muted shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm leading-snug line-clamp-2">{it.productName}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{it.reference}</div>
                      <div className="flex items-center justify-between mt-2 gap-2">
                        <div className="flex items-center bg-surface-muted rounded-lg">
                          <button onClick={() => update(it.productId, Math.max(1, it.quantity - 1))} className="grid place-items-center h-8 w-8 hover:text-accent" aria-label="Diminuer">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold">{it.quantity}</span>
                          <button onClick={() => update(it.productId, it.quantity + 1)} className="grid place-items-center h-8 w-8 hover:text-accent" aria-label="Augmenter">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="text-right">
                          {price > 0 ? (
                            <div className="text-sm font-bold text-accent">{(price * it.quantity).toFixed(2)} €</div>
                          ) : (
                            <div className="text-[11px] text-muted-foreground">Prix sur demande</div>
                          )}
                          <button onClick={() => remove(it.productId)} className="text-[11px] text-muted-foreground hover:text-destructive inline-flex items-center gap-1 mt-0.5">
                            <Trash2 className="h-3 w-3" /> Retirer
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t bg-surface px-5 py-4 space-y-3">
            {totalHt > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Total HT estimé</span>
                <span className="font-display font-bold text-xl text-accent">{totalHt.toFixed(2)} €</span>
              </div>
            )}
            <Link
              to="/devis"
              onClick={() => setOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-3 font-semibold text-sm hover:bg-primary-deep transition shadow-[var(--shadow-md)]"
            >
              Finaliser la demande de devis <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="flex items-center justify-between">
              <button onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">
                Continuer mes achats
              </button>
              <button onClick={clear} className="text-xs text-muted-foreground hover:text-destructive">
                Vider le devis
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
