import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useCatalog } from "@/lib/catalog-data";
import { ProductDetails } from "@/components/product-details";

const OPEN_EVENT = "ils:product-sheet-open";

export function openProductSheet(productId: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: productId }));
}

export function ProductSheet() {
  const [productId, setProductId] = useState<string | null>(null);
  const { products, categories } = useCatalog();

  useEffect(() => {
    const onOpen = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (id) setProductId(id);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  const product = productId ? products.find((p) => p.id === productId) : null;
  const category = product ? categories.find((c) => c.id === product.categoryId) ?? null : null;

  return (
    <Drawer open={!!productId} onOpenChange={(o) => !o && setProductId(null)}>
      <DrawerContent className="max-h-[92vh]">
        <DrawerTitle className="sr-only">{product?.name ?? "Produit"}</DrawerTitle>
        <div className="relative overflow-y-auto px-4 pt-3 pb-8" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 2rem)" }}>
          <button
            onClick={() => setProductId(null)}
            className="absolute right-3 top-3 z-10 grid place-items-center h-10 w-10 rounded-full bg-surface border shadow-[var(--shadow-sm)] hover:bg-muted active:scale-90 transition"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
          {product ? (
            <div className="pt-4">
              <ProductDetails
                product={product}
                category={category}
                showBreadcrumb={false}
                onAdded={() => setProductId(null)}
              />
            </div>
          ) : (
            <div className="grid place-items-center h-64 text-sm text-muted-foreground">Chargement…</div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}