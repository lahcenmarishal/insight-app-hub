
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS keywords TEXT[] NOT NULL DEFAULT '{}';

-- Storage policies for product-assets bucket
DROP POLICY IF EXISTS "Public read product-assets" ON storage.objects;
CREATE POLICY "Public read product-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-assets');

DROP POLICY IF EXISTS "Admins manage product-assets" ON storage.objects;
CREATE POLICY "Admins manage product-assets"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'product-assets' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'product-assets' AND public.has_role(auth.uid(), 'admin'));
