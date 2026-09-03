import type { Metadata } from "next";
import PetMiniatureCart from "@/components/store/PetMiniatureCart";

export const metadata: Metadata = {
  title: "Carrinho de miniaturas",
  robots: { index: false },
};

export default function MiniaturaPetCarrinhoPage() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-12 sm:px-10 md:py-16">
      <h1 className="mb-2 font-heading text-3xl font-extrabold text-charcoal">
        Carrinho de miniaturas
      </h1>
      <p className="mb-8 font-sans text-sm text-charcoal/60">
        Junte as miniaturas dos seus pets num pedido só — cada par ganha desconto.
      </p>
      <PetMiniatureCart />
    </section>
  );
}
