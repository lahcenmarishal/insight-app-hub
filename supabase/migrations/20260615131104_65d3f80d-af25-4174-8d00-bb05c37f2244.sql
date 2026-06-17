-- Suppliers
CREATE TABLE public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text default '',
  email text default '',
  phone text default '',
  country text default '',
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT ON public.suppliers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO service_role;

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers are publicly readable"
  ON public.suppliers FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated can manage suppliers"
  ON public.suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER suppliers_set_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Products: pricing + supplier link
ALTER TABLE public.products
  ADD COLUMN purchase_price numeric(12,2) default 0,
  ADD COLUMN sale_price numeric(12,2) default 0,
  ADD COLUMN margin_rate numeric(6,2) GENERATED ALWAYS AS (
    CASE WHEN purchase_price > 0
      THEN round(((sale_price - purchase_price) / purchase_price) * 100, 2)
      ELSE 0 END
  ) STORED,
  ADD COLUMN supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL;

CREATE INDEX products_supplier_id_idx ON public.products(supplier_id);
