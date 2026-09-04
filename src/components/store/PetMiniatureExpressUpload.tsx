"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { uploadExpressPetPhotos, getExpressPetMiniatureStatus } from "@/app/actions/pet-miniature";
import type { ExpressPetMiniatureStatusResult } from "@/app/actions/pet-miniature";

const MIN_PHOTOS = 3;
const MAX_PHOTOS = 4;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const POLL_MS = 3000;

const WA_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");

function waUrl(text: string): string {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
}

type PetSlot = {
  index: number;
  variantLabel: string;
  hasPhotos: boolean;
};

type Props = {
  orderCode: string;
  pets: PetSlot[];
};

export default function PetMiniatureExpressUpload({ orderCode, pets }: Props) {
  const [done, setDone] = useState<Record<number, boolean>>(
    Object.fromEntries(pets.filter((p) => p.hasPhotos).map((p) => [p.index, true])),
  );

  const pending = pets.filter((p) => !done[p.index]);

  return (
    <div className="flex flex-col gap-6">
      {pending.length === 0 && (
        <div className="rounded-2xl border-[3px] border-charcoal bg-teal/15 px-6 py-6 text-center">
          <h2 className="mb-1.5 font-heading text-xl font-extrabold text-charcoal">
            Fotos recebidas! 🐾
          </h2>
          <p className="font-sans text-sm text-charcoal/70">
            Já temos tudo pra começar sua(s) miniatura(s). Assim que a prévia pintada ficar pronta,
            ela aparece aqui embaixo.
          </p>
        </div>
      )}
      {pets.map((pet) => (
        <PetUploader
          key={pet.index}
          orderCode={orderCode}
          pet={pet}
          done={!!done[pet.index]}
          onDone={() => setDone((d) => ({ ...d, [pet.index]: true }))}
        />
      ))}
    </div>
  );
}

