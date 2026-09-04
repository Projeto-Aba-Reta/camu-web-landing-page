import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPetMiniaturePricing } from "@/lib/store";
import { isValidEmail } from "@/lib/contact";
import PetMiniatureExpressStep2Form from "@/components/store/PetMiniatureExpressStep2Form";

export const dynamic = "force-dynamic";

// Página acessada só por URL — fora do menu e não indexável.
export const metadata: Metadata = {
  title: "Miniatura do seu pet — entrega e pagamento",
  robots: { index: false, follow: false },
};

type SearchParams = { quantidade?: string; email?: string };

export default async function MiniaturaPetExpressaEntregaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { quantidade, email: rawEmail } = await searchParams;
  const quantity = Math.floor(Number(quantidade));
  const email = (rawEmail ?? "").trim();

  if (!Number.isFinite(quantity) || quantity < 1 || !isValidEmail(email)) {
    redirect("/miniatura-pet/expressa");
  }

  const pricing = await getPetMiniaturePricing();

  return (
    <section className="mx-auto max-w-5xl px-6 py-12 sm:px-10 md:py-16">
      <div className="mb-8 max-w-2xl">
        <div
          className="mb-4 inline-block rounded-full border-2 border-charcoal bg-teal px-3.5 py-1.5 font-sans text-xs font-bold text-charcoal"
          style={{ transform: "rotate(-2deg)" }}
        >
          pedido expresso · passo 2 de 2
        </div>
        <h1 className="mb-3 font-heading text-3xl font-extrabold leading-tight text-charcoal sm:text-4xl">
          Endereço de entrega e pagamento
        </h1>
        <p className="font-sans text-[15px] leading-relaxed text-charcoal/70">
          Confirma o endereço e finaliza — as fotos você manda depois, por e-mail.
        </p>
      </div>

      <PetMiniatureExpressStep2Form
        quantity={quantity}
        email={email}
        comPinturaCents={pricing.comPinturaCents}
      />
    </section>
  );
}
