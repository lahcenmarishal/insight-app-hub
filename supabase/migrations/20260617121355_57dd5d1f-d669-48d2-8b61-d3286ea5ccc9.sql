-- Allow anonymous public quote submission (used by /devis form) and admin/manager read access.
CREATE POLICY "Public can submit quotes"
  ON public.quotes FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public can submit quote items"
  ON public.quote_items FOR INSERT TO anon, authenticated
  WITH CHECK (true);

GRANT INSERT ON public.quotes TO anon;
GRANT INSERT ON public.quote_items TO anon;