import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { Category } from "@/data/catalog";
import {
  fetchCatalog,
  saveProductFn,
  deleteProductFn,
  setArchivedFn,
  saveSupplierFn,
  deleteSupplierFn,
  type AdminProduct,
  type Supplier,
} from "@/lib/catalog.functions";

export type { AdminProduct, Supplier };

export const catalogQueryKey = ["catalog"] as const;

export const catalogQueryOptions = {
  queryKey: catalogQueryKey,
  queryFn: () => fetchCatalog(),
  staleTime: 30_000,
};

export function stockLabel(stock: number): { label: string; tone: "ok" | "low" | "out" } {
  if (stock <= 0) return { label: "Rupture de stock", tone: "out" };
  if (stock <= 10) return { label: `Stock faible (${stock})`, tone: "low" };
  return { label: `En stock (${stock})`, tone: "ok" };
}

export function useCatalog() {
  const fetchFn = useServerFn(fetchCatalog);
  const { data, isLoading } = useQuery({
    queryKey: catalogQueryKey,
    queryFn: () => fetchFn(),
    staleTime: 30_000,
  });
  return {
    categories: (data?.categories ?? []) as Category[],
    products: (data?.products ?? []) as AdminProduct[],
    suppliers: (data?.suppliers ?? []) as Supplier[],
    isLoading,
  };
}

export function useProducts({ includeArchived = false } = {}) {
  const { categories, products, suppliers, isLoading } = useCatalog();
  const qc = useQueryClient();
  const save = useServerFn(saveProductFn);
  const del = useServerFn(deleteProductFn);
  const archive = useServerFn(setArchivedFn);

  const invalidate = useCallback(() => qc.invalidateQueries({ queryKey: catalogQueryKey }), [qc]);

  const saveProduct = useCallback(
    async (product: AdminProduct) => {
      await save({ data: product });
      await invalidate();
    },
    [save, invalidate],
  );

  const remove = useCallback(
    async (id: string) => {
      await del({ data: { id } });
      await invalidate();
    },
    [del, invalidate],
  );

  const setArchived = useCallback(
    async (id: string, archived: boolean) => {
      await archive({ data: { id, archived } });
      await invalidate();
    },
    [archive, invalidate],
  );

  const visible = includeArchived ? products : products.filter((p) => !p.archived);
  return { products: visible, all: products, categories, suppliers, isLoading, save: saveProduct, remove, setArchived };
}

export function useSuppliers() {
  const { suppliers, isLoading } = useCatalog();
  const qc = useQueryClient();
  const save = useServerFn(saveSupplierFn);
  const del = useServerFn(deleteSupplierFn);
  const invalidate = useCallback(() => qc.invalidateQueries({ queryKey: catalogQueryKey }), [qc]);
  const saveSupplier = useCallback(
    async (s: Omit<Supplier, "id"> & { id?: string }) => {
      await save({ data: s });
      await invalidate();
    },
    [save, invalidate],
  );
  const remove = useCallback(
    async (id: string) => {
      await del({ data: { id } });
      await invalidate();
    },
    [del, invalidate],
  );
  return { suppliers, isLoading, save: saveSupplier, remove };
}
