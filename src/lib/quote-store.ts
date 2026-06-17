import { useEffect, useState, useCallback } from "react";

export interface QuoteItem {
  productId: string;
  productName: string;
  reference: string;
  quantity: number;
}

const KEY = "ils.quote.cart";

function read(): QuoteItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

function write(items: QuoteItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("ils:quote-updated"));
}

export function useQuoteCart() {
  const [items, setItems] = useState<QuoteItem[]>([]);

  useEffect(() => {
    setItems(read());
    const onUpdate = () => setItems(read());
    window.addEventListener("ils:quote-updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("ils:quote-updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const add = useCallback((item: Omit<QuoteItem, "quantity"> & { quantity?: number }) => {
    const current = read();
    const existing = current.find((i) => i.productId === item.productId);
    const qty = item.quantity ?? 1;
    const next = existing
      ? current.map((i) => (i.productId === item.productId ? { ...i, quantity: i.quantity + qty } : i))
      : [...current, { ...item, quantity: qty }];
    write(next);
  }, []);

  const update = useCallback((productId: string, quantity: number) => {
    write(read().map((i) => (i.productId === productId ? { ...i, quantity } : i)));
  }, []);

  const remove = useCallback((productId: string) => {
    write(read().filter((i) => i.productId !== productId));
  }, []);

  const clear = useCallback(() => write([]), []);

  return { items, add, update, remove, clear, count: items.reduce((s, i) => s + i.quantity, 0) };
}
