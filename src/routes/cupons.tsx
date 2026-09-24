import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Copy, Tag } from "lucide-react";
import { toast } from "sonner";
import { activeCouponsQuery } from "@/lib/queries";
import { formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cupons")({
  loader: ({ context }) => context.queryClient.ensureQueryData(activeCouponsQuery),
  head: () => ({
    meta: [
      { title: "Cupons de desconto — Espetia" },
      { name: "description", content: "Aproveite os cupons de desconto ativos da Espetia." },
      { property: "og:title", content: "Cupons de desconto — Espetia" },
      { property: "og:description", content: "Aproveite os cupons de desconto ativos da Espetia." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: CouponsPage,
});

function CouponsPage() {
  const { data: coupons } = useSuspenseQuery(activeCouponsQuery);
  const valid = coupons.filter((c) => !c.expires_at || new Date(c.expires_at) > new Date());

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Cupons de desconto</h1>
      <p className="mt-1 text-muted-foreground">
        Use no checkout e economize no seu próximo espeto.
      </p>

      {valid.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <Tag className="size-12 text-muted-foreground/40" />
          <p className="font-medium">Nenhum cupom ativo no momento</p>
          <p className="text-sm text-muted-foreground">Volte em breve para novas promoções!</p>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {valid.map((coupon) => (
            <li
              key={coupon.id}
              className="card-hover flex items-center justify-between gap-4 rounded-2xl border border-dashed border-primary/50 bg-card p-5"
            >
              <div>
                <p className="font-display text-xl font-bold text-primary">{coupon.code}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {coupon.description ??
                    (coupon.discount_type === "percent"
                      ? `${Number(coupon.discount_value)}% de desconto`
                      : `${formatBRL(Number(coupon.discount_value))} de desconto`)}
                </p>
                {Number(coupon.min_order) > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Pedido mínimo: {formatBRL(Number(coupon.min_order))}
                  </p>
                )}
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(coupon.code);
                  toast.success("Cupom copiado!");
                }}
              >
                <Copy className="size-4" /> Copiar
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10 text-center">
        <Button asChild size="lg">
          <Link to="/cardapio">Pedir agora</Link>
        </Button>
      </div>
    </div>
  );
}
