DROP POLICY IF EXISTS "Quotes are publicly readable" ON public.quotes;
DROP POLICY IF EXISTS "Quotes can be created publicly" ON public.quotes;
DROP POLICY IF EXISTS "Quotes can be updated publicly (signature)" ON public.quotes;
DROP POLICY IF EXISTS "Quote items are publicly readable" ON public.quote_items;
DROP POLICY IF EXISTS "Quote items can be created publicly" ON public.quote_items;

REVOKE SELECT, INSERT, UPDATE, DELETE ON public.quotes FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.quote_items FROM anon;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;