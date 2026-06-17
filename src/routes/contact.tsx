import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Clock,
  Send,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Innova Lab Solutions" },
      { name: "description", content: "Contactez Innova Lab Solutions à Agadir : téléphone, e-mail, WhatsApp et formulaire de contact." },
      { property: "og:title", content: "Contact — Innova Lab Solutions" },
      { property: "og:description", content: "Notre équipe vous répond sous 24h." },
    ],
  }),
  component: ContactPage,
});

const PHONE = "+212500000000";
const PHONE_DISPLAY = "+212 5 00 00 00 00";
const EMAIL = "contact@innovalab.ma";
const WHATSAPP = "212600000000";
const ADDRESS = "Agadir, Souss-Massa, Maroc";

function ContactPage() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setDone(true);
      toast.success("Message envoyé — nous vous répondons sous 24h.");
      (e.target as HTMLFormElement).reset();
    }, 700);
  }

  return (
    <PublicShell>
      {/* Hero card */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-deep to-primary text-primary-foreground p-6 md:p-10 mb-6 shadow-[var(--shadow-md)]">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-accent/30 blur-2xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-white/20">
            <Building2 className="h-3.5 w-3.5" />
            Innova Lab Solutions
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-bold mt-3 leading-tight">
            Parlons de votre projet
          </h1>
          <p className="mt-2 text-sm md:text-base text-white/80 max-w-xl">
            Notre équipe vous accompagne dans le choix de vos équipements et
            consommables. Réponse garantie sous 24h.
          </p>
        </div>
      </section>

      {/* Quick contact tiles */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <ContactTile
          icon={<Phone className="h-5 w-5" />}
          label="Téléphone"
          value={PHONE_DISPLAY}
          href={`tel:${PHONE}`}
        />
        <ContactTile
          icon={<MessageCircle className="h-5 w-5" />}
          label="WhatsApp"
          value="Chat direct"
          href={`https://wa.me/${WHATSAPP}`}
          accent
        />
        <ContactTile
          icon={<Mail className="h-5 w-5" />}
          label="E-mail"
          value={EMAIL}
          href={`mailto:${EMAIL}`}
        />
        <ContactTile
          icon={<MapPin className="h-5 w-5" />}
          label="Adresse"
          value="Agadir, Maroc"
          href="https://maps.google.com/?q=Agadir+Maroc"
        />
      </section>

      <div className="grid gap-5 md:grid-cols-5">
        {/* Form */}
        <div className="md:col-span-3 bg-card border rounded-2xl p-5 md:p-7 shadow-[var(--shadow-sm)]">
          <h2 className="font-display text-lg md:text-xl font-bold mb-1">
            Envoyez-nous un message
          </h2>
          <p className="text-xs text-muted-foreground mb-5">
            Tous les champs marqués d'un * sont obligatoires.
          </p>

          {done ? (
            <div className="text-center py-10">
              <div className="mx-auto grid place-items-center h-14 w-14 rounded-full bg-primary/10 text-primary mb-3">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="font-display font-semibold">Message envoyé</div>
              <p className="text-sm text-muted-foreground mt-1">
                Nous revenons vers vous très vite.
              </p>
              <button
                type="button"
                onClick={() => setDone(false)}
                className="mt-5 text-sm font-semibold text-primary hover:underline"
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Nom complet *" name="name" placeholder="Votre nom" required />
                <Field label="Société" name="company" placeholder="Nom de la société" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="E-mail *" name="email" type="email" placeholder="vous@exemple.com" required />
                <Field label="Téléphone" name="phone" type="tel" placeholder="+212 …" />
              </div>
              <Field label="Sujet *" name="subject" placeholder="Demande d'information, devis…" required />
              <div>
                <label className="text-xs font-semibold text-foreground/80 mb-1.5 block">
                  Message *
                </label>
                <textarea
                  name="message"
                  required
                  rows={5}
                  placeholder="Décrivez votre besoin…"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-muted border border-transparent focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 text-sm resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold hover:bg-primary-deep active:scale-[0.98] transition-all shadow-[var(--shadow-sm)] disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {submitting ? "Envoi en cours…" : "Envoyer le message"}
              </button>
            </form>
          )}
        </div>

        {/* Side info */}
        <aside className="md:col-span-2 space-y-4">
          <div className="bg-card border rounded-2xl p-5 shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-primary" />
              <h3 className="font-display font-semibold text-sm">Horaires</h3>
            </div>
            <ul className="text-sm space-y-2">
              <li className="flex justify-between"><span className="text-muted-foreground">Lun – Ven</span><span className="font-medium">08:30 – 18:00</span></li>
              <li className="flex justify-between"><span className="text-muted-foreground">Samedi</span><span className="font-medium">09:00 – 13:00</span></li>
              <li className="flex justify-between"><span className="text-muted-foreground">Dimanche</span><span className="font-medium">Fermé</span></li>
            </ul>
          </div>

          <div className="bg-card border rounded-2xl p-5 shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-primary" />
              <h3 className="font-display font-semibold text-sm">Notre adresse</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{ADDRESS}</p>
            <a
              href="https://maps.google.com/?q=Agadir+Maroc"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              Voir sur Google Maps →
            </a>
          </div>

          <a
            href={`https://wa.me/${WHATSAPP}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-2xl border bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-5 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] active:scale-[0.98] transition-all"
          >
            <div className="grid place-items-center h-11 w-11 rounded-xl bg-white/20 ring-1 ring-white/30">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="font-display font-semibold text-sm">Discutons sur WhatsApp</div>
              <div className="text-xs text-white/80">Réponse rapide en journée</div>
            </div>
          </a>
        </aside>
      </div>
    </PublicShell>
  );
}

function ContactTile({
  icon,
  label,
  value,
  href,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
  accent?: boolean;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className={`group flex flex-col gap-2 rounded-2xl border p-4 transition-all active:scale-[0.98] hover:shadow-[var(--shadow-sm)] ${
        accent ? "bg-accent/10 border-accent/30 hover:border-accent" : "bg-card hover:border-primary/40"
      }`}
    >
      <div
        className={`grid place-items-center h-10 w-10 rounded-xl ${
          accent ? "bg-accent text-accent-foreground" : "bg-primary/10 text-primary"
        }`}
      >
        {icon}
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          {label}
        </div>
        <div className="text-sm font-display font-semibold leading-tight mt-0.5 truncate">
          {value}
        </div>
      </div>
    </a>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-xs font-semibold text-foreground/80 mb-1.5 block">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full px-3.5 py-2.5 rounded-xl bg-surface-muted border border-transparent focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 text-sm"
      />
    </div>
  );
}