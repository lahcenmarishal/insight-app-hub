import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/start-server-core";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Category, Product, Sector } from "@/data/catalog";
import type { Database } from "@/integrations/supabase/types";

export interface AdminProduct extends Product {
  stock: number;
  archived: boolean;
  purchasePrice: number;
  salePrice: number;
  marginRate: number;
  supplierId: string | null;
  keywords: string[];
  gallery: string[];
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  country: string;
  notes: string;
}

function mapCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? "",
    icon: (row.icon as string) ?? "",
    subcategories: (row.subcategories as string[]) ?? [],
  };
}

function mapProduct(row: Record<string, unknown>): AdminProduct {
  return {
    id: row.id as string,
    name: row.name as string,
    reference: row.reference as string,
    brand: (row.brand as string) ?? "",
    categoryId: (row.category_id as string) ?? "",
    subcategory: (row.subcategory as string) ?? undefined,
    description: (row.description as string) ?? "",
    advantages: (row.advantages as string[]) ?? [],
    applications: (row.applications as string[]) ?? [],
    sectors: ((row.sectors as string[]) ?? []) as Sector[],
    image: (row.image as string) ?? "",
    gallery: ((row.gallery as string[]) ?? []) as string[],
    datasheetUrl: (row.datasheet_url as string) ?? undefined,
    stock: (row.stock as number) ?? 0,
    archived: Boolean(row.archived),
    purchasePrice: Number(row.purchase_price ?? 0),
    salePrice: Number(row.sale_price ?? 0),
    marginRate: Number(row.margin_rate ?? 0),
    supplierId: (row.supplier_id as string | null) ?? null,
    keywords: ((row.keywords as string[]) ?? []) as string[],
  };
}

function mapSupplier(row: Record<string, unknown>): Supplier {
  return {
    id: row.id as string,
    name: (row.name as string) ?? "",
    contact: (row.contact as string) ?? "",
    email: (row.email as string) ?? "",
    phone: (row.phone as string) ?? "",
    country: (row.country as string) ?? "",
    notes: (row.notes as string) ?? "",
  };
}

const STORAGE_PREFIX = "storage:";

function cleanEnvValue(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "");
}

function createSupabasePublicClient() {
  const supabaseUrl = cleanEnvValue(process.env.SUPABASE_URL);
  const supabaseKey = cleanEnvValue(process.env.SUPABASE_PUBLISHABLE_KEY);

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Configuration backend manquante: SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY");
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function resolveAssetUrl(
  supabase: { storage: { from: (b: string) => { createSignedUrl: (p: string, exp: number) => Promise<{ data: { signedUrl: string } | null; error: unknown }> } } },
  value: string,
): Promise<string> {
  if (!value) return "";
  if (!value.startsWith(STORAGE_PREFIX)) return value;
  const path = value.slice(STORAGE_PREFIX.length);
  const { data } = await supabase.storage.from("product-assets").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? "";
}

export const fetchCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const supabasePublic = createSupabasePublicClient();
  const [cats, prods, sups] = await Promise.all([
    supabasePublic.from("categories").select("*").order("sort_order", { ascending: true }),
    supabasePublic.from("products").select("*").order("created_at", { ascending: true }),
    supabasePublic.from("suppliers").select("*").order("name", { ascending: true }),
  ]);
  if (cats.error) throw new Error(cats.error.message);
  if (prods.error) throw new Error(prods.error.message);
  if (sups.error) throw new Error(sups.error.message);
  const products = await Promise.all(
    (prods.data ?? []).map(async (row) => {
      const p = mapProduct(row);
      const [image, datasheet, gallery] = await Promise.all([
        resolveAssetUrl(supabasePublic, p.image),
        p.datasheetUrl ? resolveAssetUrl(supabasePublic, p.datasheetUrl) : Promise.resolve(undefined),
        Promise.all((p.gallery ?? []).map((g) => resolveAssetUrl(supabasePublic, g))),
      ]);
      return { ...p, image, datasheetUrl: datasheet, gallery: gallery.filter(Boolean) };
    }),
  );
  return {
    categories: (cats.data ?? []).map(mapCategory),
    products,
    suppliers: (sups.data ?? []).map(mapSupplier),
  };
});

