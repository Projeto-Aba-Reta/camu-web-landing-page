import type { Metadata } from "next";
import CheckoutForm from "@/components/store/CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Finalize seu pedido Camu com Pix ou cartão via Mercado Pago.",
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const initialError =
    erro === "pagamento"
      ? "O pagamento não foi concluído. Você pode tentar de novo."
      : undefined;

  return (
    <section className="mx-auto max-w-6xl px-6 py-12 sm:px-10 md:py-16">
      <h1 className="mb-8 font-heading text-3xl font-bold text-charcoal">Finalizar pedido</h1>
      <CheckoutForm initialError={initialError} />
    </section>
  );
}
