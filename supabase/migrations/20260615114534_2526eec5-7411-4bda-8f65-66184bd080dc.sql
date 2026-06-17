-- Remove overly-permissive write policies; writes go through server functions (service role)
DROP POLICY IF EXISTS "Anyone can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can manage products" ON public.products;
DROP POLICY IF EXISTS "Anyone can manage quotes" ON public.quotes;
DROP POLICY IF EXISTS "Anyone can manage quote items" ON public.quote_items;

-- Revoke direct write/read grants now that writes are server-side only
REVOKE INSERT, UPDATE, DELETE ON public.categories FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.products FROM anon, authenticated;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.quotes FROM anon, authenticated;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.quote_items FROM anon, authenticated;