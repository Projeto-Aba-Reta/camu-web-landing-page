"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { submitPetMiniatureIntake } from "@/app/actions/pet-miniature";
import { trackFunnel } from "@/lib/analytics";
import { formatPhone, isValidPhone, isValidEmail } from "@/lib/contact";

const MIN_PHOTOS = 3;
const MAX_PHOTOS = 4;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const inputClass =
  "w-full rounded-xl border-2 border-charcoal bg-offwhite px-4 py-3.5 font-sans text-sm text-charcoal outline-none placeholder:text-charcoal/45 focus:border-teal-dark";

export default function PetMiniatureIntakeForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const startedRef = useRef(false);

  function markStarted() {
    if (startedRef.current) return;
    startedRef.current = true;
    trackFunnel("intake_iniciado");
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    setError(null);

    const incoming = Array.from(fileList);
    const invalid = incoming.find((f) => !ALLOWED_TYPES.includes(f.type));
    if (invalid) {
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

  async function onSubmit(formData: FormData) {
    setError(null);

    const email = String(formData.get("email") ?? "").trim();
    if (!isValidEmail(email)) {
      setError("Digite um e-mail válido — é por ele que você acompanha o pedido.");
      return;
    }
    if (!isValidPhone(phone)) {
      setError("Digite um WhatsApp válido com DDD, ex.: +55 (11) 91258-1464.");
      return;
    }

    if (photos.length < MIN_PHOTOS) {
      setError(`Envie pelo menos ${MIN_PHOTOS} fotos do seu pet.`);
      return;
    }

    photos.forEach((file) => formData.append("photos", file));

    setSubmitting(true);
    const res = await submitPetMiniatureIntake(formData);
    setSubmitting(false);

    if (res.ok) {
      trackFunnel("intake_enviado");
      router.push(`/miniatura-pet/${res.requestId}`);
    } else {
      setError(res.error);
    }
  }

  return (
    <form action={onSubmit} onFocusCapture={markStarted} className="flex flex-col gap-4">
      <input name="name" required placeholder="Nome" className={inputClass} />
      <input
        name="phone"
        required
        inputMode="tel"
        autoComplete="tel"
        placeholder="WhatsApp — +55 (11) 91258-1464"
        className={inputClass}
        value={phone}
        onChange={(e) => setPhone(formatPhone(e.target.value))}
      />
      <div>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="E-mail"
          className={inputClass}
        />
        <p className="mt-1.5 font-sans text-[11px] text-charcoal/50">
          É por ele que você acompanha o pedido e o status — a gente manda um link
          de acesso, sem senha.
        </p>
      </div>

      <div>
        <div className="mb-2.5 flex items-baseline justify-between">
          <div className="font-heading text-[13px] font-bold text-charcoal">Fotos do seu pet</div>
          <div className="font-sans text-xs font-medium text-charcoal/50">
            {photos.length}/{MAX_PHOTOS} · mínimo {MIN_PHOTOS}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          {photos.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="relative aspect-square overflow-hidden rounded-xl border-2 border-charcoal"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- preview de File local, sem otimização de next/image */}
              <img
                src={URL.createObjectURL(file)}
                alt={`Foto ${i + 1} do pet`}
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
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-charcoal/30 bg-offwhite-2 text-charcoal/50 transition-colors hover:border-teal-dark hover:text-teal-dark">
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
      </div>

      {error && (
        <div className="rounded-xl border-2 border-coral bg-coral/15 px-4 py-3 font-sans text-sm font-medium text-charcoal">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="sticker-shadow mt-1.5 flex items-center justify-center gap-2.5 rounded-full border-[3px] border-charcoal bg-teal py-4 text-center font-heading font-bold text-charcoal transition-transform hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none disabled:opacity-60"
      >
        {submitting && (
          <span
            className="h-4 w-4 animate-spin rounded-full border-[3px] border-charcoal/25 border-t-charcoal"
            aria-hidden
          />
        )}
        {submitting ? "Enviando fotos…" : "Gerar prévia da miniatura →"}
      </button>
    </form>
  );
}
