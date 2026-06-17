// Seed catalog data — sera remplacé par Lovable Cloud à l'itération suivante.

export type Sector =
  | "Laboratoire d'analyses"
  | "Laboratoire agronomique"
  | "Laboratoire médical"
  | "Agroalimentaire"
  | "Contrôle qualité"
  | "Industrie"
  | "Clinique / Centre médical";

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  subcategories?: string[];
}

export interface Product {
  id: string;
  name: string;
  reference: string;
  brand: string;
  categoryId: string;
  subcategory?: string;
  description: string;
  advantages: string[];
  applications: string[];
  sectors: Sector[];
  image: string;
  gallery?: string[];
  datasheetUrl?: string;
  stock?: number;
  archived?: boolean;
}

export const categories: Category[] = [
  { id: "consommables", name: "Consommables de laboratoire", description: "Gants, tubes, verrerie, filtres, pipettes", icon: "FlaskConical", subcategories: ["Gants", "Tubes", "Verrerie", "Filtres", "Pipettes"] },
  { id: "reactifs", name: "Réactifs et produits chimiques", description: "Réactifs analytiques et produits chimiques certifiés", icon: "TestTube2" },
  { id: "instruments", name: "Instruments de mesure", description: "pH mètres, conductimètres, réfractomètres, balances", icon: "Gauge", subcategories: ["pH mètres", "Conductimètres", "Réfractomètres", "Balances"] },
  { id: "equipements", name: "Équipements de laboratoire", description: "Étuves, centrifugeuses, hottes, autoclaves", icon: "Microscope" },
  { id: "agro", name: "Agro-industrie", description: "Équipements pour l'industrie agroalimentaire", icon: "Wheat" },
  { id: "qualite", name: "Contrôle qualité", description: "Solutions de contrôle qualité industriel", icon: "ShieldCheck" },
  { id: "sante", name: "Santé et dispositifs médicaux", description: "Dispositifs médicaux et équipements cliniques", icon: "Stethoscope" },
];

