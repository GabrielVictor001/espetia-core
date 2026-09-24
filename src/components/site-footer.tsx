import { useQuery } from "@tanstack/react-query";
import { Clock, MapPin, MessageCircle, Flame } from "lucide-react";
import { storeSettingsQuery } from "@/lib/queries";

export function SiteFooter() {
  const { data: settings } = useQuery(storeSettingsQuery);

  return (
    <footer className="mt-16 border-t border-border/60 bg-card/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Flame className="size-4" />
            </span>
            <span className="font-display text-lg font-bold">
              {settings?.store_name ?? "Espetia"}
            </span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Espetos na brasa, feitos na hora e entregues quentinhos na sua casa.
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <p className="flex items-start gap-2 text-muted-foreground">
            <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
            {settings?.opening_hours ?? "Ter a Dom, 18h às 23h30"}
          </p>
          <p className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
            {settings?.address ?? ""}
          </p>
        </div>
        <div>
          <a
            href={`https://wa.me/${settings?.whatsapp ?? "5511999999999"}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2.5 text-sm font-semibold text-success-foreground transition-opacity hover:opacity-90"
          >
            <MessageCircle className="size-4" />
            Falar no WhatsApp
          </a>
          <p className="mt-2 text-xs text-muted-foreground">{settings?.phone_display}</p>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {settings?.store_name ?? "Espetia"} — Espetaria na brasa
      </div>
    </footer>
  );
}
