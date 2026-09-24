import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Category = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  active: boolean;
};

export type Addon = {
  id: string;
  product_id: string;
  name: string;
  price: number;
  active: boolean;
};

export type Product = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  active: boolean;
  featured: boolean;
  sort_order: number;
  addons?: Addon[];
};

export type StoreSettings = {
  id: number;
  store_name: string;
  whatsapp: string;
  phone_display: string;
  address: string;
  opening_hours: string;
  delivery_fee: number;
  min_order: number;
  is_open: boolean;
};

export type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order: number;
  active: boolean;
  expires_at: string | null;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  addons: { name: string; price: number }[];
  notes: string | null;
};

export type Order = {
  id: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  order_type: "delivery" | "pickup";
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_cep: string | null;
  payment_method: string;
  change_for: number | null;
  notes: string | null;
  status: string;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  coupon_code: string | null;
  created_at: string;
  order_items?: OrderItem[];
};

export const storeSettingsQuery = queryOptions({
  queryKey: ["store-settings"],
  queryFn: async (): Promise<StoreSettings> => {
    const { data, error } = await supabase.from("store_settings").select("*").eq("id", 1).single();
    if (error) throw error;
    return data as StoreSettings;
  },
  staleTime: 60_000,
});

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Category[];
  },
  staleTime: 60_000,
});

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .select("*, addons(*)")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Product[];
  },
  staleTime: 30_000,
});

export const activeCouponsQuery = queryOptions({
  queryKey: ["coupons", "active"],
  queryFn: async (): Promise<Coupon[]> => {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Coupon[];
  },
  staleTime: 60_000,
});

export function orderQuery(id: string) {
  return queryOptions({
    queryKey: ["order", id],
    queryFn: async (): Promise<Order | null> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data as Order | null) ?? null;
    },
    refetchInterval: 15_000,
  });
}
