import { AdminGuard } from "@/components/admin-guard";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useSuppliers, type Supplier } from "@/lib/catalog-data";
import { Plus, Pencil, Trash2, X, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/fournisseurs")({
  head: () => ({
    meta: [
      { title: "Fournisseurs — Administration" },
      { name: "description", content: "Gérer les fournisseurs et leurs coordonnées." },
    ],
  }),
  component: () => (<AdminGuard><AdminSuppliers /></AdminGuard>),
});

type Draft = {
  id?: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  country: string;
  notes: string;
};

const empty = (): Draft => ({ name: "", contact: "", email: "", phone: "", country: "", notes: "" });

function AdminSuppliers() {
  const { suppliers, save, remove } = useSuppliers();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const openEdit = (s: Supplier) => setEditing({ ...s });

  const onSave = async () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      toast.error("Le nom est obligatoire");
      return;
    }
    setSaving(true);
    try {
      await save(editing);
      toast.success(editing.id ? "Fournisseur modifié" : "Fournisseur créé");
      setEditing(null);
    } catch (e) {
      toast.error((e as Error).message || "Échec de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-2">
            <Truck className="h-7 w-7 text-accent" /> Fournisseurs
          </h1>
          <p className="text-muted-foreground">Référencez vos fournisseurs et associez-les aux produits.</p>
        </div>
        <button
          onClick={() => setEditing(empty())}
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3.5 py-2 text-sm font-semibold hover:bg-primary-deep transition shadow-[var(--shadow-md)]"
        >
          <Plus className="h-4 w-4" /> Nouveau fournisseur
        </button>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <div className="col-span-4">Nom</div>
          <div className="col-span-3 hidden md:block">Contact</div>
          <div className="col-span-3 hidden md:block">Email / Téléphone</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        <div className="divide-y">
          {suppliers.length === 0 && (
            <div className="p-10 text-center text-sm text-muted-foreground">Aucun fournisseur.</div>
          )}
          {suppliers.map((s) => (
            <div key={s.id} className="grid grid-cols-12 gap-3 px-4 py-3 items-center text-sm">
              <div className="col-span-4">
                <div className="font-semibold">{s.name}</div>
                <div className="text-xs text-muted-foreground">{s.country || "—"}</div>
              </div>
              <div className="col-span-3 hidden md:block text-muted-foreground truncate">{s.contact || "—"}</div>
              <div className="col-span-3 hidden md:block text-muted-foreground truncate">
                <div className="truncate">{s.email || "—"}</div>
                <div className="text-xs truncate">{s.phone || ""}</div>
              </div>
              <div className="col-span-2 flex items-center justify-end gap-1">
                <button onClick={() => openEdit(s)} className="grid place-items-center h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground" aria-label="Modifier">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => { if (confirm(`Supprimer ${s.name} ?`)) { remove(s.id).then(() => toast.success("Fournisseur supprimé")); } }} className="grid place-items-center h-8 w-8 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive" aria-label="Supprimer">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <div className="bg-card rounded-2xl border w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-[var(--shadow-lg)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="font-display font-bold">{editing.id ? "Modifier le fournisseur" : "Nouveau fournisseur"}</div>
              <button onClick={() => setEditing(null)} className="grid place-items-center h-8 w-8 rounded-lg hover:bg-muted" aria-label="Fermer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <DField label="Nom *" value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} />
              <div className="grid grid-cols-2 gap-3">
                <DField label="Contact" value={editing.contact} onChange={(v) => setEditing({ ...editing, contact: v })} />
                <DField label="Pays" value={editing.country} onChange={(v) => setEditing({ ...editing, country: v })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <DField label="Email" type="email" value={editing.email} onChange={(v) => setEditing({ ...editing, email: v })} />
                <DField label="Téléphone" value={editing.phone} onChange={(v) => setEditing({ ...editing, phone: v })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Notes</label>
                <textarea
                  value={editing.notes}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg bg-surface-muted border border-transparent focus:border-ring focus:outline-none text-sm resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t">
              <button onClick={() => setEditing(null)} className="rounded-lg bg-card border px-4 py-2 text-sm font-medium hover:bg-muted transition">Annuler</button>
              <button onClick={onSave} disabled={saving} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:bg-primary-deep transition disabled:opacity-60">{saving ? "Enregistrement…" : "Enregistrer"}</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function DField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
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