export const products: Product[] = [
  { id: "p-001", name: "Gants nitrile non poudrés", reference: "INV-GN-100", brand: "Innova Lab", categoryId: "consommables", subcategory: "Gants", description: "Gants d'examen en nitrile non poudrés, résistance chimique élevée, certifiés EN 374 et EN 455. Boîte de 100 unités.", advantages: ["Sans latex, sans poudre", "Résistance chimique EN 374", "Texturé bouts des doigts", "Conforme contact alimentaire"], applications: ["Manipulation d'échantillons", "Analyses chimiques", "Soins médicaux", "Industrie agroalimentaire"], sectors: ["Laboratoire d'analyses", "Laboratoire médical", "Agroalimentaire", "Clinique / Centre médical"], image: "https://images.unsplash.com/photo-1583912267550-d6c2ac3196c0?auto=format&fit=crop&w=800&q=80" },
  { id: "p-002", name: "Tubes Falcon 50 mL stériles", reference: "INV-TB-50S", brand: "LabTech", categoryId: "consommables", subcategory: "Tubes", description: "Tubes coniques 50 mL en polypropylène, stériles, avec bouchon à vis et zone d'écriture. Sachet de 25.", advantages: ["Stérilité garantie", "Résistance centrifugation 12 000 g", "Graduation imprimée", "Bouchon étanche"], applications: ["Centrifugation", "Stockage d'échantillons", "Cultures cellulaires"], sectors: ["Laboratoire d'analyses", "Laboratoire médical"], image: "https://images.unsplash.com/photo-1581093588401-fbb62a02f120?auto=format&fit=crop&w=800&q=80" },
  { id: "p-003", name: "Pipette automatique 100-1000 µL", reference: "INV-PA-1000", brand: "Innova Lab", categoryId: "consommables", subcategory: "Pipettes", description: "Pipette monocanal volume variable 100-1000 µL, précision ±0,6%, autoclavable, éjecteur de pointe intégré.", advantages: ["Précision ±0,6%", "Ergonomie premium", "Entièrement autoclavable", "Calibration ISO 8655"], applications: ["Dosage précis", "Préparation d'échantillons", "Microbiologie"], sectors: ["Laboratoire d'analyses", "Laboratoire agronomique", "Laboratoire médical"], image: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80" },
  { id: "p-004", name: "pH-mètre de paillasse PH-700", reference: "INV-PH-700", brand: "MeterPro", categoryId: "instruments", subcategory: "pH mètres", description: "pH-mètre haute précision, écran TFT couleur, étalonnage automatique 5 points, sortie USB et impression.", advantages: ["Précision ±0,01 pH", "Étalonnage auto 5 points", "Mémoire 1000 mesures", "Conformité GLP"], applications: ["Contrôle qualité eau", "Analyses agronomiques", "Production agroalimentaire"], sectors: ["Laboratoire d'analyses", "Laboratoire agronomique", "Agroalimentaire", "Contrôle qualité"], image: "https://images.unsplash.com/photo-1606206522398-de2c5f1ce5b1?auto=format&fit=crop&w=800&q=80" },
  { id: "p-005", name: "Balance analytique 220g / 0,1mg", reference: "INV-BA-220", brand: "PrecisaLab", categoryId: "instruments", subcategory: "Balances", description: "Balance analytique professionnelle, portée 220 g, lisibilité 0,1 mg, calibrage interne automatique.", advantages: ["Lisibilité 0,1 mg", "Calibrage interne", "Pare-brise motorisé", "Connexion RS232 / USB"], applications: ["Pesées de précision", "Formulation", "Contrôle qualité"], sectors: ["Laboratoire d'analyses", "Industrie", "Contrôle qualité"], image: "https://images.unsplash.com/photo-1554475901-4538ddfbccc2?auto=format&fit=crop&w=800&q=80" },
  { id: "p-006", name: "Réfractomètre numérique Brix 0-95%", reference: "INV-RF-95", brand: "MeterPro", categoryId: "instruments", subcategory: "Réfractomètres", description: "Réfractomètre numérique portable Brix 0-95%, compensation automatique température, IP65.", advantages: ["Mesure instantanée", "ATC intégrée", "Étanche IP65", "Mémoire 100 valeurs"], applications: ["Industrie sucrière", "Jus de fruits", "Vins et boissons"], sectors: ["Agroalimentaire", "Contrôle qualité"], image: "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=800&q=80" },
  { id: "p-007", name: "Étuve de séchage 53 L ventilée", reference: "INV-ET-53", brand: "ThermoLab", categoryId: "equipements", description: "Étuve universelle à convection forcée, plage 5°C au-dessus de l'ambiante à 300°C, uniformité ±1%.", advantages: ["Régulation PID", "Sécurité surchauffe", "Porte vitrée", "Rampe programmable"], applications: ["Séchage d'échantillons", "Tests de stabilité", "Stérilisation à sec"], sectors: ["Laboratoire d'analyses", "Industrie", "Laboratoire agronomique"], image: "https://images.unsplash.com/photo-1580281657527-47f249e8f4df?auto=format&fit=crop&w=800&q=80" },
  { id: "p-008", name: "Centrifugeuse de paillasse 6000 rpm", reference: "INV-CF-6000", brand: "Innova Lab", categoryId: "equipements", description: "Centrifugeuse compacte avec rotor à godets, vitesse réglable jusqu'à 6000 rpm, minuterie digitale.", advantages: ["Rotors interchangeables", "Détection de balourd", "Couvercle de sécurité", "Faible niveau sonore"], applications: ["Séparation sérum", "Précipitation", "Cultures cellulaires"], sectors: ["Laboratoire médical", "Laboratoire d'analyses", "Clinique / Centre médical"], image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=800&q=80" },
  { id: "p-009", name: "Réactif Karl Fischer 1 L", reference: "INV-RKF-1L", brand: "ChemPro", categoryId: "reactifs", description: "Réactif pour titration Karl Fischer volumétrique, titre 5 mg H2O/mL, flacon 1 L sous atmosphère sèche.", advantages: ["Titre stable", "Conditionnement étanche", "Certificat d'analyse", "Conforme pharmacopée"], applications: ["Dosage d'eau", "Contrôle solvants", "Pharmaceutique"], sectors: ["Laboratoire d'analyses", "Industrie", "Contrôle qualité"], image: "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=800&q=80" },
  { id: "p-010", name: "Verrerie — Lot bécher gradués x6", reference: "INV-VB-LOT", brand: "Innova Lab", categoryId: "consommables", subcategory: "Verrerie", description: "Lot de 6 béchers en verre borosilicaté 3.3 (50/100/250/400/600/1000 mL), graduation durable.", advantages: ["Verre borosilicaté", "Résistance thermique", "Bec verseur", "Graduation pérenne"], applications: ["Préparations", "Titrages", "Pédagogie"], sectors: ["Laboratoire d'analyses", "Laboratoire agronomique"], image: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=800&q=80" },
  { id: "p-011", name: "Tensiomètre électronique brassard", reference: "INV-TE-BR", brand: "MediCare", categoryId: "sante", description: "Tensiomètre automatique de bras, mémoire 2x90 mesures, détection arythmie, brassard universel.", advantages: ["Validé cliniquement", "Détection arythmie", "Grand écran LCD", "Adaptateur secteur inclus"], applications: ["Suivi tension artérielle", "Consultations", "Hospitalier"], sectors: ["Clinique / Centre médical", "Laboratoire médical"], image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80" },
  { id: "p-012", name: "Détecteur de métaux convoyeur agroalimentaire", reference: "INV-DM-AGRO", brand: "QualiScan", categoryId: "agro", description: "Détecteur multi-fréquence pour ligne de production, sensibilité Fe 1.0 mm, conformité HACCP / IFS.", advantages: ["Multi-fréquence", "Auto-apprentissage", "IP69K", "Reporting HACCP"], applications: ["Sécurité produit fini", "Conformité IFS", "Production continue"], sectors: ["Agroalimentaire", "Contrôle qualité", "Industrie"], image: "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=800&q=80" },
];

export function getCategory(id: string) { return categories.find((c) => c.id === id); }
export function getProduct(id: string) { return products.find((p) => p.id === id); }
export function productsByCategory(categoryId: string) { return products.filter((p) => p.categoryId === categoryId); }
export function searchProducts(q: string) {
  const s = q.toLowerCase().trim();
  if (!s) return products;
  return products.filter((p) =>
    p.name.toLowerCase().includes(s) ||
    p.reference.toLowerCase().includes(s) ||
    p.brand.toLowerCase().includes(s) ||
    p.description.toLowerCase().includes(s),
  );
}

export type ProspectStatus = "Nouveau" | "Contacté" | "Devis envoyé" | "Négociation" | "Client" | "Perdu";

export interface Prospect {
  id: string;
  company: string;
  contact: string;
  phone: string;
  email: string;
  city: string;
  sector: Sector;
  status: ProspectStatus;
  notes?: string;
  lastVisit?: string;
  quoteCount?: number;
}

export const prospectsSeed: Prospect[] = [
  { id: "pr-1", company: "Laboratoire El Jadida Analyses", contact: "Dr. Karim Bennani", phone: "+212 6 12 34 56 78", email: "k.bennani@labej.ma", city: "El Jadida", sector: "Laboratoire d'analyses", status: "Devis envoyé", lastVisit: "2026-06-08", quoteCount: 2 },
  { id: "pr-2", company: "Coopérative Souss Agro", contact: "Fatima Zahra Idrissi", phone: "+212 6 55 44 33 22", email: "fz.idrissi@souss-agro.ma", city: "Agadir", sector: "Laboratoire agronomique", status: "Négociation", lastVisit: "2026-06-10", quoteCount: 3 },
  { id: "pr-3", company: "Clinique Atlas Casablanca", contact: "Dr. Mehdi Alaoui", phone: "+212 5 22 11 22 33", email: "m.alaoui@clinique-atlas.ma", city: "Casablanca", sector: "Clinique / Centre médical", status: "Client", lastVisit: "2026-05-30", quoteCount: 5 },
  { id: "pr-4", company: "Conserverie Atlantique", contact: "Youssef Tahiri", phone: "+212 6 78 90 12 34", email: "y.tahiri@conserve-atl.ma", city: "Safi", sector: "Agroalimentaire", status: "Contacté", lastVisit: "2026-06-12", quoteCount: 1 },
  { id: "pr-5", company: "Centre Médical Anfa", contact: "Dr. Salma Benkirane", phone: "+212 6 65 43 21 09", email: "s.benkirane@cm-anfa.ma", city: "Casablanca", sector: "Laboratoire médical", status: "Nouveau", quoteCount: 0 },
];
