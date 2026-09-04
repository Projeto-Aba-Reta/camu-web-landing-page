"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  getPetMiniatureStatus,
  requestPetMiniatureRetry,
} from "@/app/actions/pet-miniature";
import { formatBRL, FRETE_ENABLED, SHIPPING_CENTS } from "@/lib/money";
import { trackFunnel } from "@/lib/analytics";
import { usePetCart } from "@/lib/pet-miniature-cart";
import type { PetMiniatureStatus, PetMiniatureVariant } from "@/lib/types";

const POLL_MS = 3000;

/** Preço da variante. Com a flag de frete ligada, mostra "R$ 75,00 + R$ 18,00
 *  de frete" ao lado do preço; desligada, lembra que o frete é incluso pra
 *  Sul e Sudeste (demais regiões, combinado à parte). */
function PriceLine({ cents }: { cents: number }) {
  return (
    <p className="font-sans text-sm text-charcoal/60">
      {formatBRL(cents)}{" "}
      <span className="text-charcoal/45">
        {FRETE_ENABLED
          ? `+ ${formatBRL(SHIPPING_CENTS)} de frete`
          : "· frete incluso pra Sul e Sudeste"}
      </span>
    </p>
  );
}

type Props = {
  requestId: string;
  initialStatus: PetMiniatureStatus;
  initialPaintedPreviewUrl: string | null;
  initialPlainPreviewUrl: string | null;
  semPinturaCents: number | null;
  comPinturaCents: number | null;
  initialError: string | null;
  customerName: string | null;
  customerEmail: string | null;
};

