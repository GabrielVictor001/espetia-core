import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Flame, Menu, ShoppingBag, User, LogOut, LayoutDashboard, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { storeSettingsQuery } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Session } from "@supabase/supabase-js";

const NAV = [
  { to: "/", label: "Início" },
  { to: "/cardapio", label: "Cardápio" },
  { to: "/cupons", label: "Cupons" },
  { to: "/pedidos", label: "Meus pedidos" },
] as const;

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  return { session, loading };
}

export function useIsAdmin(userId: string | undefined) {
  return useQuery({
    queryKey: ["is-admin", userId],
    enabled: !!userId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: userId!,
        _role: "admin",
      });
      if (error) return false;
      return !!data;
    },
  });
}

export function SiteHeader() {
  const cart = useCart();
  const { session } = useSession();
  const { data: settings } = useQuery(storeSettingsQuery);
  const { data: isAdmin } = useIsAdmin(session?.user.id);
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  const navLinks = (onClick?: () => void, className?: string) =>
    NAV.map((item) => (
      <Link
        key={item.to}
        to={item.to}
        onClick={onClick}
        className={cn(
          "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
          className,
        )}
        activeProps={{ className: "text-foreground" }}
        activeOptions={{ exact: item.to === "/" }}
      >
        {item.label}
      </Link>
    ));

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Flame className="size-5 animate-flame" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">
            {settings?.store_name ?? "Espetia"}
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">{navLinks()}</nav>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="relative"
            onClick={() => cart.setOpen(true)}
            aria-label="Abrir carrinho"
          >
            <ShoppingBag className="size-5" />
            {cart.count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                {cart.count}
              </span>
            )}
          </Button>

          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Conta">
                  <User className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate({ to: "/pedidos" })}>
                  <Package className="mr-2 size-4" /> Meus pedidos
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
                    <LayoutDashboard className="mr-2 size-4" /> Administração
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 size-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link to="/auth">Entrar</Link>
            </Button>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden" aria-label="Menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <nav className="mt-8 flex flex-col gap-4">
                {navLinks(() => setMobileOpen(false), "text-base")}
                {!session && (
                  <Link
                    to="/auth"
                    onClick={() => setMobileOpen(false)}
                    className="text-base font-medium text-primary"
                  >
                    Entrar / Criar conta
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
