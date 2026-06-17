GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.suppliers TO anon;

GRANT SELECT ON public.categories TO authenticated;
GRANT SELECT ON public.products TO authenticated;
GRANT SELECT ON public.suppliers TO authenticated;

GRANT ALL ON public.categories TO service_role;
GRANT ALL ON public.products TO service_role;
GRANT ALL ON public.suppliers TO service_role;