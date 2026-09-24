import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bike, Store, Tag, ShoppingBag, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { formatBRL, PAYMENT_METHODS } from "@/lib/format";
import { storeSettingsQuery, type Coupon } from "@/lib/queries";
import { useSession } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Finalizar pedido — Espetia" },
      { name: "description", content: "Revise seu pedido e escolha entrega e pagamento." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const { session } = useSession();
  const { data: settings } = useQuery(storeSettingsQuery);

  const [orderType, setOrderType] = useState<"delivery" | "pickup">("delivery");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [cep, setCep] = useState("");
  const [payment, setPayment] = useState("pix");
  const [changeFor, setChangeFor] = useState("");
  const [notes, setNotes] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [applying, setApplying] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Prefill from profile
  useEffect(() => {
    if (!session?.user.id) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setName((v) => v || data.full_name || "");
        setPhone((v) => v || data.phone || "");
        setStreet((v) => v || data.address_street || "");
        setNumber((v) => v || data.address_number || "");
        setComplement((v) => v || data.address_complement || "");
        setNeighborhood((v) => v || data.address_neighborhood || "");
        setCep((v) => v || data.address_cep || "");
      });
  }, [session?.user.id]);

  const deliveryFee = orderType === "delivery" ? Number(settings?.delivery_fee ?? 0) : 0;
  const discount = useMemo(() => {
    if (!coupon) return 0;
    if (coupon.discount_type === "percent")
      return Math.min(cart.subtotal, (cart.subtotal * Number(coupon.discount_value)) / 100);
    return Math.min(cart.subtotal, Number(coupon.discount_value));
  }, [coupon, cart.subtotal]);
  const total = Math.max(0, cart.subtotal - discount) + deliveryFee;

  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setApplying(true);
    const { data } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code)
      .eq("active", true)
      .maybeSingle();
    setApplying(false);
    const found = data as Coupon | null;
    if (!found || (found.expires_at && new Date(found.expires_at) < new Date())) {
      toast.error("Cupom inválido ou expirado");
      return;
    }
    if (cart.subtotal < Number(found.min_order)) {
      toast.error(`Este cupom vale para pedidos a partir de ${formatBRL(Number(found.min_order))}`);
      return;
    }
    setCoupon(found);
    toast.success(`Cupom ${found.code} aplicado!`);
  }

  async function submit() {
    if (cart.items.length === 0) return;
    if (!name.trim() || !phone.trim()) {
      toast.error("Preencha seu nome e telefone");
      return;
    }
    if (orderType === "delivery" && (!street.trim() || !number.trim() || !neighborhood.trim())) {
      toast.error("Preencha o endereço de entrega");
      return;
    }
    if (payment === "dinheiro" && changeFor && Number(changeFor) < total) {
      toast.error("O valor do troco deve ser maior que o total");
      return;
    }
    setSubmitting(true);
    try {
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: session?.user.id ?? null,
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          order_type: orderType,
          address_street: orderType === "delivery" ? street.trim() : null,
          address_number: orderType === "delivery" ? number.trim() : null,
          address_complement: orderType === "delivery" ? complement.trim() || null : null,
          address_neighborhood: orderType === "delivery" ? neighborhood.trim() : null,
          address_cep: orderType === "delivery" ? cep.trim() || null : null,
          payment_method: payment,
          change_for: payment === "dinheiro" && changeFor ? Number(changeFor) : null,
          notes: notes.trim() || null,
          subtotal: cart.subtotal,
          delivery_fee: deliveryFee,
          discount,
          total,
          coupon_code: coupon?.code ?? null,
        })
        .select("id")
        .single();
      if (error || !order) throw error ?? new Error("Falha ao criar pedido");

      const { error: itemsError } = await supabase.from("order_items").insert(
        cart.items.map((item) => ({
          order_id: order.id,
          product_id: item.productId,
          product_name: item.name,
          unit_price: item.unitPrice,
          quantity: item.quantity,
          addons: item.addons.map((a) => ({ name: a.name, price: a.price })),
          notes: item.notes || null,
        })),
      );
      if (itemsError) throw itemsError;

      // Save profile for next time (best effort)
      if (session?.user.id) {
        await supabase.from("profiles").upsert({
          id: session.user.id,
          full_name: name.trim(),
          phone: phone.trim(),
          address_street: street.trim() || null,
          address_number: number.trim() || null,
          address_complement: complement.trim() || null,
          address_neighborhood: neighborhood.trim() || null,
          address_cep: cep.trim() || null,
        });
      }

      cart.clear();
      navigate({ to: "/pedido/$id", params: { id: order.id } });
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível enviar seu pedido. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <ShoppingBag className="size-14 text-muted-foreground/40" />
        <h1 className="font-display text-2xl font-bold">Seu carrinho está vazio</h1>
        <p className="text-muted-foreground">Monte seu pedido no cardápio antes de finalizar.</p>
        <Button asChild>
          <Link to="/cardapio">Ir ao cardápio</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold">Finalizar pedido</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          {/* Entrega ou retirada */}
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display text-lg font-semibold">Entrega ou retirada?</h2>
            <RadioGroup
              value={orderType}
              onValueChange={(v) => setOrderType(v as "delivery" | "pickup")}
              className="mt-4 grid grid-cols-2 gap-3"
            >
              <Label
                htmlFor="type-delivery"
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${orderType === "delivery" ? "border-primary bg-primary/10" : "border-border"}`}
              >
                <RadioGroupItem value="delivery" id="type-delivery" />
                <Bike className="size-5 text-primary" />
                <span className="text-sm font-medium">
                  Entrega
                  <span className="block text-xs text-muted-foreground">
                    Taxa {formatBRL(Number(settings?.delivery_fee ?? 0))}
                  </span>
                </span>
              </Label>
              <Label
                htmlFor="type-pickup"
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${orderType === "pickup" ? "border-primary bg-primary/10" : "border-border"}`}
              >
                <RadioGroupItem value="pickup" id="type-pickup" />
                <Store className="size-5 text-primary" />
                <span className="text-sm font-medium">
                  Retirada
                  <span className="block text-xs text-muted-foreground">Sem taxa</span>
                </span>
              </Label>
            </RadioGroup>
          </section>

          {/* Dados */}
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display text-lg font-semibold">Seus dados</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ck-name">Nome*</Label>
                <Input id="ck-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ck-phone">Telefone / WhatsApp*</Label>
                <Input id="ck-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
              </div>
            </div>

            {orderType === "delivery" && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="ck-street">Rua*</Label>
                  <Input id="ck-street" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Nome da rua" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ck-number">Número*</Label>
                  <Input id="ck-number" value={number} onChange={(e) => setNumber(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ck-complement">Complemento</Label>
                  <Input id="ck-complement" value={complement} onChange={(e) => setComplement(e.target.value)} placeholder="Apto, bloco..." />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ck-neighborhood">Bairro*</Label>
                  <Input id="ck-neighborhood" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ck-cep">CEP</Label>
                  <Input id="ck-cep" value={cep} onChange={(e) => setCep(e.target.value)} placeholder="00000-000" />
                </div>
              </div>
            )}

            <div className="mt-4 space-y-1.5">
              <Label htmlFor="ck-notes">Observações do pedido</Label>
              <Textarea id="ck-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={300} placeholder="Ex.: campainha não funciona, troco, ponto da carne..." />
            </div>
          </section>

          {/* Pagamento */}
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display text-lg font-semibold">Pagamento</h2>
            <RadioGroup value={payment} onValueChange={setPayment} className="mt-4 space-y-2">
              {PAYMENT_METHODS.map((m) => (
                <Label
                  key={m.value}
                  htmlFor={`pay-${m.value}`}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${payment === m.value ? "border-primary bg-primary/10" : "border-border"}`}
                >
                  <RadioGroupItem value={m.value} id={`pay-${m.value}`} />
                  <span className="text-sm font-medium">{m.label}</span>
                </Label>
              ))}
            </RadioGroup>
            {payment === "dinheiro" && (
              <div className="mt-4 space-y-1.5">
                <Label htmlFor="ck-change">Troco para quanto? (opcional)</Label>
                <Input
                  id="ck-change"
                  type="number"
                  min={total}
                  step="0.01"
                  value={changeFor}
                  onChange={(e) => setChangeFor(e.target.value)}
                  placeholder={`Ex.: ${(Math.ceil(total / 10) * 10).toFixed(2)}`}
                />
              </div>
            )}
          </section>
        </div>

        {/* Resumo */}
        <aside className="h-fit rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-semibold">Resumo</h2>
          <ul className="mt-4 space-y-3">
            {cart.items.map((item) => (
              <li key={item.key} className="flex justify-between gap-3 text-sm">
                <span className="text-muted-foreground">
                  {item.quantity}× {item.name}
                  {item.addons.length > 0 && (
                    <span className="block text-xs">+ {item.addons.map((a) => a.name).join(", ")}</span>
                  )}
                </span>
                <span className="font-medium">
                  {formatBRL((item.unitPrice + item.addons.reduce((s, a) => s + a.price, 0)) * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <Separator className="my-4" />

          {/* Cupom */}
          <div className="flex gap-2">
            <Input
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              placeholder="Cupom de desconto"
              aria-label="Cupom de desconto"
              className="uppercase"
            />
            <Button variant="secondary" onClick={applyCoupon} disabled={applying}>
              {applying ? <Loader2 className="size-4 animate-spin" /> : <Tag className="size-4" />}
              Aplicar
            </Button>
          </div>
          {coupon && (
            <p className="mt-2 flex items-center justify-between text-sm text-success">
              <span>Cupom {coupon.code} aplicado</span>
              <button className="text-muted-foreground underline" onClick={() => setCoupon(null)}>
                remover
              </button>
            </p>
          )}

          <Separator className="my-4" />

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatBRL(cart.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Taxa de entrega</dt>
              <dd>{deliveryFee === 0 ? "Grátis" : formatBRL(deliveryFee)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-success">
                <dt>Desconto</dt>
                <dd>− {formatBRL(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between pt-2 font-display text-lg font-bold">
              <dt>Total</dt>
              <dd className="text-primary">{formatBRL(total)}</dd>
            </div>
          </dl>

          <Button size="lg" className="mt-5 w-full" onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Confirmar pedido
          </Button>
          {!session && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              <Link to="/auth" className="text-primary underline">Entre</Link> para acompanhar seus pedidos.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
