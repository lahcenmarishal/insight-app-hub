DROP POLICY IF EXISTS "Anyone can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can manage products" ON public.products;
DROP POLICY IF EXISTS "Anyone can manage quotes" ON public.quotes;
DROP POLICY IF EXISTS "Anyone can manage quote items" ON public.quote_items;

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
GRANT SELECT ON public.suppliers TO anon, authenticated;
GRANT ALL ON public.suppliers TO service_role;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Suppliers are publicly readable" ON public.suppliers FOR SELECT TO public USING (true);
CREATE TRIGGER suppliers_set_updated_at BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.products
  ADD COLUMN purchase_price numeric(12,2) default 0,
  ADD COLUMN sale_price numeric(12,2) default 0,
  ADD COLUMN margin_rate numeric(6,2) GENERATED ALWAYS AS (
    CASE WHEN purchase_price > 0
      THEN round(((sale_price - purchase_price) / purchase_price) * 100, 2)
      ELSE 0 END
  ) STORED,
  ADD COLUMN supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  ADD COLUMN keywords text[] NOT NULL DEFAULT '{}';
CREATE INDEX products_supplier_id_idx ON public.products(supplier_id);

ALTER TABLE public.quote_items
  ADD COLUMN unit_price numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN line_total numeric(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.quotes
  ADD COLUMN total_ht numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN signature_data text,
  ADD COLUMN signed_at timestamptz,
  ADD COLUMN signer_name text;

CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'user');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage suppliers" ON public.suppliers FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage quotes" ON public.quotes FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage quote items" ON public.quote_items FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL,
  contact text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  sector text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Nouveau',
  notes text NOT NULL DEFAULT '',
  quote_count integer NOT NULL DEFAULT 0,
  last_visit timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prospects TO authenticated;
GRANT ALL ON public.prospects TO service_role;
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage prospects" ON public.prospects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_prospects_updated BEFORE UPDATE ON public.prospects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();