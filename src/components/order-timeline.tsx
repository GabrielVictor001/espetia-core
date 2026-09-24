import { CheckCircle2, ChefHat, ClipboardList, Bike, PackageCheck, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ORDER_STATUS_LABEL } from "@/lib/format";

const STEPS = [
  { key: "recebido", icon: ClipboardList },
  { key: "preparando", icon: ChefHat },
  { key: "saiu_entrega", icon: Bike },
  { key: "entregue", icon: PackageCheck },
] as const;

export function OrderTimeline({ status }: { status: string }) {
  if (status === "cancelado") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-destructive">
        <XCircle className="size-5" />
        <span className="font-semibold">Pedido cancelado</span>
      </div>
    );
  }
  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <ol className="flex items-center">
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        const Icon = done ? CheckCircle2 : step.icon;
        return (
          <li key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-full border-2 transition-colors",
                  done && "border-success bg-success text-success-foreground",
                  current && "animate-flame border-primary bg-primary text-primary-foreground",
                  !done && !current && "border-border bg-secondary text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
              </span>
              <span
                className={cn(
                  "text-center text-[11px] font-medium leading-tight",
                  current ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {ORDER_STATUS_LABEL[step.key]}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-1 mb-5 h-0.5 flex-1 rounded",
                  i < currentIndex ? "bg-success" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
