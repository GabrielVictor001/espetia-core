import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartAddon = { id: string; name: string; price: number };

export type CartItem = {
  key: string;
  productId: string;
  name: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  addons: CartAddon[];
  notes: string;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "key">) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  subtotal: number;
  count: number;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "espetia-cart-v1";

function itemKey(item: Omit<CartItem, "key">): string {
  const addons = item.addons
    .map((a) => a.id)
    .sort()
    .join(",");
  return `${item.productId}|${addons}|${item.notes.trim().toLowerCase()}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce(
      (sum, i) =>
        sum + (i.unitPrice + i.addons.reduce((s, a) => s + a.price, 0)) * i.quantity,
      0,
    );
    return {
      items,
      subtotal,
      count: items.reduce((s, i) => s + i.quantity, 0),
      open,
      setOpen,
      addItem: (item) => {
        const key = itemKey(item);
        setItems((prev) => {
          const existing = prev.find((i) => i.key === key);
          if (existing) {
            return prev.map((i) =>
              i.key === key ? { ...i, quantity: i.quantity + item.quantity } : i,
            );
          }
          return [...prev, { ...item, key }];
        });
        setOpen(true);
      },
      updateQuantity: (key, quantity) => {
        setItems((prev) =>
          quantity <= 0
            ? prev.filter((i) => i.key !== key)
            : prev.map((i) => (i.key === key ? { ...i, quantity } : i)),
        );
      },
      removeItem: (key) => setItems((prev) => prev.filter((i) => i.key !== key)),
      clear: () => setItems([]),
    };
  }, [items, open]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
