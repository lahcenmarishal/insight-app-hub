## Objectif
Transformer le projet TanStack Start (SSR + Cloudflare Worker + server functions) en une SPA React + Vite classique avec **React Router DOM v6**. Tous les appels Supabase passent côté navigateur en respectant les RLS déjà en place (`Admins manage …`).

## Ce qui est conservé
- **Lovable Cloud / Supabase** : tables, RLS, storage, types générés.
- **React Query** : on garde le cache et `useQuery` / `useMutation` pour remplacer les server functions.
- **Tailwind v4 + shadcn/ui + sonner + lucide** : aucune ligne de design changée.
- **pdf-lib** : on l'exécute désormais dans le navigateur (la lib supporte les deux environnements).
- Tous les composants UI (`src/components/**`), hooks (`use-mobile`, `use-pull-to-refresh`), store de devis (`quote-store.ts`).

## Ce qui disparaît
- `src/server.ts`, `src/start.ts`, `src/router.tsx`, `src/routeTree.gen.ts`
- `src/integrations/supabase/auth-middleware.ts`, `auth-attacher.ts`, `client.server.ts` (service-role retirée du bundle)
- `src/lib/api/example.functions.ts` (exemple inutilisé)
- `src/lib/error-page.ts`, `src/lib/error-capture.ts` (spécifiques au wrapper Worker SSR)
- `nitro`, `@lovable.dev/vite-tanstack-config`, `@tanstack/react-router`, `@tanstack/react-start`, `@tanstack/router-plugin`, `netlify.toml`, `capacitor*`

## Nouvelle structure

```text
index.html                 (nouveau, à la racine)
src/
  main.tsx                 entrée Vite (createRoot + BrowserRouter + QueryClientProvider)
  App.tsx                  table de routes React Router
  styles.css               (inchangé)
  pages/
    Landing.tsx            /
    Categories.tsx         /categories
    CategoryPage.tsx       /catalogue/:categoryId
    ProductPage.tsx        /produit/:productId
    Contact.tsx            /contact
    Quote.tsx              /devis
    AppHub.tsx             /app
    Prospects.tsx          /prospects
    NotFound.tsx           404
    admin/
      AdminHome.tsx        /admin
      AdminQuotes.tsx      /admin/devis
      AdminSuppliers.tsx   /admin/fournisseurs
      AdminProducts.tsx    /admin/produits
      AdminStats.tsx       /admin/stats
  lib/
    catalog-api.ts         remplace catalog.functions.ts (browser supabase client)
    quote-pdf.ts           génération PDF côté client (pdf-lib browser)
    seo.ts                 mini util `useDocumentMeta({ title, description, ogImage })`
  integrations/supabase/
    client.ts              (inchangé)
    types.ts               (inchangé)
```

## Plan d'exécution

### 1. Nettoyage TanStack
- Supprimer `src/server.ts`, `src/start.ts`, `src/router.tsx`, `src/routeTree.gen.ts`, `src/routes/`, `src/lib/api/`, `src/lib/error-*.ts`, `src/integrations/supabase/auth-*.ts`, `src/integrations/supabase/client.server.ts`, `netlify.toml`, `capacitor.config.ts`.
- Réécrire `vite.config.ts` avec `@vitejs/plugin-react` + `vite-tsconfig-paths` + `@tailwindcss/vite` uniquement.
- Réécrire `package.json` : retirer toutes les deps TanStack Start / nitro, ajouter `react-router-dom`. Scripts : `dev`, `build`, `preview`, `lint`.
- Créer `index.html` avec `<div id="root">`, balise viewport, meta description par défaut, favicon.

### 2. Entrée et routage
- `src/main.tsx` : `ReactDOM.createRoot` → `<QueryClientProvider>` + `<BrowserRouter>` + `<App />` + `<Toaster />`.
- `src/App.tsx` : `<Routes>` listant toutes les routes ci-dessus, plus un `<Route path="*" element={<NotFound />} />`.
- `src/lib/seo.ts` : hook `useDocumentMeta` qui pose `document.title` + `meta[name=description]` + `meta[property=og:title|og:description]` dans un `useEffect`.

### 3. Réécriture des 14 pages
Chaque page (sous `src/pages/`) copie le JSX existant des fichiers `src/routes/*.tsx` mais :
- Plus de `createFileRoute`, plus de `head()` → on appelle `useDocumentMeta({...})` en tête de composant.
- `Link` et `useNavigate` viennent de `react-router-dom` (props : `to="/catalogue/abc"`, `useParams<{ categoryId: string }>()` pour les segments dynamiques).
- Plus de `useRouterState({ select: s => s.location.pathname })` → `useLocation().pathname`.
- Plus de `notFound()` → si une donnée manque, on rend `<NotFound />` ou on redirige.
- Pour les data fetches (catégories, produits, devis, prospects, suppliers) : `useQuery` qui appelle les fonctions du nouveau `catalog-api.ts`. Les pages dynamiques (`CategoryPage`, `ProductPage`) lisent `useParams()` puis `useQuery(['catalog'], fetchCatalog)`.

### 4. Réécriture de `catalog-api.ts` (toutes les anciennes server functions)
Tout passe par le **browser** `supabase` client (clé publishable + session utilisateur). Les opérations d'écriture sont déjà couvertes par les policies `Admins manage …` côté Postgres, donc un utilisateur non admin sera bloqué par RLS — c'est le comportement attendu.

