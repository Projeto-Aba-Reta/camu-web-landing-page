import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderByCode, reconcileOrderPayment } from "@/lib/store";
import { getPetMiniatureRequestsByOrderId } from "@/lib/pet-miniature";
import PetMiniatureExpressUpload from "@/components/store/PetMiniatureExpressUpload";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Enviar as fotos do seu pet",
  robots: { index: false, follow: false },
};

const variantLabel = (v: string | null) =>
  v === "com_pintura" ? "Com pintura" : v === "sem_pintura" ? "Sem pintura" : "Miniatura";

type Params = { code: string };

export default async function EnviarFotosPage({ params }: { params: Promise<Params> }) {
  const { code } = await params;

  // Cobre o caso do cliente abrir o link antes do webhook de pagamento chegar.
  await reconcileOrderPayment(code);

  const data = await getOrderByCode(code);
  if (!data) notFound();

  const requests = await getPetMiniatureRequestsByOrderId(data.order.id);
  if (requests.length === 0) notFound();

  const paid = data.order.payment_status === "approved";
  const pets = requests.map((r, index) => ({
    index,
    variantLabel: variantLabel(r.selected_variant),
    hasPhotos: r.photo_paths.length > 0,
  }));

  return (
    <section className="mx-auto max-w-2xl px-6 py-12 sm:px-10 md:py-16">
      <h1 className="mb-2 font-heading text-3xl font-extrabold text-charcoal">
        Fotos do seu pet
      </h1>
      <p className="mb-8 font-sans text-sm text-charcoal/60">
        Pedido <strong>#{data.order.order_code}</strong>. Envie de 3 a 4 fotos de cada pet — de
        ângulos diferentes, com boa luz e o rosto bem visível.
      </p>

      {!paid && (
        <div className="mb-6 rounded-2xl border-[3px] border-charcoal bg-coral/15 px-5 py-4 font-sans text-sm text-charcoal/75">
          Ainda não confirmamos o pagamento deste pedido. Você já pode enviar as fotos — a produção
          começa assim que o pagamento cair.
        </div>
      )}

      <PetMiniatureExpressUpload orderCode={data.order.order_code} pets={pets} />

      <div className="mt-10">
        <Link
          href={`/pedido/${data.order.order_code}`}
          className="font-heading text-sm font-bold text-teal-dark underline underline-offset-4"
        >
          Acompanhar o pedido →
        </Link>
      </div>
    </section>
  );
}
