"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  approvePetMiniatureAndPay,
  getPetMiniatureStatus,
  requestPetMiniatureRetry,
} from "@/app/actions/pet-miniature";
import { formatBRL } from "@/lib/money";
import type { PetMiniatureStatus, PetMiniatureVariant } from "@/lib/types";

const POLL_MS = 3000;

type Props = {
  requestId: string;
  initialStatus: PetMiniatureStatus;
  initialPaintedPreviewUrl: string | null;
  initialPlainPreviewUrl: string | null;
  semPinturaCents: number | null;
  comPinturaCents: number | null;
  initialError: string | null;
};

export default function PetMiniaturePreview({
  requestId,
  initialStatus,
  initialPaintedPreviewUrl,
  initialPlainPreviewUrl,
  semPinturaCents,
  comPinturaCents,
  initialError,
}: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [paintedUrl, setPaintedUrl] = useState(initialPaintedPreviewUrl);
  const [plainUrl, setPlainUrl] = useState(initialPlainPreviewUrl);
  const [genError, setGenError] = useState(initialError);
  const [busyVariant, setBusyVariant] = useState<PetMiniatureVariant | null>(null);
  const [busy, setBusy] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    const res = await requestPetMiniatureRetry(requestId);
    setBusy(false);
    if (res.ok) {
      setStatus("processando");
      setGenError(null);
    } else {
      setPayError(res.error);
    }
  }

  async function onApprove(variant: PetMiniatureVariant) {
    setBusyVariant(variant);
    setPayError(null);
    const res = await approvePetMiniatureAndPay(requestId, variant);
    if (res.ok) {
      window.location.href = res.initPoint;
      return;
    }
    setBusyVariant(null);
    setPayError(res.error);
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
  const anyBusy = busyVariant !== null || busy;

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <h2 className="font-heading text-2xl font-extrabold text-charcoal">
        Olha como ficaria a miniatura!
      </h2>
      <p className="max-w-md font-sans text-sm text-charcoal/60">
        Escolha a versão que você prefere: sem pintura, mais simples, ou pintada nas cores reais
        do seu pet.
      </p>

      <div className="flex w-full flex-wrap justify-center gap-6">
        <div className="flex w-full max-w-[260px] flex-col items-center gap-3">
          {plainUrl && (
            <div className="sticker-shadow overflow-hidden rounded-2xl border-[3px] border-charcoal">
              <Image
                src={plainUrl}
                alt="Prévia sem pintura da miniatura do pet"
                width={320}
                height={320}
                className="h-auto w-full object-cover"
              />
            </div>
          )}
          <div>
            <p className="font-heading font-bold text-charcoal">Sem pintura</p>
            {semPinturaCents != null && (
              <p className="font-sans text-sm text-charcoal/60">{formatBRL(semPinturaCents)}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onApprove("sem_pintura")}
            disabled={anyBusy}
            className="w-full rounded-full border-[3px] border-charcoal bg-transparent px-5 py-3 font-heading font-bold text-charcoal transition-colors hover:bg-charcoal/5 disabled:opacity-60"
          >
            {busyVariant === "sem_pintura" ? "Preparando…" : "Aprovar sem pintura"}
          </button>
        </div>

        <div className="flex w-full max-w-[260px] flex-col items-center gap-3">
          {paintedUrl && (
            <div className="sticker-shadow-lg overflow-hidden rounded-2xl border-[3px] border-charcoal">
              <Image
                src={paintedUrl}
                alt="Prévia pintada da miniatura do pet"
                width={320}
                height={320}
                className="h-auto w-full object-cover"
              />
            </div>
          )}
          <div>
            <p className="font-heading font-bold text-charcoal">Com pintura</p>
            {comPinturaCents != null && (
              <p className="font-sans text-sm text-charcoal/60">{formatBRL(comPinturaCents)}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onApprove("com_pintura")}
            disabled={anyBusy}
            className="sticker-shadow w-full rounded-full border-[3px] border-charcoal bg-teal px-5 py-3 font-heading font-bold text-charcoal transition-transform hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none disabled:opacity-60"
          >
            {busyVariant === "com_pintura" ? "Preparando…" : "Aprovar com pintura →"}
          </button>
        </div>
      </div>

      <p className="max-w-sm font-sans text-sm text-charcoal/60">
        Curtiu? Aprove uma das opções pra seguir pro pagamento. Se quiser, dá pra gerar outra
        tentativa antes de decidir.
      </p>

      {payError && (
        <div className="w-full max-w-sm rounded-xl border-2 border-coral bg-coral/15 px-4 py-3 font-sans text-sm font-medium text-charcoal">
          {payError}
        </div>
      )}

      <button
        type="button"
        onClick={onRetry}
        disabled={anyBusy}
        className="rounded-full border-[3px] border-charcoal bg-transparent px-7 py-4 font-heading font-bold text-charcoal transition-colors hover:bg-charcoal/5 disabled:opacity-60"
      >
        Gerar nova tentativa
      </button>
    </div>
  );
}
