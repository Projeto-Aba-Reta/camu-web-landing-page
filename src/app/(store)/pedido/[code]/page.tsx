import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrderByCode } from "@/lib/store";
import { getPetMiniatureRequestsByOrderId } from "@/lib/pet-miniature";
import { statusLabel, timelineIndex } from "@/lib/status";
import type { OrderStatus } from "@/lib/types";
import OrderTimeline from "@/components/store/OrderTimeline";
import OrderTimelineVertical from "@/components/store/OrderTimelineVertical";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Acompanhar pedido",
  robots: { index: false },
};

type Params = { code: string };

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default async function AcompanharPage({ params }: { params: Promise<Params> }) {
  const { code } = await params;
  const data = await getOrderByCode(code);
  if (!data) notFound();
  const { order, items, events } = data;

  const currentIndex = timelineIndex(order.status as OrderStatus);

  // Fluxo "expressa": pagou mas ainda falta enviar as fotos do pet.
  const petRequests = await getPetMiniatureRequestsByOrderId(order.id);
  const petPhotosPending =
    petRequests.length > 0 && petRequests.some((r) => r.photo_paths.length === 0);

  // Datas por passo: 0 = criação do pedido; passos seguintes seguem os eventos.
  const laterEventDates = events
    .filter((e) => e.status !== "pending")
    .map((e) => shortDate(e.created_at));
  const stepDates: (string | null)[] = [0, 1, 2, 3, 4].map((i) => {
    if (i > currentIndex) return null;
    if (i === 0) return shortDate(order.created_at);
    return laterEventDates[i - 1] ?? shortDate(order.updated_at);
  });

  const itemsSummary = items
    .map((it) => `${it.product_name}${it.qty > 1 ? ` (×${it.qty})` : ""}`)
    .join(", ");

  const waNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    `Olá! Tenho uma dúvida sobre o pedido #${order.order_code}.`,
  )}`;

  return (
    <section className="mx-auto max-w-4xl px-6 py-12 sm:px-10 md:py-16">
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-heading text-3xl font-extrabold text-charcoal">
          Pedido #{order.order_code}
        </h1>
        <span className="rounded-full border-2 border-charcoal bg-teal px-3 py-1 font-heading text-[12px] font-bold text-charcoal">
          {statusLabel(order.status as OrderStatus)}
        </span>
      </div>
      <p className="mb-10 font-sans text-sm text-charcoal/60">{itemsSummary}</p>

      {petPhotosPending && (
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border-[3px] border-charcoal bg-coral/15 px-6 py-5">
          <div>
            <div className="mb-1 font-heading text-[15px] font-bold text-charcoal">
              Falta mandar as fotos do seu pet 📸
            </div>
            <div className="font-sans text-[13px] text-charcoal/65">
              A produção só começa quando recebermos as fotos.
            </div>
          </div>
          <Link
            href={`/miniatura-pet/expressa/fotos/${order.order_code}`}
            className="sticker-shadow rounded-full border-[3px] border-charcoal bg-teal px-6 py-3 font-heading text-[13.5px] font-bold text-charcoal transition-transform hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none"
          >
            Enviar as fotos
          </Link>
        </div>
      )}

      {currentIndex === -1 ? (
        <div className="rounded-2xl border-[3px] border-charcoal bg-offwhite-2 p-6 font-sans text-charcoal/75">
          Este pedido foi cancelado. Se acha que é engano, fala com a gente.
        </div>
      ) : (
        <>
          <div className="sm:hidden">
            <OrderTimelineVertical currentIndex={currentIndex} stepDates={stepDates} />
          </div>
          <div className="hidden sm:block">
            <OrderTimeline currentIndex={currentIndex} stepDates={stepDates} />
          </div>
        </>
      )}

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl border-[3px] border-charcoal bg-offwhite-2 px-6 py-5">
        <div>
          <div className="mb-1 font-heading text-[15px] font-bold text-charcoal">
            Ficou com dúvida sobre o pedido?
          </div>
          <div className="font-sans text-[13px] text-charcoal/60">
            Fala com a gente direto pelo WhatsApp.
          </div>
        </div>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border-[3px] border-charcoal bg-teal px-6 py-3 font-heading text-[13.5px] font-bold text-charcoal transition-transform hover:-translate-y-0.5"
        >
          Chamar no WhatsApp
        </a>
      </div>
    </section>
  );
}
