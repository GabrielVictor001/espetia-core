import { useMemo, useState } from "react";
import { Minus, Plus, Flame } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/queries";
import { useCart, type CartAddon } from "@/lib/cart";
import { formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function ProductDialog({
  product,
  open,
  onOpenChange,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const cart = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<Record<string, CartAddon>>({});
  const [notes, setNotes] = useState("");

  const addons = useMemo(
    () => (product?.addons ?? []).filter((a) => a.active),
    [product],
  );

  function reset() {
    setQuantity(1);
    setSelected({});
    setNotes("");
  }

  if (!product) return null;

  const addonsTotal = Object.values(selected).reduce((s, a) => s + a.price, 0);
  const total = (product.price + addonsTotal) * quantity;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {product.image_url && (
          <div className="-mx-6 -mt-6">
            <img
              src={product.image_url}
              alt={product.name}
              className="h-52 w-full rounded-t-lg object-cover"
            />
          </div>
        )}
        <DialogHeader className="text-left">
          <DialogTitle className="font-display text-xl">{product.name}</DialogTitle>
          <DialogDescription>{product.description}</DialogDescription>
        </DialogHeader>

        {addons.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold">Adicionais</p>
            <ul className="space-y-2">
              {addons.map((addon) => (
                <li key={addon.id}>
                  <Label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-secondary/50">
                    <span className="flex items-center gap-3">
                      <Checkbox
                        checked={!!selected[addon.id]}
                        onCheckedChange={(checked) =>
                          setSelected((prev) => {
                            const next = { ...prev };
                            if (checked)
                              next[addon.id] = {
                                id: addon.id,
                                name: addon.name,
                                price: Number(addon.price),
                              };
                            else delete next[addon.id];
                            return next;
                          })
                        }
                      />
                      <span className="text-sm">{addon.name}</span>
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {Number(addon.price) > 0 ? `+ ${formatBRL(Number(addon.price))}` : "Grátis"}
                    </span>
                  </Label>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="item-notes" className="text-sm font-semibold">
            Observações
          </Label>
          <Textarea
            id="item-notes"
            placeholder="Ex.: ponto da carne, sem cebola..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            maxLength={200}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 rounded-lg border border-border px-2 py-2">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Diminuir quantidade"
              className="text-muted-foreground hover:text-foreground"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-6 text-center font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="Aumentar quantidade"
              className="text-muted-foreground hover:text-foreground"
            >
              <Plus className="size-4" />
            </button>
          </div>
          <Button
            size="lg"
            className="flex-1"
            onClick={() => {
              cart.addItem({
                productId: product.id,
                name: product.name,
                imageUrl: product.image_url,
                unitPrice: Number(product.price),
                quantity,
                addons: Object.values(selected),
                notes,
              });
              toast.success(`${product.name} adicionado ao pedido`, { icon: <Flame className="size-4" /> });
              onOpenChange(false);
              reset();
            }}
          >
            Adicionar · {formatBRL(total)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
