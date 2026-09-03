import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProducts } from "@/lib/store";
import { STORE_ENABLED } from "@/lib/features";
import CatalogClient from "@/components/store/CatalogClient";

export const metadata: Metadata = {
  title: "Catálogo",
  description: "Peças prontas pra impressão 3D — escolha, adicione ao carrinho e finalize aqui mesmo.",
};

// Catálogo lê do banco a cada request (estoque/preço podem mudar).
export const dynamic = "force-dynamic";

export default async function LojaPage() {
  if (!STORE_ENABLED) notFound();

  const products = await getProducts();

  return (
    <section className="mx-auto max-w-6xl px-6 py-12 sm:px-10 md:py-16">
      <h1 className="mb-2 font-heading text-3xl font-bold text-charcoal sm:text-4xl">Catálogo</h1>
      <p className="mb-8 font-sans text-charcoal/65">
        Peças prontas pra impressão — escolha, adicione ao carrinho e finalize aqui mesmo.
      </p>
      <CatalogClient products={products} />
    </section>
  );
}
