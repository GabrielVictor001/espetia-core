import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Bike, Clock, Flame, MapPin, Star } from "lucide-react";
import { useState } from "react";
import { categoriesQuery, productsQuery, storeSettingsQuery, type Product } from "@/lib/queries";
import { ProductCard } from "@/components/product-card";
import { ProductDialog } from "@/components/product-dialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(categoriesQuery),
      context.queryClient.ensureQueryData(productsQuery),
      context.queryClient.ensureQueryData(storeSettingsQuery),
    ]),
  head: () => ({
    meta: [
      { title: "Espetia — Espetos na brasa com delivery" },
      {
        name: "description",
        content:
          "Espetos de carne, frango, linguiça e queijo coalho grelhados na hora. Combos, acompanhamentos e bebidas com entrega rápida.",
      },
      { property: "og:title", content: "Espetia — Espetos na brasa com delivery" },
      {
        property: "og:description",
        content: "Espetos grelhados na hora com entrega rápida. Peça agora!",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const { data: products } = useSuspenseQuery(productsQuery);
  const { data: settings } = useSuspenseQuery(storeSettingsQuery);
  const [selected, setSelected] = useState<Product | null>(null);

  const featured = products.filter((p) => p.active && p.featured).slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <img
          src="/images/hero-espetos.jpg"
          alt="Espetos grelhando na brasa"
          width={1920}
          height={1088}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-24 sm:py-36">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-4 py-1.5 text-sm font-semibold text-primary">
            <Flame className="size-4 animate-flame" />
            {settings.is_open ? "Aberto agora — na brasa!" : "Abre em breve hoje"}
          </span>
          <h1 className="max-w-2xl font-display text-4xl font-extrabold leading-tight text-balance sm:text-6xl">
            Espetos na brasa, direto pra sua casa
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Carne, frango, linguiça e queijo coalho grelhados na hora, com aquele
            gostinho de churrasco de verdade.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="text-base">
              <Link to="/cardapio">
                Pedir agora <ArrowRight className="size-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="text-base">
              <a href="#destaques">Ver destaques</a>
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="size-4 text-primary" /> {settings.opening_hours}
            </span>
            <span className="flex items-center gap-1.5">
              <Bike className="size-4 text-primary" /> Entrega ou retirada
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="size-4 text-gold" /> Feito na brasa, na hora
            </span>
          </div>
        </div>
      </section>

      {/* Categorias */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="font-display text-2xl font-bold">Categorias</h2>
        <div className="mt-5 flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to="/cardapio"
              search={{ categoria: cat.slug }}
              className="shrink-0 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium transition-colors hover:border-primary/60 hover:text-primary"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Destaques */}
      <section id="destaques" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-12">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold">Destaques da casa</h2>
          <Link
            to="/cardapio"
            className="text-sm font-medium text-primary hover:underline"
          >
            Ver cardápio completo
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} onSelect={setSelected} />
          ))}
        </div>
      </section>

      {/* Info */}
      <section className="border-t border-border/60 bg-card/40">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:grid-cols-3">
          <div className="flex gap-3">
            <Clock className="size-6 shrink-0 text-primary" />
            <div>
              <h3 className="font-semibold">Horário de funcionamento</h3>
              <p className="mt-1 text-sm text-muted-foreground">{settings.opening_hours}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <MapPin className="size-6 shrink-0 text-primary" />
            <div>
              <h3 className="font-semibold">Onde estamos</h3>
              <p className="mt-1 text-sm text-muted-foreground">{settings.address}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Bike className="size-6 shrink-0 text-primary" />
            <div>
              <h3 className="font-semibold">Entrega</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Taxa de entrega a partir de R$ {Number(settings.delivery_fee).toFixed(2).replace(".", ",")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <ProductDialog
        product={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
      />
    </div>
  );
}
