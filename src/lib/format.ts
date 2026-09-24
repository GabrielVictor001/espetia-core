const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatBRL(value: number): string {
  return brl.format(value);
}

export const ORDER_STATUS = [
  "recebido",
  "preparando",
  "saiu_entrega",
  "entregue",
  "cancelado",
] as const;

export type OrderStatus = (typeof ORDER_STATUS)[number];

export const ORDER_STATUS_LABEL: Record<string, string> = {
  recebido: "Recebido",
  preparando: "Preparando",
  saiu_entrega: "Saiu para entrega",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export const PAYMENT_METHODS = [
  { value: "pix", label: "Pix" },
  { value: "cartao", label: "Cartão na entrega" },
  { value: "dinheiro", label: "Dinheiro" },
] as const;

export const PAYMENT_LABEL: Record<string, string> = {
  pix: "Pix",
  cartao: "Cartão",
  dinheiro: "Dinheiro",
};
