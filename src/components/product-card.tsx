import { Plus } from "lucide-react";
import type { Product } from "@/lib/queries";
import { formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ProductCard({
  product,
  onSelect,
}: {
  product: Product;
  onSelect: (product: Product) => void;
}) {
  return (
    <article className="card-hover group flex gap-4 rounded-2xl border border-border bg-card p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <h3 className="font-display text-base font-semibold leading-tight text-balance">
            {product.name}
          </h3>
          {product.featured && (
            <Badge className="shrink-0 bg-gold text-gold-foreground hover:bg-gold">
              Destaque
            </Badge>
          )}
        </div>
        {product.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="font-display text-lg font-bold text-primary">
            {formatBRL(Number(product.price))}
          </span>
          <Button size="sm" variant="secondary" onClick={() => onSelect(product)}>
            <Plus className="size-4" /> Adicionar
          </Button>
        </div>
      </div>
      {product.image_url && (
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          width={112}
          height={112}
          className="size-24 shrink-0 rounded-xl object-cover sm:size-28"
        />
      )}
    </article>
  );
}
