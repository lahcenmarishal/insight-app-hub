// Importing each route file once triggers its `createFileRoute(...)` call,
// which adds the route to the registry consumed by src/App.tsx.
import "@/routes/index";
import "@/routes/categories";
import "@/routes/catalogue.$categoryId";
import "@/routes/produit.$productId";
import "@/routes/contact";
import "@/routes/devis.index";
import "@/routes/app.index";
import "@/routes/prospects.index";
import "@/routes/admin.index";
import "@/routes/admin.devis";
import "@/routes/admin.fournisseurs";
import "@/routes/admin.produits";
import "@/routes/admin.stats";