const productInput = z.object({
  id: z.string().min(1).max(80).optional(),
  name: z.string().min(1).max(300),
  reference: z.string().min(1).max(120),
  brand: z.string().max(120).default(""),
  categoryId: z.string().max(80).default(""),
  subcategory: z.string().max(120).optional(),
  description: z.string().max(5000).default(""),
  image: z.string().max(1000).default(""),
  stock: z.number().int().min(0).max(1_000_000).default(0),
  datasheetUrl: z.string().max(1000).optional(),
  advantages: z.array(z.string().max(300)).max(50).default([]),
  applications: z.array(z.string().max(300)).max(50).default([]),
  sectors: z.array(z.string().max(120)).max(50).default([]),
  keywords: z.array(z.string().max(120)).max(50).default([]),
  gallery: z.array(z.string().max(1000)).max(20).default([]),
  archived: z.boolean().default(false),
  purchasePrice: z.number().min(0).max(1_000_000).default(0),
  salePrice: z.number().min(0).max(1_000_000).default(0),
  supplierId: z.string().uuid().nullable().optional(),
});

export const saveProductFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => productInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = data.id && data.id.length ? data.id : `p-${Date.now()}`;
    const row = {
      id,
      name: data.name,
      reference: data.reference,
      brand: data.brand,
      category_id: data.categoryId || null,
      subcategory: data.subcategory || null,
      description: data.description,
      image: data.image,
      stock: data.stock,
      datasheet_url: data.datasheetUrl || null,
      advantages: data.advantages,
      applications: data.applications,
      sectors: data.sectors,
      keywords: data.keywords,
      gallery: data.gallery,
      archived: data.archived,
      purchase_price: data.purchasePrice,
      sale_price: data.salePrice,
      supplier_id: data.supplierId ?? null,
    };
    const { error } = await supabaseAdmin.from("products").upsert(row);
    if (error) throw new Error(error.message);
    return { id };
  });

export const deleteProductFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setArchivedFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().min(1).max(80), archived: z.boolean() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("products")
      .update({ archived: data.archived })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Upload a product asset (image / gallery image / datasheet PDF) to Supabase Storage.
