import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-shell";
import { useQuoteCart } from "@/lib/quote-store";
import { submitQuoteFn } from "@/lib/catalog.functions";
import { useCatalog } from "@/lib/catalog-data";
import { useServerFn } from "@tanstack/react-start";
import { Trash2, Plus, Minus, Send, ShoppingCart, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface DevisSearch {
  company?: string;
  contact?: string;
  phone?: string;
  email?: string;
  city?: string;
  notes?: string;
}

export const Route = createFileRoute("/devis/")({
  validateSearch: (search: Record<string, unknown>): DevisSearch => ({
    company: typeof search.company === "string" ? search.company : undefined,
    contact: typeof search.contact === "string" ? search.contact : undefined,
    phone: typeof search.phone === "string" ? search.phone : undefined,
    email: typeof search.email === "string" ? search.email : undefined,
    city: typeof search.city === "string" ? search.city : undefined,
    notes: typeof search.notes === "string" ? search.notes : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Demande de devis — Innova Lab Solutions" },
      { name: "description", content: "Composez et envoyez votre demande de devis personnalisée." },
    ],
  }),
  component: QuotePage,
});

function QuotePage() {
  const { items, update, remove, clear } = useQuoteCart();
  const { products } = useCatalog();
  const prefill = Route.useSearch();
  const submitQuote = useServerFn(submitQuoteFn);
  const [sending, setSending] = useState(false);
  const [lastQuote, setLastQuote] = useState<{ id: string; contact: string } | null>(null);
  const [form, setForm] = useState({
    company: prefill.company ?? "",
    contact: prefill.contact ?? "",
    phone: prefill.phone ?? "",
    email: prefill.email ?? "",
    city: prefill.city ?? "",
    notes: prefill.notes ?? "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Ajoutez au moins un produit");
      return;
    }
    if (!form.company || !form.contact || !form.email) {
      toast.error("Société, contact et email sont obligatoires");
      return;
    }
    setSending(true);
    try {
      const res = await submitQuote({
        data: {
          company: form.company,
          contact: form.contact,
          phone: form.phone || undefined,
          email: form.email,
          city: form.city || undefined,
          notes: form.notes || undefined,
          items: items.map((it) => ({
            productId: it.productId,
            productName: it.productName,
            reference: it.reference,
            quantity: it.quantity,
          })),
        },
      });
      setLastQuote({ id: res.id, contact: form.contact });
      toast.success("Demande de devis enregistrée", {
        description: "Notre équipe vous recontactera rapidement.",
      });
      clear();
      setForm({ company: "", contact: "", phone: "", email: "", city: "", notes: "" });
    } catch {
      toast.error("Échec de l'envoi, réessayez.");
    } finally {
      setSending(false);
    }
  };

  // Prix unitaire à partir du catalogue
  const priceFor = (id: string) => products.find((p) => p.id === id)?.salePrice ?? 0;
  const totalHt = items.reduce((s, it) => s + priceFor(it.productId) * it.quantity, 0);

  return (
    <PublicShell>
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">Demande de devis</h1>
          <p className="text-muted-foreground">Vérifiez les produits, complétez vos coordonnées et envoyez votre demande.</p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg bg-accent text-accent-foreground px-5 py-3 text-base font-bold hover:brightness-110 transition shadow-[var(--shadow-md)]"
        >
          <ArrowLeft className="h-5 w-5" /> Continuer mes achats
        </Link>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Panier */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-card rounded-xl border overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div className="font-display font-bold flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-accent" />
                Produits ({items.length})
              </div>
              {items.length > 0 && (
                <button onClick={clear} className="text-xs text-muted-foreground hover:text-destructive">Vider</button>
              )}
            </div>

            {items.length === 0 ? (
              <div className="p-10 text-center">
                <div className="grid place-items-center h-14 w-14 rounded-full bg-muted text-muted-foreground mx-auto mb-4">
                  <ShoppingCart className="h-6 w-6" />
                </div>
                <div className="font-semibold mb-1">Votre demande est vide</div>
                <p className="text-sm text-muted-foreground mb-5">Parcourez le catalogue et ajoutez des produits.</p>
                <Link to="/" className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary-deep">
                  <ArrowLeft className="h-4 w-4" /> Aller au catalogue
                </Link>
              </div>
            ) : (
              <div className="divide-y">
                {items.map((it) => (
                  <div key={it.productId} className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{it.productName}</div>
                      <div className="text-xs text-muted-foreground">
                        {it.reference}
                        {priceFor(it.productId) > 0 && <> · {priceFor(it.productId).toFixed(2)} € HT</>}
                      </div>
                    </div>
                    <div className="flex items-center bg-surface-muted rounded-lg">
                      <button onClick={() => update(it.productId, Math.max(1, it.quantity - 1))} className="grid place-items-center h-9 w-9 hover:text-accent" aria-label="Diminuer">
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-10 text-center text-sm font-semibold">{it.quantity}</span>
                      <button onClick={() => update(it.productId, it.quantity + 1)} className="grid place-items-center h-9 w-9 hover:text-accent" aria-label="Augmenter">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="hidden sm:block w-20 text-right text-sm font-semibold">
                      {priceFor(it.productId) > 0 ? `${(priceFor(it.productId) * it.quantity).toFixed(2)} €` : "—"}
                    </div>
                    <button onClick={() => remove(it.productId)} className="grid place-items-center h-9 w-9 text-muted-foreground hover:text-destructive" aria-label="Supprimer">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {totalHt > 0 && (
                  <div className="px-4 py-3 flex items-center justify-between bg-muted/30">
                    <span className="font-semibold">Total HT estimé</span>
                    <span className="font-display font-bold text-lg text-accent">{totalHt.toFixed(2)} €</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Formulaire client */}
        <div className="lg:col-span-2 space-y-3 h-fit sticky top-20">
          <form onSubmit={submit} className="bg-card rounded-xl border p-5 space-y-4">
            <div className="font-display font-bold mb-2">Vos coordonnées</div>

          <Field label="Société *" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
          <Field label="Nom du contact *" value={form.contact} onChange={(v) => setForm({ ...form, contact: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Téléphone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} type="tel" />
            <Field label="Ville" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
          </div>
          <Field label="Email *" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Commentaires</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg bg-surface-muted border border-transparent focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 text-sm resize-none"
              placeholder="Délai souhaité, conditionnement particulier…"
            />
          </div>

          <div className="space-y-2 pt-2">
            <button type="submit" disabled={sending} className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-3 font-semibold text-sm hover:bg-primary-deep transition shadow-[var(--shadow-md)] disabled:opacity-60">
              <Send className="h-4 w-4" /> {sending ? "Envoi…" : "Envoyer la demande"}
            </button>
          </div>
          </form>
        </div>
      </div>

      {lastQuote && (
        <div className="mt-6 bg-success/10 border border-success/30 rounded-xl p-5">
          <div className="font-display font-bold text-success mb-1">Demande enregistrée — merci !</div>
          <p className="text-sm text-muted-foreground">Notre équipe vous recontactera rapidement avec un devis personnalisé.</p>
        </div>
      )}
    </PublicShell>
  );
}


function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg bg-surface-muted border border-transparent focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 text-sm"
      />
    </div>
  );
}
