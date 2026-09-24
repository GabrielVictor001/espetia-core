import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

export function CartSheet() {
  const cart = useCart();

  return (
    <Sheet open={cart.open} onOpenChange={cart.setOpen}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="size-5 text-primary" /> Seu pedido
          </SheetTitle>
        </SheetHeader>

        {cart.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <ShoppingBag className="size-12 text-muted-foreground/40" />
            <p className="font-medium">Seu carrinho está vazio</p>
            <p className="text-sm text-muted-foreground">
              Que tal um espeto quentinho saindo da brasa?
            </p>
            <Button asChild onClick={() => cart.setOpen(false)}>
              <Link to="/cardapio">Ver cardápio</Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <ul className="space-y-4 py-2">
                {cart.items.map((item) => {
                  const unit = item.unitPrice + item.addons.reduce((s, a) => s + a.price, 0);
                  return (
                    <li key={item.key} className="flex gap-3">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          loading="lazy"
                          className="size-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold leading-tight">{item.name}</p>
                          <button
                            onClick={() => cart.removeItem(item.key)}
                            className="text-muted-foreground transition-colors hover:text-destructive"
                            aria-label={`Remover ${item.name}`}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                        {item.addons.length > 0 && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            + {item.addons.map((a) => a.name).join(", ")}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-xs italic text-muted-foreground">“{item.notes}”</p>
                        )}
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2 rounded-lg border border-border px-1.5 py-1">
                            <button
                              onClick={() => cart.updateQuantity(item.key, item.quantity - 1)}
                              aria-label="Diminuir quantidade"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Minus className="size-3.5" />
                            </button>
                            <span className="w-5 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => cart.updateQuantity(item.key, item.quantity + 1)}
                              aria-label="Aumentar quantidade"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Plus className="size-3.5" />
                            </button>
                          </div>
                          <span className="text-sm font-semibold text-primary">
                            {formatBRL(unit * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>

            <SheetFooter className="gap-3">
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="font-display text-lg font-bold">{formatBRL(cart.subtotal)}</span>
              </div>
              <Button asChild size="lg" className="w-full">
                <Link to="/checkout" onClick={() => cart.setOpen(false)}>
                  Finalizar pedido
                </Link>
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
