import { AdminGuard } from "@/components/admin-guard";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useProducts, type AdminProduct } from "@/lib/catalog-data";
import { uploadProductAssetFn } from "@/lib/catalog.functions";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Pencil, Archive, ArchiveRestore, Trash2, X, FileText, Boxes, Upload, ImagePlus, FileUp, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/produits")({
  head: () => ({
    meta: [
      { title: "Gestion des produits — Administration" },
      { name: "description", content: "Créer, modifier et archiver les produits du catalogue." },
    ],
  }),
  component: () => (<AdminGuard><AdminProducts /></AdminGuard>),
});

type Draft = {
  id: string;
  name: string;
  reference: string;
  brand: string;
  categoryId: string;
  subcategory: string;
  description: string;
  image: string;
  datasheetUrl: string;
  purchasePrice: number;
  salePrice: number;
  supplierId: string;
  advantages: string;
  applications: string;
  keywords: string;
  gallery: string[];
};

const emptyDraft = (categoryId = ""): Draft => ({
  id: "",
  name: "",
  reference: "",
  brand: "",
  categoryId,
  subcategory: "",
  description: "",
  image: "",
  datasheetUrl: "",
  purchasePrice: 0,
  salePrice: 0,
  supplierId: "",
  advantages: "",
  applications: "",
  keywords: "",
  gallery: [],
});

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result || "");
      const i = s.indexOf("base64,");
      resolve(i >= 0 ? s.slice(i + 7) : s);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function AdminProducts() {
  const { all, categories, suppliers, save, remove, setArchived } = useProducts({ includeArchived: true });
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const upload = useServerFn(uploadProductAssetFn);
  const [uploading, setUploading] = useState<"image" | "gallery" | "datasheet" | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const datasheetRef = useRef<HTMLInputElement>(null);

  const list = all.filter((p) => (showArchived ? true : !p.archived));

  const openCreate = () => setEditing(emptyDraft(categories[0]?.id ?? ""));
  const openEdit = (p: AdminProduct) =>
    setEditing({
      id: p.id,
      name: p.name,
      reference: p.reference,
      brand: p.brand,
      categoryId: p.categoryId,
      subcategory: p.subcategory ?? "",
      description: p.description,
      image: p.image,
      datasheetUrl: p.datasheetUrl ?? "",
      purchasePrice: p.purchasePrice,
      salePrice: p.salePrice,
      supplierId: p.supplierId ?? "",
      advantages: (p.advantages ?? []).join("\n"),
      applications: (p.applications ?? []).join("\n"),
      keywords: (p.keywords ?? []).join(", "),
      gallery: p.gallery ?? [],
    });

  const onSave = async () => {
    if (!editing) return;
    if (!editing.name || !editing.reference || !editing.brand) {
      toast.error("Nom, référence et marque sont obligatoires");
      return;
    }
    const existing = all.find((p) => p.id === editing.id);
    const product: AdminProduct = {
      id: editing.id || `p-${Date.now()}`,
      name: editing.name,
      reference: editing.reference,
      brand: editing.brand,
      categoryId: editing.categoryId,
      subcategory: editing.subcategory || undefined,
      description: editing.description,
      image: editing.image,
      stock: 0,
      datasheetUrl: editing.datasheetUrl || undefined,
      advantages: editing.advantages.split("\n").map((s) => s.trim()).filter(Boolean),
      applications: editing.applications.split("\n").map((s) => s.trim()).filter(Boolean),
      sectors: existing?.sectors ?? [],
      archived: existing?.archived ?? false,
      purchasePrice: Number(editing.purchasePrice) || 0,
      salePrice: Number(editing.salePrice) || 0,
      marginRate: 0,
      supplierId: editing.supplierId || null,
      keywords: editing.keywords.split(",").map((s) => s.trim()).filter(Boolean),
      gallery: editing.gallery,
    };
    setSaving(true);
    try {
      await save(product);
      toast.success(existing ? "Produit modifié" : "Produit créé");
      setEditing(null);
    } catch {
      toast.error("Échec de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file: File, kind: "image" | "gallery" | "datasheet") => {
    if (!editing) return;
    if (kind === "datasheet" && file.type !== "application/pdf") {
      toast.error("Le fichier doit être un PDF");
      return;
    }
    if (kind !== "datasheet" && !file.type.startsWith("image/")) {
      toast.error("Le fichier doit être une image");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 8 Mo)");
      return;
    }
    setUploading(kind);
    try {
      const productId = editing.id || `p-${Date.now()}`;
      const dataBase64 = await fileToBase64(file);
      const res = await upload({
        data: { productId, kind, filename: file.name, contentType: file.type, dataBase64 },
      });
      if (kind === "image") setEditing({ ...editing, id: productId, image: res.token });
      else if (kind === "datasheet") setEditing({ ...editing, id: productId, datasheetUrl: res.token });
      else setEditing({ ...editing, id: productId, gallery: [...editing.gallery, res.token] });
      toast.success("Fichier envoyé");
    } catch (e) {
      toast.error((e as Error).message || "Échec de l'upload");
    } finally {
      setUploading(null);
    }
  };

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-2">
            <Boxes className="h-7 w-7 text-accent" /> Gestion des produits
          </h1>
          <p className="text-muted-foreground">Créez, modifiez et archivez les produits du catalogue.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3.5 py-2 text-sm font-semibold hover:bg-primary-deep transition shadow-[var(--shadow-md)]"
          >
            <Plus className="h-4 w-4" /> Nouveau produit
          </button>
        </div>
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-4 cursor-pointer">
        <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="rounded" />
        Afficher les produits archivés
      </label>

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <div className="col-span-6">Produit</div>
          <div className="col-span-3 hidden md:block">Catégorie</div>
          <div className="col-span-1 hidden md:block">Doc.</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        <div className="divide-y">
          {list.length === 0 && (
            <div className="p-10 text-center text-sm text-muted-foreground">Aucun produit.</div>
          )}
          {list.map((p) => {
            const cat = categories.find((c) => c.id === p.categoryId);
            return (
              <div key={p.id} className={"grid grid-cols-12 gap-3 px-4 py-3 items-center text-sm " + (p.archived ? "opacity-60" : "")}>
                <div className="col-span-6 flex items-center gap-3 min-w-0">
                  <img src={p.image} alt={p.name} className="h-10 w-10 rounded-lg object-cover bg-muted shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{p.name} {p.archived && <span className="text-xs text-muted-foreground">(archivé)</span>}</div>
                    <div className="text-xs text-muted-foreground truncate">{p.reference} · {p.brand}</div>
                  </div>
                </div>
                <div className="col-span-3 hidden md:block text-muted-foreground truncate">{cat?.name ?? "—"}</div>
                <div className="col-span-1 hidden md:block">
                  {p.datasheetUrl ? <FileText className="h-4 w-4 text-primary" /> : <span className="text-muted-foreground">—</span>}
                </div>
                <div className="col-span-2 flex items-center justify-end gap-1">
                  <button onClick={() => openEdit(p)} className="grid place-items-center h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground" aria-label="Modifier">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => { setArchived(p.id, !p.archived); toast.success(p.archived ? "Produit restauré" : "Produit archivé"); }} className="grid place-items-center h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground" aria-label="Archiver">
                    {p.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                  </button>
                  <button onClick={() => { if (confirm("Supprimer définitivement ce produit ?")) { remove(p.id); toast.success("Produit supprimé"); } }} className="grid place-items-center h-8 w-8 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive" aria-label="Supprimer">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <div className="bg-card rounded-2xl border w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[var(--shadow-lg)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="font-display font-bold">{editing.id ? "Modifier le produit" : "Nouveau produit"}</div>
              <button onClick={() => setEditing(null)} className="grid place-items-center h-8 w-8 rounded-lg hover:bg-muted" aria-label="Fermer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <DField label="Nom *" value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} />
              <div className="grid grid-cols-2 gap-3">
                <DField label="Référence *" value={editing.reference} onChange={(v) => setEditing({ ...editing, reference: v })} />
                <DField label="Marque *" value={editing.brand} onChange={(v) => setEditing({ ...editing, brand: v })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Catégorie</label>
                  <select
                    value={editing.categoryId}
                    onChange={(e) => setEditing({ ...editing, categoryId: e.target.value, subcategory: "" })}
                    className="w-full px-3 py-2.5 rounded-lg bg-surface-muted border border-transparent focus:border-ring focus:outline-none text-sm"
                  >
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Sous-catégorie</label>
                  <select
                    value={editing.subcategory}
                    onChange={(e) => setEditing({ ...editing, subcategory: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-surface-muted border border-transparent focus:border-ring focus:outline-none text-sm"
                  >
                    <option value="">— Aucune —</option>
                    {(categories.find((c) => c.id === editing.categoryId)?.subcategories ?? []).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <DField label="Prix d'achat (€)" type="number" value={String(editing.purchasePrice)} onChange={(v) => setEditing({ ...editing, purchasePrice: Number(v) || 0 })} />
                <DField label="Prix de vente (€)" type="number" value={String(editing.salePrice)} onChange={(v) => setEditing({ ...editing, salePrice: Number(v) || 0 })} />
              </div>
              {editing.purchasePrice > 0 && (
                <div className="text-xs text-muted-foreground -mt-1">
                  Marge calculée :{" "}
                  <span className="font-semibold text-foreground">
                    {(((editing.salePrice - editing.purchasePrice) / editing.purchasePrice) * 100).toFixed(2)} %
                  </span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Fournisseur</label>
                <select
                  value={editing.supplierId}
                  onChange={(e) => setEditing({ ...editing, supplierId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-surface-muted border border-transparent focus:border-ring focus:outline-none text-sm"
                >
                  <option value="">— Aucun —</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* Image principale */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Image principale</label>
                <div className="flex items-center gap-3">
                  <div className="h-20 w-20 rounded-lg bg-muted border overflow-hidden shrink-0">
                    {editing.image ? (
                      <img src={editing.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full grid place-items-center text-muted-foreground"><ImagePlus className="h-6 w-6" /></div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, "image"); e.target.value = ""; }} />
                    <button type="button" onClick={() => imageRef.current?.click()} disabled={uploading === "image"} className="inline-flex items-center gap-2 rounded-lg bg-card border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50">
                      {uploading === "image" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {uploading === "image" ? "Envoi…" : "Choisir une image"}
                    </button>
                    <input type="text" value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} placeholder="ou collez une URL d'image" className="w-full px-3 py-2 rounded-lg bg-surface-muted text-xs" />
                  </div>
                </div>
              </div>

              {/* Galerie */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Galerie d'images</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editing.gallery.map((g, i) => (
                    <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden border bg-muted group">
                      <img src={g} alt="" className="h-full w-full object-cover" />
                      <button type="button" onClick={() => setEditing({ ...editing, gallery: editing.gallery.filter((_, j) => j !== i) })} className="absolute top-0.5 right-0.5 grid place-items-center h-5 w-5 rounded-md bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={async (e) => { const files = Array.from(e.target.files ?? []); for (const f of files) { await handleUpload(f, "gallery"); } e.target.value = ""; }} />
                <button type="button" onClick={() => galleryRef.current?.click()} disabled={uploading === "gallery"} className="inline-flex items-center gap-2 rounded-lg bg-card border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50">
                  {uploading === "gallery" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                  Ajouter des images
                </button>
              </div>

              {/* Fiche technique */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Fiche technique (PDF)</label>
                <div className="flex items-center gap-2">
                  <input ref={datasheetRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, "datasheet"); e.target.value = ""; }} />
                  <button type="button" onClick={() => datasheetRef.current?.click()} disabled={uploading === "datasheet"} className="inline-flex items-center gap-2 rounded-lg bg-card border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50">
                    {uploading === "datasheet" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                    {editing.datasheetUrl ? "Remplacer le PDF" : "Téléverser un PDF"}
                  </button>
                  {editing.datasheetUrl && (
                    <>
                      <a href={editing.datasheetUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> Aperçu</a>
                      <button type="button" onClick={() => setEditing({ ...editing, datasheetUrl: "" })} className="text-xs text-destructive hover:underline">Retirer</button>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg bg-surface-muted border border-transparent focus:border-ring focus:outline-none text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Mots-clés <span className="text-muted-foreground/70 normal-case font-normal">(séparés par des virgules — affichés sous la description)</span>
                </label>
                <input
                  value={editing.keywords}
                  onChange={(e) => setEditing({ ...editing, keywords: e.target.value })}
                  placeholder="laboratoire, précision, mesure, qualité"
                  className="w-full px-3 py-2.5 rounded-lg bg-surface-muted border border-transparent focus:border-ring focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Avantages <span className="text-muted-foreground/70 normal-case font-normal">(un par ligne)</span>
                </label>
                <textarea
                  value={editing.advantages}
                  onChange={(e) => setEditing({ ...editing, advantages: e.target.value })}
                  rows={4}
                  placeholder={"Haute précision\nFacile d'utilisation\nÉconomie d'énergie"}
                  className="w-full px-3 py-2.5 rounded-lg bg-surface-muted border border-transparent focus:border-ring focus:outline-none text-sm resize-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Applications <span className="text-muted-foreground/70 normal-case font-normal">(une par ligne)</span>
                </label>
                <textarea
                  value={editing.applications}
                  onChange={(e) => setEditing({ ...editing, applications: e.target.value })}
                  rows={4}
                  placeholder={"Laboratoire de biologie\nIndustrie agroalimentaire\nRecherche universitaire"}
                  className="w-full px-3 py-2.5 rounded-lg bg-surface-muted border border-transparent focus:border-ring focus:outline-none text-sm resize-none font-mono"
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
