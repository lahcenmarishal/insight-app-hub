import { AdminGuard } from "@/components/admin-guard";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Phone, MessageCircle, Mail, MapPin, FileText, Send, MapPinned, Clock, Save, Loader2 } from "lucide-react";

export const Route = createFileRoute("/parametres/")({
  head: () => ({
    meta: [
      { title: "Paramètres du site — Innova Lab Solutions" },
      { name: "description", content: "Gérer les coordonnées et informations de contact du site." },
    ],
  }),
  component: () => (<AdminGuard><AdminSettingsPage /></AdminGuard>),
});

type SiteSettings = {
  id: string;
  phone: string;
  phone_display: string;
  whatsapp: string;
  email: string;
  address: string;
  quotes_email: string;
  quotes_whatsapp: string;
  google_maps_url: string;
  business_hours: string;
};

function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<SiteSettings | null>(null);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("*")
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        else setData(data as SiteSettings | null);
        setLoading(false);
      });
  }, []);

  function update<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setData((d) => (d ? { ...d, [key]: value } : d));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    setSaving(true);
    const { id, ...payload } = data;
    const { error } = await supabase.from("site_settings").update(payload).eq("id", id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Paramètres enregistrés");
  }

  if (loading) {
    return (
      <AppShell>
        <div className="grid place-items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell>
        <div className="text-center py-20 text-muted-foreground">Aucun paramètre trouvé.</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">Paramètres du site</h1>
        <p className="text-muted-foreground text-sm">
          Coordonnées affichées sur le site public et utilisées pour l'envoi des devis.
        </p>
      </div>

      <form onSubmit={save} className="space-y-6 max-w-3xl">
        <Section title="Contact public" subtitle="Visible sur la page contact et le pied de page">
          <Field icon={<Phone className="h-4 w-4" />} label="Téléphone (lien tel:)" placeholder="+212500000000"
            value={data.phone} onChange={(v) => update("phone", v)} />
          <Field icon={<Phone className="h-4 w-4" />} label="Téléphone (format affiché)" placeholder="+212 5 00 00 00 00"
            value={data.phone_display} onChange={(v) => update("phone_display", v)} />
          <Field icon={<MessageCircle className="h-4 w-4" />} label="WhatsApp (numéro international sans +)" placeholder="212600000000"
            value={data.whatsapp} onChange={(v) => update("whatsapp", v)} />
          <Field icon={<Mail className="h-4 w-4" />} label="E-mail de contact" placeholder="contact@innovalab.ma"
            type="email" value={data.email} onChange={(v) => update("email", v)} />
          <Field icon={<MapPin className="h-4 w-4" />} label="Adresse" placeholder="Agadir, Souss-Massa, Maroc"
            value={data.address} onChange={(v) => update("address", v)} />
        </Section>

        <Section title="Envoi des devis" subtitle="Destinataires des demandes de devis générées par le site">
          <Field icon={<Send className="h-4 w-4" />} label="E-mail réception devis" placeholder="devis@innovalab.ma"
            type="email" value={data.quotes_email} onChange={(v) => update("quotes_email", v)} />
          <Field icon={<MessageCircle className="h-4 w-4" />} label="WhatsApp réception devis" placeholder="212600000000"
            value={data.quotes_whatsapp} onChange={(v) => update("quotes_whatsapp", v)} />
        </Section>

        <Section title="Localisation" subtitle="Lien Google Maps utilisé pour l'itinéraire">
          <Field icon={<MapPinned className="h-4 w-4" />} label="URL Google Maps" placeholder="https://maps.google.com/?q=..."
            value={data.google_maps_url} onChange={(v) => update("google_maps_url", v)} />
        </Section>

        <Section title="Horaires de travail" subtitle="Une ligne par jour ou par plage horaire">
          <div>
            <label className="text-xs font-semibold mb-1 flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> Horaires
            </label>
            <textarea
              rows={5}
              value={data.business_hours}
              onChange={(e) => update("business_hours", e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent font-mono"
              placeholder={"Lundi - Vendredi : 08h30 - 18h00\nSamedi : 09h00 - 13h00\nDimanche : Fermé"}
            />
          </div>
        </Section>

        <div className="sticky bottom-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-[image:var(--gradient-accent)] text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 shadow-[var(--shadow-md)]"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>
    </AppShell>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-5 md:p-6">
      <div className="mb-4">
        <h2 className="font-display font-bold">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="grid gap-4">{children}</div>
    </div>
  );
}

function Field({
  icon, label, value, onChange, placeholder, type = "text",
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold mb-1 flex items-center gap-1.5">
        {icon}{label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
      />
    </div>
  );
}
