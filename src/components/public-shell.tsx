import { Link, useRouterState } from "@tanstack/react-router";
import { ShoppingCart, Mail, Phone, MapPin, Home, LayoutGrid, PhoneCall } from "lucide-react";
import { useQuoteCart } from "@/lib/quote-store";
import { categories } from "@/data/catalog";
import { QuoteDrawer, openQuoteDrawer } from "@/components/quote-drawer";
import { ProductSheet } from "@/components/product-sheet";
import { PageTransition } from "@/components/page-transition";
import type { ReactNode } from "react";

const LOGO_URL = "/assets/innova-logo.png";

export function PublicShell({ children }: { children: ReactNode }) {
  const { count } = useQuoteCart();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";
  const isDevis = pathname.startsWith("/devis");
  const isCatalogue = pathname.startsWith("/catalogue") || pathname.startsWith("/categories");
  const isContact = pathname.startsWith("/contact");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header
        className="sticky top-0 z-30 bg-surface/95 backdrop-blur border-b"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-2.5 flex items-center gap-4">
          <Link to="/" className="flex items-center shrink-0 active:scale-95 transition-transform">
            <img src={LOGO_URL} alt="Innova Lab Solutions" className="h-7 w-auto object-contain" />
          </Link>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => openQuoteDrawer()}
            className="relative inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-3.5 py-2 text-sm font-semibold hover:bg-primary-deep active:scale-95 transition-all shrink-0 shadow-[var(--shadow-sm)]"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Mon devis</span>
            {count > 0 && (
              <span className="absolute -top-1 -right-1 grid place-items-center min-w-5 h-5 px-1.5 rounded-full bg-accent text-accent-foreground text-[11px] font-bold ring-2 ring-surface">
                {count}
              </span>
            )}
          </button>
        </div>
      </header>

      <main
        className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-5 md:py-10"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 5rem)" }}
      >
        <PageTransition>{children}</PageTransition>
      </main>

      {/* Footer — desktop / tablet only */}
      <footer className="hidden lg:block border-t bg-surface mt-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 grid gap-8 lg:grid-cols-4">
          <div>
            <img src={LOGO_URL} alt="Innova Lab Solutions" className="h-14 w-auto object-contain mb-3" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Fournisseur de consommables, réactifs, instruments et équipements pour laboratoires,
              industrie et santé.
            </p>
          </div>

          <div>
            <div className="font-display font-semibold text-sm mb-3">Navigation</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground transition-colors">Accueil</Link></li>
              <li><Link to="/" className="hover:text-foreground transition-colors">Catalogue produits</Link></li>
              <li><Link to="/devis" className="hover:text-foreground transition-colors">Demande de devis</Link></li>
            </ul>
          </div>

          <div>
            <div className="font-display font-semibold text-sm mb-3">Catégories</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {categories.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <Link to="/catalogue/$categoryId" params={{ categoryId: c.id }} className="hover:text-foreground transition-colors">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="font-display font-semibold text-sm mb-3">Contact</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0" /> contact@innovalab.ma</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" /> +212 5 00 00 00 00</li>
              <li className="flex items-start gap-2"><MapPin className="h-4 w-4 shrink-0 mt-0.5" /> Agadir, Souss-Massa, Maroc</li>
            </ul>
          </div>
        </div>
        <div className="border-t py-5 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Innova Lab Solutions — Division d'Innova Souss Import Export SARL
        </div>
      </footer>

      {/* Bottom tab bar — mobile only (vraie sensation d'app native) */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-surface/95 backdrop-blur border-t shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.1)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid grid-cols-4">
          <TabLink to="/" active={isHome} icon={<Home className="h-5 w-5" />} label="Accueil" />
          <TabLink to="/categories" active={isCatalogue} icon={<LayoutGrid className="h-5 w-5" />} label="Catégories" />
          <TabButton
            active={false}
            icon={
              <span className="relative">
                <ShoppingCart className="h-5 w-5" />
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-2 grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold ring-2 ring-surface">
                    {count}
                  </span>
                )}
              </span>
            }
            label="Devis"
            onClick={() => openQuoteDrawer()}
            highlighted={isDevis}
          />
          <TabLink to="/contact" active={isContact} icon={<PhoneCall className="h-5 w-5" />} label="Contact" />
        </div>
      </nav>

      <QuoteDrawer />
      <ProductSheet />
    </div>
  );
}

function TabLink({
  to,
  active,
  icon,
  label,
}: {
  to: string;
  active: boolean;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      to={to}
      className={`relative flex flex-col items-center justify-center gap-0.5 py-2.5 active:scale-95 transition-all ${
        active ? "text-primary" : "text-muted-foreground"
      }`}
    >
      {icon}
      <span className={`text-[10px] font-medium ${active ? "font-semibold" : ""}`}>{label}</span>
      {active && <span className="absolute top-0 h-0.5 w-10 bg-primary rounded-full" />}
    </Link>
  );
}

function TabButton({
  active,
  highlighted,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  highlighted?: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  const isActive = active || highlighted;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-0.5 py-2.5 active:scale-95 transition-all relative ${
        isActive ? "text-primary" : "text-muted-foreground"
      }`}
    >
      {icon}
      <span className={`text-[10px] font-medium ${isActive ? "font-semibold" : ""}`}>{label}</span>
    </button>
  );
}