Mapping fonctionnel :

| Ancien (server fn)          | Nouveau (browser)                                            |
|-----------------------------|--------------------------------------------------------------|
| `fetchCatalog`              | `fetchCatalog()` : 3 selects sur `categories/products/suppliers` |
| `saveProductFn`             | `saveProduct(input)` : `supabase.from('products').upsert(...)` |
| `deleteProductFn`           | `deleteProduct(id)`                                          |
| `setArchivedFn`             | `setArchived(id, archived)`                                  |
| `uploadProductAssetFn`      | `uploadProductAsset(file)` : `supabase.storage.from('product-assets').upload + getPublicUrl`. Le bucket doit être créé via Cloud (bouton Storage). |
| `saveSupplierFn`            | `saveSupplier(input)`                                        |
| `deleteSupplierFn`          | `deleteSupplier(id)`                                         |
| `submitQuoteFn`             | `submitQuote(payload)` : insert `quotes` + `quote_items` + upsert `prospects` (transaction côté client séquentielle, RLS publique pour `INSERT` sur quotes — à vérifier dans les policies actuelles, sinon ajouter `WITH CHECK (true)` côté anon pour le formulaire public). |
| `fetchQuotesFn`             | `fetchQuotes()` : `quotes` + `quote_items` (admin only)      |
| `signQuoteFn`               | `signQuote(id, signature, name)`                             |
| `updateQuoteStatusFn`       | `updateQuoteStatus(id, status)`                              |
| `updateQuoteItemPricesFn`   | `updateQuoteItemPrices(quoteId, items)`                      |
| `generateQuotePdfFn`        | `generateQuotePdf(quoteId)` dans `lib/quote-pdf.ts`, exécute `pdf-lib` côté navigateur, déclenche le téléchargement via Blob/URL.createObjectURL. |
| `fetchProspectsFn`          | `fetchProspects()`                                           |
| `saveProspectFn`            | `saveProspect(input)`                                        |
| `deleteProspectFn`          | `deleteProspect(id)`                                         |

### 5. Adapter les composants partagés
- `app-shell.tsx`, `public-shell.tsx`, `page-transition.tsx`, `product-details.tsx`, `quote-drawer.tsx` : remplacer les imports `@tanstack/react-router` par `react-router-dom` (`Link`, `useLocation`, `useNavigate`).
- `admin-guard.tsx` : déjà côté client, on garde la logique mais on remplace l'éventuel appel `has_role` server-side par `supabase.from('user_roles').select(...)` côté client (la policy "Users can read their own roles" l'autorise).

### 6. Politique RLS pour le formulaire public de devis
Le formulaire `/devis` est utilisé sans connexion. La migration précédente a supprimé les policies "Quotes can be created publicly". On rajoute une migration unique :
- `CREATE POLICY "Public can submit quotes" ON public.quotes FOR INSERT TO anon WITH CHECK (true);`
- `CREATE POLICY "Public can add quote items" ON public.quote_items FOR INSERT TO anon WITH CHECK (true);`
- `GRANT INSERT ON public.quotes, public.quote_items TO anon;`
- `GRANT SELECT ON public.products TO anon` (déjà existant).
Les prospects ne sont pas accessibles à `anon` → le upsert prospect au moment du devis reste côté admin (donc on supprime l'appel prospects depuis `submitQuote` ; un admin pourra reconstituer les prospects depuis l'écran `/prospects`).

### 7. Storage bucket
- Créer un bucket public `product-assets` via le panneau Cloud (Storage). Les policies existantes (`Public read product-assets`, `Admins manage product-assets`) sont déjà en place.

### 8. Vérifications finales
- `bun add react-router-dom` ; `bun remove @tanstack/react-start @tanstack/react-router @tanstack/router-plugin @lovable.dev/vite-tanstack-config nitro @capacitor/* netlify` (selon ce qui reste).
- Build (`bun run build`) doit passer sans erreur TypeScript.
- Preview ouvre `/`, navigation vers `/categories`, `/catalogue/consommables`, `/produit/p-001`, `/devis`, `/admin` (gardé par `AdminGuard`).
- Tester l'envoi d'un devis (anon), la génération du PDF côté client, l'upload d'une image produit.

## Points d'attention
- **Pas de SSR** → le balisage Open Graph initial est posé en JS au moment du rendu. Les crawlers modernes (Google, LinkedIn) exécutent JS mais Twitter ne le fait pas toujours. Si tu veux du vrai SEO/partage social, on devra repasser en SSR plus tard.
- **Clé service-role retirée du code** : tout passe par RLS. Toute opération admin nécessite d'être connecté avec un compte qui a la ligne `(user_id, 'admin')` dans `user_roles`. Tu pourras me demander de te l'attribuer une fois ton compte créé.
- **Génération PDF côté navigateur** : plus lente sur mobile et fait grossir le bundle d'environ 400 kB (`pdf-lib`). On peut la code-splitter avec un `import()` dynamique pour ne la charger qu'en page admin devis.

Une fois validé, je fais le refactor en plusieurs lots (config + routing, puis pages publiques, puis pages admin, puis catalog-api).