function PetUploader({
  orderCode,
  pet,
  done,
  onDone,
}: {
  orderCode: string;
  pet: PetSlot;
  done: boolean;
  onDone: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    setError(null);
    const incoming = Array.from(fileList);
    if (incoming.some((f) => !ALLOWED_TYPES.includes(f.type))) {
      setError("Cada foto precisa ser JPG, PNG ou WEBP.");
      return;
    }
    const merged = [...photos, ...incoming].slice(0, MAX_PHOTOS);
    if (photos.length + incoming.length > MAX_PHOTOS) {
      setError(`Você pode enviar no máximo ${MAX_PHOTOS} fotos.`);
    }
    setPhotos(merged);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePhoto(index: number) {
    setError(null);
    setPhotos((cur) => cur.filter((_, i) => i !== index));
  }

  async function onSubmit() {
    setError(null);
    if (photos.length < MIN_PHOTOS) {
      setError(`Envie pelo menos ${MIN_PHOTOS} fotos deste pet.`);
      return;
    }
    const formData = new FormData();
    photos.forEach((file) => formData.append("photos", file));

    setSubmitting(true);
    const res = await uploadExpressPetPhotos(orderCode, pet.index, formData);
    setSubmitting(false);
    if (res.ok) {
      onDone();
    } else {
      setError(res.error);
    }
  }

  return (
    <div className="rounded-2xl border-[3px] border-charcoal bg-offwhite-2 p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-heading text-[15px] font-bold text-charcoal">
          Pet {pet.index + 1} · {pet.variantLabel}
        </h3>
        {done ? (
          <span className="font-heading text-xs font-bold text-teal-dark">✓ fotos enviadas</span>
        ) : (
          <span className="font-sans text-xs font-medium text-charcoal/50">
            {photos.length}/{MAX_PHOTOS} · mínimo {MIN_PHOTOS}
          </span>
        )}
      </div>

      {done ? (
        <PetExpressPreview orderCode={orderCode} pet={pet} />
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2.5">
            {photos.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="relative aspect-square overflow-hidden rounded-xl border-2 border-charcoal"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- preview de File local */}
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Foto ${i + 1} do pet ${pet.index + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  aria-label={`Remover foto ${i + 1}`}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-charcoal bg-offwhite font-heading text-xs font-extrabold text-charcoal"
                >
                  ×
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-charcoal/30 bg-offwhite text-charcoal/50 transition-colors hover:border-teal-dark hover:text-teal-dark">
                <span className="font-heading text-2xl font-extrabold">+</span>
                <span className="font-sans text-[11px] font-semibold">adicionar</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => addFiles(e.target.files)}
                />
              </label>
            )}
          </div>

          {error && (
            <div className="mt-3 rounded-xl border-2 border-coral bg-coral/15 px-4 py-3 font-sans text-sm font-medium text-charcoal">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="sticker-shadow mt-4 flex w-full items-center justify-center gap-2.5 rounded-full border-[3px] border-charcoal bg-teal py-3.5 font-heading font-bold text-charcoal transition-transform hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none disabled:opacity-60"
          >
            {submitting ? "Enviando fotos…" : "Enviar fotos deste pet →"}
          </button>
        </>
      )}
    </div>
  );
}

/** Depois que as fotos deste pet são enviadas, gera (via polling) e mostra a
 *  prévia pintada — o fluxo expressa só vende a versão pintada. Sempre mostra
 *  o CTA de WhatsApp pra quem quiser algo diferente do gerado. */
function PetExpressPreview({ orderCode, pet }: { orderCode: string; pet: PetSlot }) {
  const [result, setResult] = useState<ExpressPetMiniatureStatusResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function poll() {
      const res = await getExpressPetMiniatureStatus(orderCode, pet.index);
      if (cancelled) return;
      setResult(res);
      if (!res.ok || res.status !== "processando") {
        if (timer) clearInterval(timer);
      }
    }

    poll();
    timer = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [orderCode, pet.index]);

  const waText = `Olá! Fiz o pedido #${orderCode} (miniatura pintada, pet ${
    pet.index + 1
  }) e queria pedir um ajuste diferente da prévia.`;

  if (!result || (result.ok && result.status === "processando")) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <div
          className="h-9 w-9 animate-spin rounded-full border-[5px] border-charcoal/15 border-t-teal-dark"
          aria-hidden
        />
        <p className="font-sans text-[13px] text-charcoal/60">
          Recebemos as fotos! Gerando a prévia pintada deste pet…
        </p>
      </div>
    );
  }

  if (!result.ok || result.status === "falhou") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-coral bg-coral/10 px-4 py-4 text-center">
        <p className="font-sans text-[13px] text-charcoal/70">
          {!result.ok
            ? result.error
            : (result.error ?? "Não conseguimos gerar a prévia deste pet.")}
        </p>
        <a
          href={waUrl(waText)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border-[3px] border-charcoal bg-teal px-5 py-2.5 font-heading text-[13px] font-bold text-charcoal"
        >
          Falar no WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      {result.paintedPreviewUrl && (
        <div className="sticker-shadow overflow-hidden rounded-2xl border-[3px] border-charcoal">
          <Image
            src={result.paintedPreviewUrl}
            alt={`Prévia pintada da miniatura do pet ${pet.index + 1}`}
            width={240}
            height={240}
            className="h-auto w-full max-w-[240px] object-cover"
          />
        </div>
      )}
      <p className="max-w-sm font-sans text-[13px] text-charcoal/60">
        É assim que ficaria a miniatura pintada deste pet. As cores e detalhes ainda podem ser
        ajustados na produção.
      </p>
      <div className="w-full max-w-sm rounded-2xl border-2 border-dashed border-charcoal/30 bg-offwhite-2 px-4 py-3 text-left font-sans text-[13px] text-charcoal/70">
        <p className="mb-1 font-heading text-[13.5px] font-bold text-charcoal">
          Detalhes da pintura 🎨
        </p>
        Sua miniatura vai ser pintada à mão. Chama a gente no WhatsApp e conta o que não pode
        faltar no seu pet — cor da coleira, aquela manchinha característica, o tom certo do pelo,
        os olhos…
      </div>
      <a
        href={waUrl(waText)}
        target="_blank"
        rel="noopener noreferrer"
        className="sticker-shadow rounded-full border-[3px] border-charcoal bg-teal px-6 py-3 font-heading text-[13.5px] font-bold text-charcoal transition-transform hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none"
      >
        Falar no WhatsApp
      </a>
    </div>
  );
}