// Returns a path token "storage:<path>" to save in DB plus a signed URL for immediate preview.
export const uploadProductAssetFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        productId: z.string().min(1).max(80),
        kind: z.enum(["image", "gallery", "datasheet"]),
        filename: z.string().min(1).max(200),
        contentType: z.string().min(1).max(120),
        dataBase64: z.string().min(10).max(15_000_000), // ~10 MB
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const safeName = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${data.productId}/${data.kind}/${Date.now()}-${safeName}`;
    const bytes = Uint8Array.from(atob(data.dataBase64), (c) => c.charCodeAt(0));
    const { error } = await supabaseAdmin.storage
      .from("product-assets")
      .upload(path, bytes, { contentType: data.contentType, upsert: true });
    if (error) throw new Error(error.message);
    const { data: signed } = await supabaseAdmin.storage
      .from("product-assets")
      .createSignedUrl(path, 60 * 60);
    return { token: `${STORAGE_PREFIX}${path}`, signedUrl: signed?.signedUrl ?? "" };
  });

const supplierInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  contact: z.string().max(200).default(""),
  email: z.string().email().max(200).or(z.literal("")).default(""),
  phone: z.string().max(60).default(""),
  country: z.string().max(120).default(""),
  notes: z.string().max(2000).default(""),
});

export const saveSupplierFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => supplierInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row = {
      name: data.name,
      contact: data.contact,
      email: data.email,
      phone: data.phone,
      country: data.country,
      notes: data.notes,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("suppliers").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: ins, error } = await supabaseAdmin
      .from("suppliers")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: ins.id as string };
  });

export const deleteSupplierFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("suppliers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const quoteInput = z.object({
  company: z.string().min(1).max(300),
  contact: z.string().min(1).max(300),
  phone: z.string().max(60).optional(),
  email: z.string().email().max(300),
  city: z.string().max(120).optional(),
  notes: z.string().max(5000).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().max(80).optional(),
        productName: z.string().min(1).max(300),
        reference: z.string().max(120).default(""),
        quantity: z.number().int().min(1).max(100000),
      }),
    )
    .min(1)
    .max(200),
});

export const submitQuoteFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => quoteInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const productIds = data.items.map((it) => it.productId).filter((x): x is string => !!x);
    const priceMap = new Map<string, number>();
    if (productIds.length) {
      const { data: prods, error: pErr } = await supabaseAdmin
        .from("products")
        .select("id, sale_price")
        .in("id", productIds);
      if (pErr) throw new Error(pErr.message);
      (prods ?? []).forEach((p) => priceMap.set(p.id as string, Number(p.sale_price ?? 0)));
    }
    const pricedItems = data.items.map((it) => {
      const unit = it.productId ? (priceMap.get(it.productId) ?? 0) : 0;
      return { ...it, unitPrice: unit, lineTotal: +(unit * it.quantity).toFixed(2) };
    });
    const totalHt = +pricedItems.reduce((s, it) => s + it.lineTotal, 0).toFixed(2);

    const { data: quote, error } = await supabaseAdmin
      .from("quotes")
      .insert({
        company: data.company,
        contact: data.contact,
        phone: data.phone || null,
        email: data.email,
        city: data.city || null,
        notes: data.notes || null,
        status: "Nouveau",
        total_ht: totalHt,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    const items = pricedItems.map((it) => ({
      quote_id: quote.id,
      product_id: it.productId || null,
      product_name: it.productName,
      reference: it.reference,
      quantity: it.quantity,
      unit_price: it.unitPrice,
      line_total: it.lineTotal,
    }));
    const { error: itemsErr } = await supabaseAdmin.from("quote_items").insert(items);
    if (itemsErr) throw new Error(itemsErr.message);

    // Auto-créer / mettre à jour le prospect associé
    try {
      const emailNorm = data.email.trim().toLowerCase();
      const { data: existing } = await supabaseAdmin
        .from("prospects")
        .select("id, quote_count, notes, status")
        .ilike("email", emailNorm)
        .maybeSingle();
      const nowIso = new Date().toISOString();
      if (existing) {
        await supabaseAdmin
          .from("prospects")
          .update({
            quote_count: (Number(existing.quote_count) || 0) + 1,
            last_visit: nowIso,
            status: existing.status === "Nouveau" ? "Devis envoyé" : existing.status,
            company: data.company,
            contact: data.contact,
            phone: data.phone || "",
            city: data.city || "",
          })
          .eq("id", existing.id);
      } else {
        await supabaseAdmin.from("prospects").insert({
          company: data.company,
          contact: data.contact,
          phone: data.phone || "",
          email: data.email,
          city: data.city || "",
          sector: "Non spécifié",
          status: "Devis envoyé",
          notes: data.notes || "",
          quote_count: 1,
          last_visit: nowIso,
        });
      }
    } catch (e) {
      console.error("[submitQuoteFn] prospect upsert failed", e);
    }

    return { id: quote.id, totalHt };
  });

export interface QuoteRow {
  id: string;
  company: string;
  contact: string;
  email: string;
  phone: string | null;
  city: string | null;
  notes: string | null;
  status: string;
  totalHt: number;
  createdAt: string;
  signedAt: string | null;
  signerName: string | null;
  hasSignature: boolean;
  items: { id: string; productName: string; reference: string; quantity: number; unitPrice: number; lineTotal: number }[];
}

export const fetchQuotesFn = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: quotes, error: qErr }, { data: items, error: iErr }] = await Promise.all([
    supabaseAdmin.from("quotes").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("quote_items").select("*"),
  ]);
  if (qErr) throw new Error(qErr.message);
  if (iErr) throw new Error(iErr.message);
  const byQuote = new Map<string, QuoteRow["items"]>();
  (items ?? []).forEach((r) => {
    const arr = byQuote.get(r.quote_id as string) ?? [];
    arr.push({
      id: r.id as string,
      productName: (r.product_name as string) ?? "",
      reference: (r.reference as string) ?? "",
      quantity: Number(r.quantity ?? 0),
      unitPrice: Number(r.unit_price ?? 0),
      lineTotal: Number(r.line_total ?? 0),
    });
    byQuote.set(r.quote_id as string, arr);
  });
  return (quotes ?? []).map((q): QuoteRow => ({
    id: q.id as string,
    company: (q.company as string) ?? "",
    contact: (q.contact as string) ?? "",
    email: (q.email as string) ?? "",
    phone: (q.phone as string | null) ?? null,
    city: (q.city as string | null) ?? null,
    notes: (q.notes as string | null) ?? null,
    status: (q.status as string) ?? "Nouveau",
    totalHt: Number(q.total_ht ?? 0),
    createdAt: q.created_at as string,
    signedAt: (q.signed_at as string | null) ?? null,
    signerName: (q.signer_name as string | null) ?? null,
    hasSignature: Boolean(q.signature_data),
    items: byQuote.get(q.id as string) ?? [],
  }));
});

export const signQuoteFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        signerName: z.string().min(1).max(200),
        signatureData: z.string().min(50).max(500_000),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("quotes")
      .update({
        signature_data: data.signatureData,
        signer_name: data.signerName,
        signed_at: new Date().toISOString(),
        status: "Signé",
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateQuoteStatusFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["Nouveau", "En cours", "Envoyé", "Signé", "Refusé"]) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("quotes").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateQuoteItemPricesFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        quoteId: z.string().uuid(),
        items: z
          .array(
            z.object({
              id: z.string().uuid(),
              unitPrice: z.number().min(0).max(10_000_000),
              quantity: z.number().int().min(1).max(1_000_000),
            }),
          )
          .min(1)
          .max(500),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let total = 0;
    for (const it of data.items) {
      const line = +(it.unitPrice * it.quantity).toFixed(2);
      total += line;
      const { error } = await supabaseAdmin
        .from("quote_items")
        .update({ unit_price: it.unitPrice, line_total: line })
        .eq("id", it.id)
        .eq("quote_id", data.quoteId);
      if (error) throw new Error(error.message);
    }
    const { error: qErr } = await supabaseAdmin
      .from("quotes")
      .update({ total_ht: +total.toFixed(2) })
      .eq("id", data.quoteId);
    if (qErr) throw new Error(qErr.message);
    return { ok: true, totalHt: +total.toFixed(2) };
  });

const LOGO_PATH = "/__l5e/assets-v1/78f6a149-6073-4b07-9757-32728156e72a/innova-logo.png";

export const generateQuotePdfFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: q, error: qErr }, { data: items, error: iErr }] = await Promise.all([
      supabaseAdmin.from("quotes").select("*").eq("id", data.id).single(),
      supabaseAdmin.from("quote_items").select("*").eq("quote_id", data.id),
    ]);
    if (qErr) throw new Error(qErr.message);
    if (iErr) throw new Error(iErr.message);

    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]); // A4
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);
    const accent = rgb(0.05, 0.45, 0.55);
    const text = rgb(0.1, 0.15, 0.2);
    const muted = rgb(0.45, 0.5, 0.55);

    // Tentative d'embed du logo Innova Lab Solutions
    let logoImg: Awaited<ReturnType<typeof pdf.embedPng>> | null = null;
    try {
      const req = getRequest();
      const origin = new URL(req.url).origin;
      const res = await fetch(`${origin}${LOGO_PATH}`);
      if (res.ok) {
        const buf = new Uint8Array(await res.arrayBuffer());
        logoImg = await pdf.embedPng(buf);
      }
    } catch {
      /* logo facultatif */
    }

    let y = 800;
    if (logoImg) {
      const scale = 50 / logoImg.height;
      const w = logoImg.width * scale;
      page.drawImage(logoImg, { x: 40, y: y - 10, width: w, height: 50 });
    }
    page.drawText("DEVIS", { x: 460, y: y + 20, size: 24, font: bold, color: accent });
    page.drawText("Innova Lab Solutions", { x: 400, y, size: 10, font: bold, color: text });
    y -= 50;
    page.drawText(`N° ${(q.id as string).slice(0, 8).toUpperCase()}`, { x: 40, y, size: 10, font, color: muted });
    page.drawText(`Date : ${new Date(q.created_at as string).toLocaleDateString("fr-FR")}`, { x: 400, y, size: 10, font, color: muted });
    y -= 18;
    page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 1, color: accent });

    y -= 25;
    page.drawText("Client", { x: 40, y, size: 11, font: bold, color: accent });
    y -= 16;
    page.drawText(`${q.company}`, { x: 40, y, size: 11, font: bold, color: text });
    y -= 14;
    page.drawText(`${q.contact}  ·  ${q.email}`, { x: 40, y, size: 10, font, color: text });
    if (q.phone || q.city) {
      y -= 14;
      page.drawText(`${q.phone ?? ""}${q.phone && q.city ? "  ·  " : ""}${q.city ?? ""}`, { x: 40, y, size: 10, font, color: muted });
    }

    y -= 30;
    page.drawRectangle({ x: 40, y: y - 4, width: 515, height: 22, color: rgb(0.95, 0.97, 0.98) });
    page.drawText("Désignation", { x: 46, y, size: 10, font: bold, color: text });
    page.drawText("Réf.", { x: 290, y, size: 10, font: bold, color: text });
    page.drawText("Qté", { x: 360, y, size: 10, font: bold, color: text });
    page.drawText("PU HT", { x: 410, y, size: 10, font: bold, color: text });
    page.drawText("Total HT", { x: 490, y, size: 10, font: bold, color: text });
    y -= 22;

    let total = 0;
    let hasOnRequest = false;
    for (const it of items ?? []) {
      const name = String(it.product_name ?? "").slice(0, 50);
      const unit = Number(it.unit_price ?? 0);
      const line = Number(it.line_total ?? 0);
      page.drawText(name, { x: 46, y, size: 9, font, color: text });
      page.drawText(String(it.reference ?? ""), { x: 290, y, size: 9, font, color: muted });
      page.drawText(String(it.quantity ?? 0), { x: 360, y, size: 9, font, color: text });
      if (unit > 0) {
        page.drawText(`${unit.toFixed(2)} €`, { x: 410, y, size: 9, font, color: text });
        page.drawText(`${line.toFixed(2)} €`, { x: 490, y, size: 9, font, color: text });
        total += line;
      } else {
        page.drawText("Sur demande", { x: 410, y, size: 9, font: italic, color: muted });
        page.drawText("Sur demande", { x: 490, y, size: 9, font: italic, color: muted });
        hasOnRequest = true;
      }
      y -= 16;
      if (y < 120) break;
    }

    y -= 14;
    page.drawLine({ start: { x: 380, y }, end: { x: 555, y }, thickness: 0.5, color: muted });
    y -= 18;
    page.drawText("Total HT", { x: 400, y, size: 11, font: bold, color: text });
    if (total > 0) {
      page.drawText(`${total.toFixed(2)} €`, { x: 490, y, size: 11, font: bold, color: accent });
    } else {
      page.drawText("Sur demande", { x: 470, y, size: 11, font: bold, color: accent });
    }
    if (hasOnRequest && total > 0) {
      y -= 14;
      page.drawText("* Certaines lignes sont à chiffrer — un complément vous sera adressé.", {
        x: 40, y, size: 8, font: italic, color: muted,
      });
    }

    if (q.signature_data && q.signed_at) {
      y -= 60;
      page.drawText("Signature client", { x: 40, y, size: 10, font: bold, color: accent });
      y -= 14;
      page.drawText(`${q.signer_name ?? ""} — ${new Date(q.signed_at as string).toLocaleString("fr-FR")}`, { x: 40, y, size: 9, font, color: muted });
      try {
        const b64 = String(q.signature_data).split(",").pop() ?? "";
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        const png = await pdf.embedPng(bytes);
        const dims = png.scale(0.4);
        page.drawImage(png, { x: 40, y: y - dims.height - 6, width: Math.min(dims.width, 220), height: Math.min(dims.height, 80) });
      } catch {
        /* signature image invalide, ignorer */
      }
    }

    page.drawText("Document généré automatiquement — Innova Lab Solutions", {
      x: 40, y: 30, size: 8, font, color: muted,
    });

    const bytes = await pdf.save();
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
    }
    const base64 = btoa(binary);
    return { base64, filename: `devis-${(q.id as string).slice(0, 8)}.pdf` };
  });

// ============= Prospects (CRM) =============

export interface Prospect {
  id: string;
  company: string;
  contact: string;
  phone: string;
  email: string;
  city: string;
  sector: string;
  status: string;
  notes: string;
  quoteCount: number;
  lastVisit: string | null;
  createdAt: string;
}

function mapProspect(row: Record<string, unknown>): Prospect {
  return {
    id: row.id as string,
    company: (row.company as string) ?? "",
    contact: (row.contact as string) ?? "",
    phone: (row.phone as string) ?? "",
    email: (row.email as string) ?? "",
    city: (row.city as string) ?? "",
    sector: (row.sector as string) ?? "",
    status: (row.status as string) ?? "Nouveau",
    notes: (row.notes as string) ?? "",
    quoteCount: Number(row.quote_count ?? 0),
    lastVisit: (row.last_visit as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export const fetchProspectsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("prospects")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapProspect);
});

const prospectInput = z.object({
  id: z.string().uuid().optional(),
  company: z.string().min(1).max(300),
  contact: z.string().max(300).default(""),
  phone: z.string().max(60).default(""),
  email: z.string().email().max(300).or(z.literal("")).default(""),
  city: z.string().max(120).default(""),
  sector: z.string().max(120).default(""),
  status: z.enum(["Nouveau", "Contacté", "Devis envoyé", "Négociation", "Client", "Perdu"]).default("Nouveau"),
  notes: z.string().max(2000).default(""),
});

export const saveProspectFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => prospectInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row = {
      company: data.company,
      contact: data.contact,
      phone: data.phone,
      email: data.email,
      city: data.city,
      sector: data.sector,
      status: data.status,
      notes: data.notes,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("prospects").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: ins, error } = await supabaseAdmin
      .from("prospects")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: ins.id as string };
  });

export const deleteProspectFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("prospects").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
