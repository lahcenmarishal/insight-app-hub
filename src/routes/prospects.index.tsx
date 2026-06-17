import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { AdminGuard } from "@/components/admin-guard";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchProspectsFn,
  saveProspectFn,
  deleteProspectFn,
  type Prospect,
} from "@/lib/catalog.functions";
import { Search, Plus, Phone, Mail, MapPin, Building2, Pencil, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const STATUSES = ["Nouveau", "Contacté", "Devis envoyé", "Négociation", "Client", "Perdu"] as const;
type Status = typeof STATUSES[number];

export const Route = createFileRoute("/prospects/")({
  head: () => ({
    meta: [
      { title: "Prospects — Innova Lab Solutions" },
      { name: "description", content: "CRM léger : gestion des prospects, suivi des visites et statuts commerciaux." },
    ],
  }),
  component: () => (<AdminGuard><ProspectsPage /></AdminGuard>),
});

type Draft = {
  id?: string;
  company: string;
  contact: string;
  phone: string;
  email: string;
  city: string;
  sector: string;
  status: Status;
  notes: string;
};

const emptyDraft = (): Draft => ({
  company: "", contact: "", phone: "", email: "", city: "", sector: "", status: "Nouveau", notes: "",
});

function ProspectsPage() {
  const qc = useQueryClient();
  const fetchFn = useServerFn(fetchProspectsFn);
  const saveFn = useServerFn(saveProspectFn);
  const delFn = useServerFn(deleteProspectFn);

  const { data: prospects = [], isLoading } = useQuery({
    queryKey: ["prospects"],
    queryFn: () => fetchFn(),
  });

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Status | "Tous">("Tous");
  const [editing, setEditing] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    return prospects.filter((p) => {
      const matchQ = !q || [p.company, p.contact, p.city, p.sector].some((v) => v.toLowerCase().includes(q.toLowerCase()));
      const matchS = filter === "Tous" || p.status === filter;
      return matchQ && matchS;
    });
  }, [prospects, q, filter]);

  const onSave = async () => {
    if (!editing) return;
    if (!editing.company.trim()) { toast.error("La société est obligatoire"); return; }
    setSaving(true);
    try {
      await saveFn({ data: editing });
      toast.success(editing.id ? "Prospect modifié" : "Prospect créé");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["prospects"] });
    } catch (e) {
      toast.error((e as Error).message || "Échec de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Supprimer ce prospect ?")) return;
    try {
      await delFn({ data: { id } });
      toast.success("Prospect supprimé");
      qc.invalidateQueries({ queryKey: ["prospects"] });
    } catch (e) {
      toast.error((e as Error).message || "Échec de la suppression");
    }
  };

  return (
    <AppShell>
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">Prospects</h1>
          <p className="text-muted-foreground">
            {prospects.length} fiche{prospects.length > 1 ? "s" : ""} ·{" "}
            {prospects.filter((p) => p.status === "Client").length} client{prospects.filter((p) => p.status === "Client").length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setEditing(emptyDraft())}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 font-semibold text-sm hover:bg-primary-deep shadow-[var(--shadow-md)]"
        >
          <Plus className="h-4 w-4" /> Nouveau prospect
        </button>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            placeholder="Rechercher société, contact, ville…"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 text-sm"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(["Tous", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s as Status | "Tous")}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${filter === s ? "bg-primary text-primary-foreground" : "bg-card border text-muted-foreground hover:text-foreground"}`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-sm text-muted-foreground">Chargement…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          {prospects.length === 0 ? "Aucun prospect. Cliquez sur « Nouveau prospect » pour en ajouter un." : "Aucun prospect ne correspond aux filtres."}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProspectCard key={p.id} p={p} onEdit={() => setEditing({ ...p, status: p.status as Status })} onDelete={() => onDelete(p.id)} />
          ))}
        </div>
      )}

      {editing && (
        <ProspectModal
          draft={editing}
          saving={saving}
          onChange={setEditing}
          onCancel={() => setEditing(null)}
          onSave={onSave}
        />
      )}
    </AppShell>
  );
}

function ProspectCard({ p, onEdit, onDelete }: { p: Prospect; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="bg-card rounded-xl border p-5 hover:border-accent hover:shadow-[var(--shadow-md)] transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="grid place-items-center h-10 w-10 rounded-lg bg-[image:var(--gradient-accent)] text-primary-foreground">
          <Building2 className="h-5 w-5" />
        </div>
        <StatusBadge status={p.status as Status} />
      </div>
      <div className="font-display font-bold text-base mb-1 leading-tight">{p.company}</div>
      {p.contact && <div className="text-sm text-muted-foreground mb-3">{p.contact}</div>}
      <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
        {p.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 shrink-0" /> {p.phone}</div>}
        {p.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{p.email}</span></div>}
        {(p.city || p.sector) && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 shrink-0" /> {[p.city, p.sector].filter(Boolean).join(" · ")}</div>}
      </div>
      <div className="flex items-center justify-between pt-3 border-t">
        <span className="text-xs text-muted-foreground">{p.quoteCount ?? 0} devis</span>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="grid place-items-center h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground" aria-label="Modifier">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete} className="grid place-items-center h-8 w-8 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive" aria-label="Supprimer">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, string> = {
    "Nouveau": "bg-muted text-muted-foreground",
    "Contacté": "bg-accent/15 text-accent",
    "Devis envoyé": "bg-primary/10 text-primary",
    "Négociation": "bg-warning/20 text-warning-foreground",
    "Client": "bg-success/15 text-success",
    "Perdu": "bg-destructive/15 text-destructive",
  };
  return <span className={`text-[11px] font-semibold px-2 py-1 rounded-md whitespace-nowrap ${map[status]}`}>{status}</span>;
}

function ProspectModal({
  draft, saving, onChange, onCancel, onSave,
}: {
  draft: Draft; saving: boolean; onChange: (d: Draft) => void; onCancel: () => void; onSave: () => void;
}) {
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => onChange({ ...draft, [k]: v });
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onCancel}>
      <div className="bg-card rounded-2xl border w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-[var(--shadow-lg)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="font-display font-bold">{draft.id ? "Modifier le prospect" : "Nouveau prospect"}</div>
          <button onClick={onCancel} className="grid place-items-center h-8 w-8 rounded-lg hover:bg-muted" aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <PField label="Société *" value={draft.company} onChange={(v) => set("company", v)} />
          <PField label="Nom du contact" value={draft.contact} onChange={(v) => set("contact", v)} />
          <div className="grid grid-cols-2 gap-3">
            <PField label="Téléphone" value={draft.phone} onChange={(v) => set("phone", v)} type="tel" />
            <PField label="Email" value={draft.email} onChange={(v) => set("email", v)} type="email" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <PField label="Ville" value={draft.city} onChange={(v) => set("city", v)} />
            <PField label="Secteur" value={draft.sector} onChange={(v) => set("sector", v)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Statut</label>
            <select
              value={draft.status}
              onChange={(e) => set("status", e.target.value as Status)}
              className="w-full px-3 py-2.5 rounded-lg bg-surface-muted border border-transparent focus:border-ring focus:outline-none text-sm"
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Notes</label>
            <textarea
              value={draft.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg bg-surface-muted border border-transparent focus:border-ring focus:outline-none text-sm resize-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t">
          <button onClick={onCancel} className="rounded-lg bg-card border px-4 py-2 text-sm font-medium hover:bg-muted transition">Annuler</button>
          <button onClick={onSave} disabled={saving} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:bg-primary-deep transition disabled:opacity-60">
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg bg-surface-muted border border-transparent focus:border-ring focus:outline-none text-sm"
      />
    </div>
  );
}