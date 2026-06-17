import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FlaskConical,
  TestTube2,
  Gauge,
  Microscope,
  Wheat,
  ShieldCheck,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { useProducts } from "@/lib/catalog-data";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Catégories — Innova Lab Solutions" },
      { name: "description", content: "Explorez nos catégories de consommables, réactifs, instruments et équipements de laboratoire." },
      { property: "og:title", content: "Catégories — Innova Lab Solutions" },
      { property: "og:description", content: "Toutes nos gammes pour laboratoires, industrie et santé." },
    ],
  }),
  component: CategoriesPage,
});

const ICONS: Record<string, LucideIcon> = {
  FlaskConical,
  TestTube2,
  Gauge,
  Microscope,
  Wheat,
  ShieldCheck,
  Stethoscope,
};

const CATEGORY_BG: Record<string, string> = {
  consommables: "/assets/consommables.jpg",
  reactifs: "/assets/reactifs.jpg",
  instruments: "/assets/instruments.jpg",
  equipements: "/assets/equipements.jpg",
  agro: "/assets/agro.jpg",
  qualite: "/assets/qualite.jpg",
  sante: "/assets/sante.jpg",
};

function CategoriesPage() {
  const { categories } = useProducts();

  return (
    <PublicShell>
      <header className="mb-6 md:mb-8">
        <h1 className="font-display text-2xl md:text-4xl font-bold tracking-tight">
          Nos catégories
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1.5 max-w-2xl">
          Sélectionnez une catégorie pour explorer nos produits certifiés pour
          laboratoires, industrie et santé.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-7">
        {categories.map((c) => {
          const Icon = ICONS[c.icon] ?? FlaskConical;
          const bg = CATEGORY_BG[c.id];
          return (
            <Link
              key={c.id}
              to="/catalogue/$categoryId"
              params={{ categoryId: c.id }}
              className="group relative overflow-hidden rounded-3xl border bg-card shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-1 transition-all duration-300 active:scale-[0.98]"
            >
              <div className="relative h-56 md:h-64 w-full overflow-hidden">
                <img
                  src={bg}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/20 group-hover:from-black/70 group-hover:via-black/40 transition-colors duration-500" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-5 md:p-8">
                  <div className="rounded-full bg-white/10 backdrop-blur-md p-4 md:p-5 ring-1 ring-white/20">
                    <Icon
                      className="h-14 w-14 md:h-16 md:w-16 text-white"
                      strokeWidth={1.2}
                    />
                  </div>
                  <h2 className="font-display font-bold text-white text-xl md:text-2xl text-center tracking-tight drop-shadow-lg">
                    {c.name}
                  </h2>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </PublicShell>
  );
}
