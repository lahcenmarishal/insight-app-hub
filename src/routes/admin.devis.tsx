import { AdminGuard } from "@/components/admin-guard";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/app-shell";
import { fetchQuotesFn, generateQuotePdfFn, updateQuoteStatusFn, updateQuoteItemPricesFn, type QuoteRow } from "@/lib/catalog.functions";
import { FileText, FileDown, ChevronDown, ChevronRight, CheckCircle2, Mail, Send, Save, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/devis")({
  head: () => ({
    meta: [
      { title: "Devis — Administration" },
      { name: "description", content: "Suivi des devis, génération PDF et signature électronique." },
    ],
  }),
  component: () => (<AdminGuard><AdminQuotes /></AdminGuard>),
});

const STATUSES = ["Nouveau", "En cours", "Envoyé", "Signé", "Refusé"] as const;

function AdminQuotes() {
  const qc = useQueryClient();
  const fetchFn = useServerFn(fetchQuotesFn);
  const pdfFn = useServerFn(generateQuotePdfFn);
  const updateStatus = useServerFn(updateQuoteStatusFn);
  const updatePrices = useServerFn(updateQuoteItemPricesFn);
  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["quotes"],
    queryFn: () => fetchFn(),
  });
  const [expanded, setExpanded] = useState<string | null>(null);

  const downloadPdf = async (id: string) => {
    try {
      const { base64, filename } = await pdfFn({ data: { id } });
      const a = document.createElement("a");
      a.href = `data:application/pdf;base64,${base64}`;
      a.download = filename;
      a.click();
    } catch (e) {
      toast.error((e as Error).message || "Échec de la génération PDF");
    }
  };

  const onStatus = async (id: string, status: typeof STATUSES[number]) => {
    await updateStatus({ data: { id, status } });
    qc.invalidateQueries({ queryKey: ["quotes"] });
  };

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-2">
          <FileText className="h-7 w-7 text-accent" /> Devis
        </h1>
        <p className="text-muted-foreground">Devis chiffrés, génération PDF côté serveur et signature électronique.</p>
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-sm text-muted-foreground">Chargement…</div>
      ) : quotes.length === 0 ? (
        <div className="p-10 text-center text-sm text-muted-foreground bg-card border rounded-xl">Aucun devis pour le moment.</div>
      ) : (
        <div className="bg-card rounded-xl border overflow-hidden">
          {quotes.map((q) => {
            const open = expanded === q.id;
            return (
              <div key={q.id} className="border-b last:border-b-0">
                <button
                  onClick={() => setExpanded(open ? null : q.id)}
                  className="w-full grid grid-cols-12 gap-3 px-4 py-3 items-center text-sm text-left hover:bg-muted/40 transition"
                >
                  <div className="col-span-1">
                    {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                  <div className="col-span-4 min-w-0">
                    <div className="font-semibold truncate">{q.company}</div>
                    <div className="text-xs text-muted-foreground truncate">{q.contact} · {q.email}</div>
                  </div>
                  <div className="col-span-2 text-xs text-muted-foreground">
                    {new Date(q.createdAt).toLocaleDateString("fr-FR")}
                  </div>
                  <div className="col-span-2 font-semibold">{q.totalHt.toFixed(2)} €</div>
                  <div className="col-span-2">
                    <span className={"inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full " + statusTone(q.status)}>
                      {q.hasSignature && <CheckCircle2 className="h-3 w-3" />}
                      {q.status}
                    </span>
                  </div>
                  <div className="col-span-1 text-right text-xs text-muted-foreground">{q.items.length} ligne{q.items.length > 1 ? "s" : ""}</div>
                </button>

                {open && (
                  <QuoteDetail
                    quote={q}
                    onStatus={onStatus}
                    onDownloadPdf={() => downloadPdf(q.id)}
                    onSavePrices={async (items) => {
                      try {
                        await updatePrices({ data: { quoteId: q.id, items } });
                        toast.success("Prix enregistrés");
                        qc.invalidateQueries({ queryKey: ["quotes"] });
                      } catch (e) {
                        toast.error((e as Error).message || "Erreur d'enregistrement");
                      }
                    }}
                    onMarkSent={async () => {
                      try {
                        await updateStatus({ data: { id: q.id, status: "Envoyé" } });
                        qc.invalidateQueries({ queryKey: ["quotes"] });
                      } catch (e) {
                        toast.error((e as Error).message || "Erreur");
                      }
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

function statusTone(s: string) {
  switch (s) {
    case "Signé": return "bg-success/15 text-success";
    case "Refusé": return "bg-destructive/15 text-destructive";
    case "Envoyé": return "bg-primary/15 text-primary";
    case "En cours": return "bg-amber-500/15 text-amber-700";
    default: return "bg-muted text-muted-foreground";
  }
}

type PriceEdit = { id: string; unitPrice: number; quantity: number };

function QuoteDetail({
  quote,
  onStatus,
  onDownloadPdf,
  onSavePrices,
  onMarkSent,
}: {
  quote: QuoteRow;
  onStatus: (id: string, s: typeof STATUSES[number]) => void;
  onDownloadPdf: () => void;
  onSavePrices: (items: PriceEdit[]) => Promise<void>;
  onMarkSent: () => Promise<void>;
}) {
  const [prices, setPrices] = useState<Record<string, string>>(() =>
    Object.fromEntries(quote.items.map((it) => [it.id, it.unitPrice ? String(it.unitPrice) : ""])),
  );
  const [saving, setSaving] = useState(false);
  const [channel, setChannel] = useState<"email" | "whatsapp" | "both">("email");

  useEffect(() => {
    setPrices(Object.fromEntries(quote.items.map((it) => [it.id, it.unitPrice ? String(it.unitPrice) : ""])));
  }, [quote.id, quote.items]);

  const parsed = quote.items.map((it) => ({
    id: it.id,
    quantity: it.quantity,
    unitPrice: Number(prices[it.id] ?? "0") || 0,
  }));
  const computedTotal = parsed.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
  const allPriced = parsed.every((it) => it.unitPrice > 0);
  const dirty = quote.items.some((it) => Number(prices[it.id] ?? "0") !== it.unitPrice);
  const readyToSend = allPriced && !dirty;

  const buildMessage = () => {
    const ref = quote.id.slice(0, 8).toUpperCase();
    const lines = [
      `Bonjour ${quote.contact},`,
      ``,
      `Veuillez trouver ci-joint votre devis Innova Lab Solutions (N° ${ref}).`,
      `Total HT : ${computedTotal.toFixed(2)} MAD`,
      ``,
      `N'hésitez pas à nous contacter pour toute question.`,
      ``,
      `Cordialement,`,
      `L'équipe Innova Lab Solutions`,
    ];
    return lines.join("\n");
  };

  const handleSend = async () => {
    try {
      if (channel === "email" || channel === "both") {
        const subject = `Votre devis Innova Lab Solutions — N° ${quote.id.slice(0, 8).toUpperCase()}`;
        const body = buildMessage();
        const url = `mailto:${encodeURIComponent(quote.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(url, "_blank");
      }
      if (channel === "whatsapp" || channel === "both") {
        if (!quote.phone) {
          toast.error("Numéro de téléphone manquant pour WhatsApp");
        } else {
          const cleaned = quote.phone.replace(/[^\d]/g, "");
          const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(buildMessage())}`;
          window.open(url, "_blank");
        }
      }
      await onMarkSent();
      toast.success("Devis envoyé au client");
    } catch (e) {
      toast.error((e as Error).message || "Échec de l'envoi");
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSavePrices(parsed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-6 pb-5 pt-1 bg-muted/20 space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground uppercase">
            <tr>
              <th className="text-left py-2 font-semibold">Produit</th>
              <th className="text-left font-semibold">Réf.</th>
              <th className="text-right font-semibold">Qté</th>
              <th className="text-right font-semibold">PU HT (MAD)</th>
              <th className="text-right font-semibold">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((it) => {
              const unit = Number(prices[it.id] ?? "0") || 0;
              const line = unit * it.quantity;
              return (
                <tr key={it.id} className="border-t">
                  <td className="py-1.5">{it.productName}</td>
                  <td className="text-muted-foreground">{it.reference}</td>
                  <td className="text-right">{it.quantity}</td>
                  <td className="text-right">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={prices[it.id] ?? ""}
                      onChange={(e) => setPrices((p) => ({ ...p, [it.id]: e.target.value }))}
                      placeholder="0.00"
                      className="w-24 text-right px-2 py-1 rounded-md bg-card border text-sm"
                    />
                  </td>
                  <td className="text-right font-semibold">
                    {line > 0 ? `${line.toFixed(2)}` : <span className="text-muted-foreground italic">—</span>}
                  </td>
                </tr>
              );
            })}
            <tr className="border-t-2">
              <td colSpan={4} className="pt-2 text-right font-semibold">Total HT</td>
              <td className="pt-2 text-right font-bold text-accent">{computedTotal.toFixed(2)} MAD</td>
            </tr>
          </tbody>
        </table>
      </div>

      {quote.notes && (
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Notes :</span> {quote.notes}
        </div>
      )}

      {quote.signedAt && (
        <div className="text-xs text-muted-foreground">
          Signé par <span className="font-semibold text-foreground">{quote.signerName}</span> le{" "}
          {new Date(quote.signedAt).toLocaleString("fr-FR")}
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={quote.status}
          onChange={(e) => onStatus(quote.id, e.target.value as typeof STATUSES[number])}
          className="px-3 py-1.5 rounded-lg bg-card border text-sm"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {dirty && (
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-accent text-accent-foreground px-3 py-1.5 text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {saving ? "Enregistrement…" : "Enregistrer les prix"}
          </button>
        )}

        {!allPriced && !dirty && (
          <span className="text-xs text-amber-700 italic">
            Saisissez les prix manquants pour préparer l'envoi du devis.
          </span>
        )}

        {readyToSend && (
          <>
            <button
              onClick={onDownloadPdf}
              className="inline-flex items-center gap-2 rounded-lg bg-card border px-3 py-1.5 text-sm font-medium hover:bg-muted"
            >
              <FileDown className="h-4 w-4" /> Télécharger PDF
            </button>

            <div className="inline-flex items-center gap-1 rounded-lg border bg-card p-0.5 text-xs">
              <button
                onClick={() => setChannel("email")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition ${channel === "email" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                <Mail className="h-3.5 w-3.5" /> Email
              </button>
              <button
                onClick={() => setChannel("whatsapp")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition ${channel === "whatsapp" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </button>
              <button
                onClick={() => setChannel("both")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition ${channel === "both" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                Les deux
              </button>
            </div>

            <button
              onClick={handleSend}
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold hover:bg-primary-deep transition"
            >
              <Send className="h-4 w-4" /> Envoyer au client
            </button>
          </>
        )}

        {!quote.hasSignature && readyToSend && (
          <span className="text-xs text-muted-foreground italic">En attente de signature du client</span>
        )}
      </div>
    </div>
  );
}