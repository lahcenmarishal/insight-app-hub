-- CATEGORIES
CREATE TABLE public.categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '',
  subcategories text[] NOT NULL DEFAULT '{}',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are publicly readable" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Anyone can manage categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

-- PRODUCTS
CREATE TABLE public.products (
  id text PRIMARY KEY,
  name text NOT NULL,
  reference text NOT NULL,
  brand text NOT NULL DEFAULT '',
  category_id text REFERENCES public.categories(id) ON DELETE SET NULL,
  subcategory text,
  description text NOT NULL DEFAULT '',
  advantages text[] NOT NULL DEFAULT '{}',
  applications text[] NOT NULL DEFAULT '{}',
  sectors text[] NOT NULL DEFAULT '{}',
  image text NOT NULL DEFAULT '',
  gallery text[] NOT NULL DEFAULT '{}',
  datasheet_url text,
  stock int NOT NULL DEFAULT 0,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are publicly readable" ON public.products FOR SELECT USING (true);
CREATE POLICY "Anyone can manage products" ON public.products FOR ALL USING (true) WITH CHECK (true);

-- QUOTES
CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL,
  contact text NOT NULL,
  phone text,
  email text NOT NULL,
  city text,
  notes text,
  status text NOT NULL DEFAULT 'Nouveau',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;
GRANT ALL ON public.quotes TO service_role;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage quotes" ON public.quotes FOR ALL USING (true) WITH CHECK (true);

-- QUOTE ITEMS
CREATE TABLE public.quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  product_id text,
  product_name text NOT NULL,
  reference text NOT NULL DEFAULT '',
  quantity int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_items TO authenticated;
GRANT ALL ON public.quote_items TO service_role;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage quote items" ON public.quote_items FOR ALL USING (true) WITH CHECK (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_quotes_updated BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SEED CATEGORIES
INSERT INTO public.categories (id, name, description, icon, subcategories, sort_order) VALUES
('consommables','Consommables de laboratoire','Gants, tubes, verrerie, filtres, pipettes','FlaskConical',ARRAY['Gants','Tubes','Verrerie','Filtres','Pipettes'],1),
('reactifs','Réactifs et produits chimiques','Réactifs analytiques et produits chimiques certifiés','TestTube2',ARRAY[]::text[],2),
('instruments','Instruments de mesure','pH mètres, conductimètres, réfractomètres, balances','Gauge',ARRAY['pH mètres','Conductimètres','Réfractomètres','Balances'],3),
('equipements','Équipements de laboratoire','Étuves, centrifugeuses, hottes, autoclaves','Microscope',ARRAY[]::text[],4),
('agro','Agro-industrie','Équipements pour l''industrie agroalimentaire','Wheat',ARRAY[]::text[],5),
('qualite','Contrôle qualité','Solutions de contrôle qualité industriel','ShieldCheck',ARRAY[]::text[],6),
('sante','Santé et dispositifs médicaux','Dispositifs médicaux et équipements cliniques','Stethoscope',ARRAY[]::text[],7);

-- SEED PRODUCTS
INSERT INTO public.products (id,name,reference,brand,category_id,subcategory,description,advantages,applications,sectors,image,datasheet_url,stock) VALUES
('p-001','Gants nitrile non poudrés','INV-GN-100','Innova Lab','consommables','Gants','Gants d''examen en nitrile non poudrés, résistance chimique élevée, certifiés EN 374 et EN 455. Boîte de 100 unités.',ARRAY['Sans latex, sans poudre','Résistance chimique EN 374','Texturé bouts des doigts','Conforme contact alimentaire'],ARRAY['Manipulation d''échantillons','Analyses chimiques','Soins médicaux','Industrie agroalimentaire'],ARRAY['Laboratoire d''analyses','Laboratoire médical','Agroalimentaire','Clinique / Centre médical'],'https://images.unsplash.com/photo-1583912267550-d6c2ac3196c0?auto=format&fit=crop&w=800&q=80','#fiche-INV-GN-100',120),
('p-002','Tubes Falcon 50 mL stériles','INV-TB-50S','LabTech','consommables','Tubes','Tubes coniques 50 mL en polypropylène, stériles, avec bouchon à vis et zone d''écriture. Sachet de 25.',ARRAY['Stérilité garantie','Résistance centrifugation 12 000 g','Graduation imprimée','Bouchon étanche'],ARRAY['Centrifugation','Stockage d''échantillons','Cultures cellulaires'],ARRAY['Laboratoire d''analyses','Laboratoire médical'],'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?auto=format&fit=crop&w=800&q=80',NULL,0),
('p-003','Pipette automatique 100-1000 µL','INV-PA-1000','Innova Lab','consommables','Pipettes','Pipette monocanal volume variable 100-1000 µL, précision ±0,6%, autoclavable, éjecteur de pointe intégré.',ARRAY['Précision ±0,6%','Ergonomie premium','Entièrement autoclavable','Calibration ISO 8655'],ARRAY['Dosage précis','Préparation d''échantillons','Microbiologie'],ARRAY['Laboratoire d''analyses','Laboratoire agronomique','Laboratoire médical'],'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80','#fiche-INV-PA-1000',45),
('p-004','pH-mètre de paillasse PH-700','INV-PH-700','MeterPro','instruments','pH mètres','pH-mètre haute précision, écran TFT couleur, étalonnage automatique 5 points, sortie USB et impression.',ARRAY['Précision ±0,01 pH','Étalonnage auto 5 points','Mémoire 1000 mesures','Conformité GLP'],ARRAY['Contrôle qualité eau','Analyses agronomiques','Production agroalimentaire'],ARRAY['Laboratoire d''analyses','Laboratoire agronomique','Agroalimentaire','Contrôle qualité'],'https://images.unsplash.com/photo-1606206522398-de2c5f1ce5b1?auto=format&fit=crop&w=800&q=80',NULL,8),
('p-005','Balance analytique 220g / 0,1mg','INV-BA-220','PrecisaLab','instruments','Balances','Balance analytique professionnelle, portée 220 g, lisibilité 0,1 mg, calibrage interne automatique.',ARRAY['Lisibilité 0,1 mg','Calibrage interne','Pare-brise motorisé','Connexion RS232 / USB'],ARRAY['Pesées de précision','Formulation','Contrôle qualité'],ARRAY['Laboratoire d''analyses','Industrie','Contrôle qualité'],'https://images.unsplash.com/photo-1554475901-4538ddfbccc2?auto=format&fit=crop&w=800&q=80','#fiche-INV-BA-220',30),
('p-006','Réfractomètre numérique Brix 0-95%','INV-RF-95','MeterPro','instruments','Réfractomètres','Réfractomètre numérique portable Brix 0-95%, compensation automatique température, IP65.',ARRAY['Mesure instantanée','ATC intégrée','Étanche IP65','Mémoire 100 valeurs'],ARRAY['Industrie sucrière','Jus de fruits','Vins et boissons'],ARRAY['Agroalimentaire','Contrôle qualité'],'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=800&q=80',NULL,60),
('p-007','Étuve de séchage 53 L ventilée','INV-ET-53','ThermoLab','equipements',NULL,'Étuve universelle à convection forcée, plage 5°C au-dessus de l''ambiante à 300°C, uniformité ±1%.',ARRAY['Régulation PID','Sécurité surchauffe','Porte vitrée','Rampe programmable'],ARRAY['Séchage d''échantillons','Tests de stabilité','Stérilisation à sec'],ARRAY['Laboratoire d''analyses','Industrie','Laboratoire agronomique'],'https://images.unsplash.com/photo-1580281657527-47f249e8f4df?auto=format&fit=crop&w=800&q=80','#fiche-INV-ET-53',5),
('p-008','Centrifugeuse de paillasse 6000 rpm','INV-CF-6000','Innova Lab','equipements',NULL,'Centrifugeuse compacte avec rotor à godets, vitesse réglable jusqu''à 6000 rpm, minuterie digitale.',ARRAY['Rotors interchangeables','Détection de balourd','Couvercle de sécurité','Faible niveau sonore'],ARRAY['Séparation sérum','Précipitation','Cultures cellulaires'],ARRAY['Laboratoire médical','Laboratoire d''analyses','Clinique / Centre médical'],'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=800&q=80',NULL,18),
('p-009','Réactif Karl Fischer 1 L','INV-RKF-1L','ChemPro','reactifs',NULL,'Réactif pour titration Karl Fischer volumétrique, titre 5 mg H2O/mL, flacon 1 L sous atmosphère sèche.',ARRAY['Titre stable','Conditionnement étanche','Certificat d''analyse','Conforme pharmacopée'],ARRAY['Dosage d''eau','Contrôle solvants','Pharmaceutique'],ARRAY['Laboratoire d''analyses','Industrie','Contrôle qualité'],'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=800&q=80','#fiche-INV-RKF-1L',200),
('p-010','Verrerie — Lot bécher gradués x6','INV-VB-LOT','Innova Lab','consommables','Verrerie','Lot de 6 béchers en verre borosilicaté 3.3 (50/100/250/400/600/1000 mL), graduation durable.',ARRAY['Verre borosilicaté','Résistance thermique','Bec verseur','Graduation pérenne'],ARRAY['Préparations','Titrages','Pédagogie'],ARRAY['Laboratoire d''analyses','Laboratoire agronomique'],'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=800&q=80',NULL,75),
('p-011','Tensiomètre électronique brassard','INV-TE-BR','MediCare','sante',NULL,'Tensiomètre automatique de bras, mémoire 2x90 mesures, détection arythmie, brassard universel.',ARRAY['Validé cliniquement','Détection arythmie','Grand écran LCD','Adaptateur secteur inclus'],ARRAY['Suivi tension artérielle','Consultations','Hospitalier'],ARRAY['Clinique / Centre médical','Laboratoire médical'],'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80','#fiche-INV-TE-BR',0),
('p-012','Détecteur de métaux convoyeur agroalimentaire','INV-DM-AGRO','QualiScan','agro',NULL,'Détecteur multi-fréquence pour ligne de production, sensibilité Fe 1.0 mm, conformité HACCP / IFS.',ARRAY['Multi-fréquence','Auto-apprentissage','IP69K','Reporting HACCP'],ARRAY['Sécurité produit fini','Conformité IFS','Production continue'],ARRAY['Agroalimentaire','Contrôle qualité','Industrie'],'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=800&q=80',NULL,12);