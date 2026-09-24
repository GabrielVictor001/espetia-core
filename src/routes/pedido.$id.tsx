import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { orderQuery } from "@/lib/queries";
import { formatBRL, PAYMENT_LABEL, ORDER_STATUS_LABEL } from "@/lib/format";
import { OrderTimeline } from "@/components/order-timeline";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/pedido/$id")({
  head: () => ({
    meta: [
      { title: "Acompanhar pedido — Espetia" },
      { name: "description", content: "Acompanhe o status do seu pedido em tempo real." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderTrackingPage,
});

function OrderTrackingPage() {
  const { id } = Route.useParams();
  const { data: order, isLoading, isError } = useQuery(orderQuery(id));

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-16">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Pedido não encontrado</h1>
        <p className="mt-2 text-muted-foreground">
          Confira o link do pedido ou entre na sua conta para ver seus pedidos.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Voltar ao início</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="size-9 text-success" />
        <div>
          <h1 className="font-display text-2xl font-bold">Pedido confirmado!</h1>
          <p className="text-sm text-muted-foreground">
            Pedido #{order.id.slice(0, 8).toUpperCase()} ·{" "}
            {new Date(order.created_at).toLocaleString("pt-BR")}
          </p>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-6 font-display text-lg font-semibold">
          Status: {ORDER_STATUS_LABEL[order.status] ?? order.status}
        </h2>
        <OrderTimeline status={order.status} />
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold">Resumo do pedido</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {(order.order_items ?? []).map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span className="text-muted-foreground">
                {item.quantity}× {item.product_name}
                {Array.isArray(item.addons) && item.addons.length > 0 && (
                  <span className="block text-xs">
                    + {item.addons.map((a) => a.name).join(", ")}
                  </span>
                )}
                {item.notes && <span className="block text-xs italic">“{item.notes}”</span>}
              </span>
              <span className="font-medium">
                {formatBRL(
                  (Number(item.unit_price) +
                    (Array.isArray(item.addons)
                      ? item.addons.reduce((s, a) => s + Number(a.price), 0)
                      : 0)) *
                    item.quantity,
                )}
              </span>
            </li>
          ))}
        </ul>
        <Separator className="my-4" />
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{formatBRL(Number(order.subtotal))}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Taxa de entrega</dt>
            <dd>{Number(order.delivery_fee) === 0 ? "Grátis" : formatBRL(Number(order.delivery_fee))}</dd>
          </div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between text-success">
              <dt>Desconto{order.coupon_code ? ` (${order.coupon_code})` : ""}</dt>
              <dd>− {formatBRL(Number(order.discount))}</dd>
            </div>
          )}
          <div className="flex justify-between pt-1 font-display text-lg font-bold">
            <dt>Total</dt>
            <dd className="text-primary">{formatBRL(Number(order.total))}</dd>
          </div>
        </dl>
        <Separator className="my-4" />
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">{order.customer_name}</span> · {order.customer_phone}
          </p>
          <p>
            {order.order_type === "delivery"
              ? `Entrega: ${order.address_street}, ${order.address_number}${order.address_complement ? ` - ${order.address_complement}` : ""}, ${order.address_neighborhood}`
              : "Retirada na loja"}
          </p>
          <p>
            Pagamento: {PAYMENT_LABEL[order.payment_method] ?? order.payment_method}
            {order.change_for ? ` (troco para ${formatBRL(Number(order.change_for))})` : ""}
          </p>
        </div>
      </section>

      <div className="mt-6 flex justify-center">
        <Button asChild variant="secondary">
          <Link to="/cardapio">Fazer outro pedido</Link>
        </Button>
      </div>
    </div>
  );
}
