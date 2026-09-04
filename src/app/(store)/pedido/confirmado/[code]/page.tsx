import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderByCode, reconcileOrderPayment } from "@/lib/store";
import { getPetMiniatureRequestsByOrderId } from "@/lib/pet-miniature";
import { formatBRL } from "@/lib/money";
import { STORE_ENABLED } from "@/lib/features";
import PedidoPagoTracker from "@/components/store/PedidoPagoTracker";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pedido confirmado",
  robots: { index: false },
};

type Params = { code: string };

export default async function ConfirmadoPage({ params }: { params: Promise<Params> }) {
  const { code } = await params;

  // Reconcilia com o Mercado Pago (cobre o caso em que o webhook não chegou).
  await reconcileOrderPayment(code);

  const data = await getOrderByCode(code);
  if (!data) notFound();
  const { order } = data;

  const approved = order.payment_status === "approved";
  const pending = order.payment_status === "pending" || order.payment_status === "in_process";

  // Fluxo "expressa": o cliente paga primeiro e ainda precisa enviar as fotos.
  const petRequests = await getPetMiniatureRequestsByOrderId(order.id);
  const petPhotosPending =
    petRequests.length > 0 && petRequests.some((r) => r.photo_paths.length === 0);
  const fluxo =
    petRequests.length === 0
      ? "catalogo"
      : petPhotosPending
        ? "miniatura_pet_expressa"
        : "miniatura_pet_normal";

  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center px-6 py-16 text-center sm:px-10">
      {approved && (
        <PedidoPagoTracker orderCode={order.order_code} totalCents={order.total_cents} fluxo={fluxo} />
      )}
      <div
        className="mb-6 flex items-center justify-center rounded-full border-4 border-charcoal"
        style={{
          height: 88,
          width: 88,
          transform: "rotate(-4deg)",
          background: approved ? "#0FBFA0" : pending ? "#FF6B4A" : "#F1EEE6",
        }}
      >
        <span className="font-heading text-4xl font-extrabold text-charcoal">
          {approved ? "✓" : pending ? "…" : "!"}
        </span>
      </div>

      <h1 className="mb-2.5 font-heading text-3xl font-extrabold text-charcoal sm:text-4xl">
        {approved ? "Pedido confirmado!" : pending ? "Quase lá!" : "Pagamento pendente"}
      </h1>
      <p className="mb-7 max-w-md font-sans text-[15px] leading-relaxed text-charcoal/70">
        {approved ? (
          <>
            Pedido <strong>#{order.order_code}</strong> recebido. Enviamos os detalhes pro seu
            e-mail.
          </>
        ) : pending ? (
          <>
            Pedido <strong>#{order.order_code}</strong> registrado. Se você pagou com Pix, a
            confirmação cai em instantes — a gente atualiza o status automaticamente.
          </>
        ) : (
          <>
            Não recebemos a confirmação do pagamento do pedido <strong>#{order.order_code}</strong>.
          </>
        )}
      </p>

      <div className="mb-8 w-full max-w-md rounded-2xl border-[3px] border-charcoal bg-offwhite-2 p-6 text-left">
        {order.discount_cents > 0 && (
          <div className="mb-2.5 flex justify-between font-sans text-sm font-medium text-teal-dark">
            <span>Desconto promoção</span>
            <span>−{formatBRL(order.discount_cents)}</span>
          </div>
        )}
        <div className="mb-2.5 flex justify-between font-sans text-sm font-medium text-charcoal">
          <span>Total</span>
          <span className="font-heading text-[15px] font-bold">{formatBRL(order.total_cents)}</span>
        </div>
        <div className="mb-2.5 flex justify-between font-sans text-sm font-medium text-charcoal">
          <span>Pagamento</span>
          <span className="capitalize">{order.payment_status}</span>
        </div>
        <div className="flex justify-between font-sans text-sm font-medium text-charcoal">
          <span>Previsão de produção</span>
          <span>5-7 dias úteis</span>
        </div>
      </div>

      {petPhotosPending && (
        <div className="mb-8 w-full max-w-md rounded-2xl border-[3px] border-charcoal bg-coral/15 p-6 text-left">
          <div className="mb-1.5 font-heading text-[15px] font-bold text-charcoal">
            Falta mandar as fotos 📸
          </div>
          <p className="mb-4 font-sans text-[13.5px] leading-relaxed text-charcoal/70">
            Sua miniatura só entra na fila quando recebermos as fotos do seu pet. É rápido — de 3 a 4
            fotos por pet. O link também foi pro seu e-mail.
          </p>
          <Link
            href={`/miniatura-pet/expressa/fotos/${order.order_code}`}
            className="sticker-shadow inline-block rounded-full border-[3px] border-charcoal bg-teal px-6 py-3 font-heading text-[13.5px] font-bold text-charcoal transition-transform hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none"
          >
            Enviar as fotos agora
          </Link>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-3.5">
        <Link
          href={`/pedido/${order.order_code}`}
          className="sticker-shadow rounded-full border-[3px] border-charcoal bg-coral px-7 py-4 font-heading font-bold text-charcoal transition-transform hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none"
        >
          Acompanhar pedido →
        </Link>
        <Link
          href={STORE_ENABLED ? "/loja" : "/"}
          className="rounded-full border-[3px] border-charcoal bg-transparent px-7 py-4 font-heading font-bold text-charcoal transition-colors hover:bg-charcoal/5"
        >
          {STORE_ENABLED ? "Voltar à loja" : "Voltar ao início"}
        </Link>
      </div>
    </section>
  );
}
