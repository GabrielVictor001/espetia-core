import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Search, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";
import { categoriesQuery, productsQuery, type Product } from "@/lib/queries";
import { ProductCard } from "@/components/product-card";
import { ProductDialog } from "@/components/product-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  categoria: z.string().optional(),
});

export const Route = createFileRoute("/cardapio")({
  validateSearch: (s) => searchSchema.parse(s),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(categoriesQuery),
      context.queryClient.ensureQueryData(productsQuery),
    ]),
  head: () => ({
    meta: [
      { title: "Cardápio — Espetia" },
      {
        name: "description",
        content:
          "Cardápio completo: espetos, combos, acompanhamentos, bebidas e sobremesas grelhados na brasa.",
      },
      { property: "og:title", content: "Cardápio — Espetia" },
      {
        property: "og:description",
        content: "Espetos, combos, acompanhamentos, bebidas e sobremesas na brasa.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: MenuPage,
});

type SortKey = "padrao" | "preco-asc" | "preco-desc" | "nome";

function MenuPage() {
  const { categoria } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const { data: products } = useSuspenseQuery(productsQuery);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("padrao");
  const [selected, setSelected] = useState<Product | null>(null);

  const activeSlug = categoria ?? "todos";

  const filtered = useMemo(() => {
    let list = products.filter((p) => p.active);
    if (activeSlug !== "todos") {
      const cat = categories.find((c) => c.slug === activeSlug);
      list = cat ? list.filter((p) => p.category_id === cat.id) : [];
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q),
      );
    }
    if (sort === "preco-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "preco-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "nome") list = [...list].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    return list;
  }, [products, categories, activeSlug, query, sort]);

  const grouped = useMemo(() => {
    return categories
      .map((cat) => ({
        category: cat,
        items: filtered.filter((p) => p.category_id === cat.id),
      }))
      .filter((g) => g.items.length > 0);
  }, [categories, filtered]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold">Cardápio</h1>
      <p className="mt-1 text-muted-foreground">Escolha seus favoritos direto da brasa.</p>

      {/* Busca + ordenação */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar no cardápio..."
            className="pl-9"
            aria-label="Buscar no cardápio"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="sm:w-52" aria-label="Ordenar">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="padrao">Ordenação padrão</SelectItem>
            <SelectItem value="preco-asc">Menor preço</SelectItem>
            <SelectItem value="preco-desc">Maior preço</SelectItem>
            <SelectItem value="nome">Nome (A–Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filtro de categorias */}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <button
          onClick={() => navigate({ search: {} })}
          className={cn(
            "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            activeSlug === "todos"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card hover:border-primary/60",
          )}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => navigate({ search: { categoria: cat.slug } })}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              activeSlug === cat.slug
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:border-primary/60",
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Lista */}
      {grouped.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <SearchX className="size-12 text-muted-foreground/40" />
          <p className="font-medium">Nada encontrado</p>
          <p className="text-sm text-muted-foreground">
            Tente outra busca ou categoria.
          </p>
        </div>
      ) : (
        grouped.map(({ category, items }) => (
          <section key={category.id} className="mt-10">
            <h2 className="font-display text-xl font-bold">{category.name}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {items.map((product) => (
                <ProductCard key={product.id} product={product} onSelect={setSelected} />
              ))}
            </div>
          </section>
        ))
      )}

      <ProductDialog
        product={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
      />
    </div>
  );
}
