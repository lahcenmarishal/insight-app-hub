ALTER TABLE public.quote_items
  ADD COLUMN unit_price numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN line_total numeric(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.quotes
  ADD COLUMN total_ht numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN signature_data text,
  ADD COLUMN signed_at timestamptz,
  ADD COLUMN signer_name text;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;
GRANT ALL ON public.quotes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_items TO authenticated;
GRANT ALL ON public.quote_items TO service_role;

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Quotes are publicly readable" ON public.quotes FOR SELECT TO public USING (true);
CREATE POLICY "Quotes can be created publicly" ON public.quotes FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Quotes can be updated publicly (signature)" ON public.quotes FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Quote items are publicly readable" ON public.quote_items FOR SELECT TO public USING (true);
CREATE POLICY "Quote items can be created publicly" ON public.quote_items FOR INSERT TO public WITH CHECK (true);
