import { ShoppingCart, Check } from "lucide-react";
import { useState } from "react";
import { useQuoteCart } from "@/lib/quote-store";
import { openQuoteDrawer } from "@/components/quote-drawer";
import { haptic } from "@/lib/haptic";

interface Props {
  productId: string;
  productName: string;
  reference: string;
  price?: number;
  className?: string;
  compact?: boolean;
}

export function AddToQuoteButton({ productId, productName, reference, className = "", compact = false }: Props) {
  const { add } = useQuoteCart();
  const [justAdded, setJustAdded] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    add({ productId, productName, reference, quantity: 1 });
    haptic(12);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
    openQuoteDrawer();
  };


  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        "inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent text-accent-foreground font-semibold transition-all hover:brightness-110 active:scale-95 shadow-sm " +
        (compact ? "px-2.5 py-2 text-xs" : "px-3 py-2 text-xs sm:text-sm w-full") +
        " " + className
      }
      aria-label="Ajouter au devis"
    >
      {justAdded ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
      <span className={compact ? "hidden sm:inline" : ""}>
        {justAdded ? "Ajouté" : (compact ? "Devis" : "Ajouter au devis")}
      </span>
    </button>
  );
}
