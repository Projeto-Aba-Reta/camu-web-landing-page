import type { Metadata } from "next";
import CartView from "@/components/store/CartView";

export const metadata: Metadata = {
  title: "Carrinho",
  description: "Seus itens Camu3d prontos pra finalizar.",
};

export default function CarrinhoPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12 sm:px-10 md:py-16">
      <CartView />
    </section>
  );
}
