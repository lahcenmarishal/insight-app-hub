
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  phone text NOT NULL DEFAULT '',
  phone_display text NOT NULL DEFAULT '',
  whatsapp text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  quotes_email text NOT NULL DEFAULT '',
  quotes_whatsapp text NOT NULL DEFAULT '',
  google_maps_url text NOT NULL DEFAULT '',
  business_hours text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site settings"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert site settings"
  ON public.site_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update site settings"
  ON public.site_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete site settings"
  ON public.site_settings FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.site_settings (
  phone, phone_display, whatsapp, email, address,
  quotes_email, quotes_whatsapp, google_maps_url, business_hours
) VALUES (
  '+212500000000',
  '+212 5 00 00 00 00',
  '212600000000',
  'contact@innovalab.ma',
  'Agadir, Souss-Massa, Maroc',
  'devis@innovalab.ma',
  '212600000000',
  'https://maps.google.com/?q=Agadir+Maroc',
  E'Lundi - Vendredi : 08h30 - 18h00\nSamedi : 09h00 - 13h00\nDimanche : Fermé'
);