export default function PetMiniaturePreview({
  requestId,
  initialStatus,
  initialPaintedPreviewUrl,
  initialPlainPreviewUrl,
  semPinturaCents,
  comPinturaCents,
  initialError,
  customerName,
  customerEmail,
}: Props) {
  const petCart = usePetCart();
  const [status, setStatus] = useState(initialStatus);
  const [paintedUrl, setPaintedUrl] = useState(initialPaintedPreviewUrl);
  const [plainUrl, setPlainUrl] = useState(initialPlainPreviewUrl);
  const [genError, setGenError] = useState(initialError);
  const [busy, setBusy] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [expandedUrl, setExpandedUrl] = useState<string | null>(null);
  const [expandedAlt, setExpandedAlt] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!expandedUrl) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setExpandedUrl(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expandedUrl]);

  const inCart = petCart.items.find((i) => i.requestId === requestId) ?? null;

  useEffect(() => {
    if (status !== "processando") return;

    pollRef.current = setInterval(async () => {
      const res = await getPetMiniatureStatus(requestId);
      if (!res.ok) return;
      setStatus(res.status);
      setPaintedUrl(res.paintedPreviewUrl);
      setPlainUrl(res.plainPreviewUrl);
      setGenError(res.error);
    }, POLL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [status, requestId]);

  async function onRetry() {
    setBusy(true);
    setPayError(null);
    trackFunnel("previa_retentativa");
    const res = await requestPetMiniatureRetry(requestId);
    setBusy(false);
    if (res.ok) {
      setStatus("processando");
      setGenError(null);
    } else {
      setPayError(res.error);
    }
  }

  function centsFor(variant: PetMiniatureVariant): number | null {
    return variant === "com_pintura" ? comPinturaCents : semPinturaCents;
  }

  /** Adiciona (ou troca a variante d)esta miniatura no carrinho. */
  function onAddToCart(variant: PetMiniatureVariant) {
    const cents = centsFor(variant);
    petCart.add({
      requestId,
      variant,
      previewUrl: variant === "com_pintura" ? paintedUrl : plainUrl,
      unitPriceCents: cents ?? 0,
      customerName,
      customerEmail,
    });
    trackFunnel("previa_adicionada_carrinho", { variante: variant });
  }

  if (status === "processando") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border-[3px] border-charcoal bg-offwhite-2 px-6 py-16 text-center">
        <div
          className="h-14 w-14 animate-spin rounded-full border-[6px] border-charcoal/15 border-t-teal-dark"
          aria-hidden
        />
        <h2 className="font-heading text-xl font-extrabold text-charcoal">
          Gerando as prévias da sua miniatura…
        </h2>
        <p className="max-w-sm font-sans text-sm text-charcoal/60">
          Isso leva só alguns instantes. Não precisa recarregar a página — as prévias aparecem
          aqui assim que ficarem prontas.
        </p>
      </div>
    );
  }

  if (status === "falhou") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border-[3px] border-charcoal bg-coral/15 px-6 py-14 text-center">
        <h2 className="font-heading text-xl font-extrabold text-charcoal">
          Não conseguimos gerar a prévia
        </h2>
        <p className="max-w-sm font-sans text-sm text-charcoal/70">
          {genError ?? "Tente novamente — as mesmas fotos já estão salvas."}
        </p>
        <button
          type="button"
          onClick={onRetry}
          disabled={busy}
          className="sticker-shadow rounded-full border-[3px] border-charcoal bg-teal px-6 py-3.5 font-heading font-bold text-charcoal transition-transform hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none disabled:opacity-60"
        >
          {busy ? "Tentando de novo…" : "Tentar novamente"}
        </button>
      </div>
    );
  }

  // status === "pronto"
  const cartCount = petCart.count;

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <h2 className="font-heading text-2xl font-extrabold text-charcoal">
        Olha como ficaria a miniatura!
      </h2>
      <p className="max-w-md font-sans text-sm text-charcoal/60">
        Escolha a versão que você prefere: sem pintura, mais simples, ou pintada nas cores reais
        do seu pet.
      </p>

      <p className="max-w-md font-sans text-sm text-charcoal/60">
        As prévias são só uma ideia do resultado — detalhes de pintura podem ser ajustados depois
        do pagamento, numa conversa com a gente pelo WhatsApp.
      </p>

      <div className="w-full max-w-md rounded-2xl border-2 border-dashed border-charcoal/30 bg-offwhite-2 px-4 py-3 font-sans text-[13px] text-charcoal/70">
        Tem mais de um pet? Adicione várias miniaturas — <strong>cada par sai com desconto</strong>.
      </div>

      <div className="flex w-full flex-wrap justify-center gap-6">
        <div className="flex w-full max-w-[260px] flex-col items-center gap-3">
          {plainUrl && (
            <button
              type="button"
              onClick={() => {
                setExpandedUrl(plainUrl);
                setExpandedAlt("Prévia sem pintura da miniatura do pet");
              }}
              className="sticker-shadow group relative overflow-hidden rounded-2xl border-[3px] border-charcoal"
              aria-label="Ampliar prévia sem pintura"
            >
              <Image
                src={plainUrl}
                alt="Prévia sem pintura da miniatura do pet"
                width={320}
                height={320}
                className="h-auto w-full object-cover transition-transform group-hover:scale-105"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-charcoal/0 opacity-0 transition-opacity group-hover:bg-charcoal/20 group-hover:opacity-100">
                <span className="rounded-full border-2 border-offwhite bg-charcoal/70 px-3 py-1 font-heading text-xs font-bold text-offwhite">
                  Ampliar
                </span>
              </span>
            </button>
          )}
          <div>
            <p className="font-heading font-bold text-charcoal">Sem pintura</p>
            {semPinturaCents != null && <PriceLine cents={semPinturaCents} />}
          </div>
          <button
            type="button"
            onClick={() => onAddToCart("sem_pintura")}
            className={`w-full rounded-full border-[3px] border-charcoal px-5 py-3 font-heading font-bold text-charcoal transition-colors hover:bg-charcoal/5 ${
              inCart?.variant === "sem_pintura" ? "bg-teal" : "bg-transparent"
            }`}
          >
            {inCart?.variant === "sem_pintura" ? "✓ No carrinho" : "Escolher sem pintura"}
          </button>
        </div>

        <div className="flex w-full max-w-[260px] flex-col items-center gap-3">
          {paintedUrl && (
            <button
              type="button"
              onClick={() => {
                setExpandedUrl(paintedUrl);
                setExpandedAlt("Prévia pintada da miniatura do pet");
              }}
              className="sticker-shadow-lg group relative overflow-hidden rounded-2xl border-[3px] border-charcoal"
              aria-label="Ampliar prévia pintada"
            >
              <Image
                src={paintedUrl}
                alt="Prévia pintada da miniatura do pet"
                width={320}
                height={320}
                className="h-auto w-full object-cover transition-transform group-hover:scale-105"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-charcoal/0 opacity-0 transition-opacity group-hover:bg-charcoal/20 group-hover:opacity-100">
                <span className="rounded-full border-2 border-offwhite bg-charcoal/70 px-3 py-1 font-heading text-xs font-bold text-offwhite">
                  Ampliar
                </span>
              </span>
            </button>
          )}
          <div>
            <p className="font-heading font-bold text-charcoal">Com pintura</p>
            {comPinturaCents != null && <PriceLine cents={comPinturaCents} />}
          </div>
          <button
            type="button"
            onClick={() => onAddToCart("com_pintura")}
            className={`sticker-shadow w-full rounded-full border-[3px] border-charcoal px-5 py-3 font-heading font-bold text-charcoal transition-transform hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none ${
              inCart?.variant === "com_pintura" ? "bg-teal" : "bg-teal/40"
            }`}
          >
            {inCart?.variant === "com_pintura" ? "✓ No carrinho" : "Escolher com pintura →"}
          </button>
        </div>
      </div>

      {inCart ? (
        <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-2xl border-[3px] border-charcoal bg-teal/15 px-5 py-5">
          <p className="font-heading text-[15px] font-bold text-charcoal">
            Miniatura adicionada ({inCart.variant === "com_pintura" ? "com pintura" : "sem pintura"})
          </p>
          <p className="font-sans text-[13px] text-charcoal/70">
            {cartCount === 1
              ? "É só esta no carrinho. Adicione o próximo pet pra ativar o desconto por par."
              : `${cartCount} miniaturas no carrinho.`}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/miniatura-pet"
              className="rounded-full border-[3px] border-charcoal bg-transparent px-5 py-3 font-heading text-[13.5px] font-bold text-charcoal transition-colors hover:bg-charcoal/5"
            >
              + Adicionar outro pet
            </Link>
            <Link
              href="/miniatura-pet/carrinho"
              className="sticker-shadow rounded-full border-[3px] border-charcoal bg-coral px-5 py-3 font-heading text-[13.5px] font-bold text-charcoal transition-transform hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none"
            >
              Ir para o carrinho ({cartCount}) →
            </Link>
          </div>
          <button
            type="button"
            onClick={() => petCart.remove(requestId)}
            className="font-heading text-xs font-bold text-charcoal/55 underline underline-offset-4 hover:text-charcoal"
          >
            Remover esta do carrinho
          </button>
        </div>
      ) : (
        <p className="max-w-sm font-sans text-sm text-charcoal/60">
          Curtiu? Escolha uma das opções pra colocar no carrinho. Se quiser, dá pra gerar outra
          tentativa antes de decidir.
        </p>
      )}

      <p className="max-w-sm font-sans text-xs text-charcoal/50">
        Você acompanha esta encomenda e o status pela sua{" "}
        <a href="/conta" className="font-bold text-teal-dark underline underline-offset-2">
          conta
        </a>{" "}
        — é só entrar com o e-mail que você informou.
      </p>

      {payError && (
        <div className="w-full max-w-sm rounded-xl border-2 border-coral bg-coral/15 px-4 py-3 font-sans text-sm font-medium text-charcoal">
          {payError}
        </div>
      )}

      <button
        type="button"
        onClick={onRetry}
        disabled={busy}
        className="rounded-full border-[3px] border-charcoal bg-transparent px-7 py-4 font-heading font-bold text-charcoal transition-colors hover:bg-charcoal/5 disabled:opacity-60"
      >
        Gerar nova tentativa
      </button>

      {expandedUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={expandedAlt}
          onClick={() => setExpandedUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/80 p-4"
        >
          <button
            type="button"
            onClick={() => setExpandedUrl(null)}
            aria-label="Fechar"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-charcoal bg-offwhite font-heading text-xl font-bold text-charcoal transition-transform hover:-translate-y-0.5 hover:translate-x-0.5"
          >
            ×
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            className="sticker-shadow-lg max-h-[85vh] max-w-[90vw] overflow-hidden rounded-2xl border-[3px] border-charcoal bg-offwhite"
          >
            <Image
              src={expandedUrl}
              alt={expandedAlt}
              width={1024}
              height={1024}
              className="h-auto max-h-[85vh] w-auto max-w-[90vw] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
