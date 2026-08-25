"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  approvePetMiniatureAndPay,
  getPetMiniatureStatus,
  requestPetMiniatureRetry,
} from "@/app/actions/pet-miniature";
import type { PetMiniatureStatus } from "@/lib/types";

const POLL_MS = 3000;

type Props = {
  requestId: string;
  initialStatus: PetMiniatureStatus;
  initialPreviewUrl: string | null;
  initialError: string | null;
};

export default function PetMiniaturePreview({
  requestId,
  initialStatus,
  initialPreviewUrl,
  initialError,
}: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [previewUrl, setPreviewUrl] = useState(initialPreviewUrl);
  const [genError, setGenError] = useState(initialError);
  const [busy, setBusy] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status !== "processando") return;

    pollRef.current = setInterval(async () => {
      const res = await getPetMiniatureStatus(requestId);
      if (!res.ok) return;
      setStatus(res.status);
      setPreviewUrl(res.previewUrl);
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

  async function onApprove() {
    setBusy(true);
    setPayError(null);
    const res = await approvePetMiniatureAndPay(requestId);
    if (res.ok) {
      window.location.href = res.initPoint;
      return;
    }
    setBusy(false);
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
          Gerando a prévia da sua miniatura…
        </h2>
        <p className="max-w-sm font-sans text-sm text-charcoal/60">
          Isso leva só alguns instantes. Não precisa recarregar a página — a prévia aparece aqui
          assim que ficar pronta.
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
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <h2 className="font-heading text-2xl font-extrabold text-charcoal">
        Olha como ficaria a miniatura!
      </h2>

      {previewUrl && (
        <div className="sticker-shadow-lg overflow-hidden rounded-2xl border-[3px] border-charcoal">
          <Image
            src={previewUrl}
            alt="Prévia gerada da miniatura do pet"
            width={420}
            height={420}
            className="h-auto w-full max-w-sm object-cover"
          />
        </div>
      )}

      <p className="max-w-sm font-sans text-sm text-charcoal/60">
        Curtiu? Aprove pra seguir pro pagamento. Se quiser, dá pra gerar outra tentativa antes de
        decidir.
      </p>

      {payError && (
        <div className="w-full max-w-sm rounded-xl border-2 border-coral bg-coral/15 px-4 py-3 font-sans text-sm font-medium text-charcoal">
          {payError}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-3.5">
        <button
          type="button"
          onClick={onApprove}
          disabled={busy}
          className="sticker-shadow rounded-full border-[3px] border-charcoal bg-teal px-7 py-4 font-heading font-bold text-charcoal transition-transform hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none disabled:opacity-60"
        >
          {busy ? "Preparando pagamento…" : "Aprovar e pagar →"}
        </button>
        <button
          type="button"
          onClick={onRetry}
          disabled={busy}
          className="rounded-full border-[3px] border-charcoal bg-transparent px-7 py-4 font-heading font-bold text-charcoal transition-colors hover:bg-charcoal/5 disabled:opacity-60"
        >
          Gerar nova tentativa
        </button>
      </div>
    </div>
  );
}
