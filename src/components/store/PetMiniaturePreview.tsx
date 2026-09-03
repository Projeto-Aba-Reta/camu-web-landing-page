"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  approvePetMiniatureAndPay,
  getPetMiniatureStatus,
  requestPetMiniatureRetry,
} from "@/app/actions/pet-miniature";
import { formatBRL, FRETE_ENABLED, SHIPPING_CENTS } from "@/lib/money";
import { trackFunnel } from "@/lib/analytics";
import { isCepComplete, lookupCep } from "@/lib/cep";
import type { PetMiniatureStatus, PetMiniatureVariant } from "@/lib/types";

const POLL_MS = 3000;

/** Preço da variante. Com a flag de frete ligada, mostra "R$ 75,00 + R$ 18,00
 *  de frete" ao lado do preço; desligada, avisa que o frete é combinado à parte. */
function PriceLine({ cents }: { cents: number }) {
  return (
    <p className="font-sans text-sm text-charcoal/60">
      {formatBRL(cents)}{" "}
      <span className="text-charcoal/45">
        {FRETE_ENABLED ? `+ ${formatBRL(SHIPPING_CENTS)} de frete` : "+ frete à parte"}
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
  const [chosenVariant, setChosenVariant] = useState<PetMiniatureVariant | null>(null);
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [uf, setUf] = useState("");
  const [cepState, setCepState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [cepError, setCepError] = useState<string | null>(null);
  const lookedUpCep = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addressRevealed = cepState === "done" || cepState === "error";

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

  function formatCep(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
  }

  function onCepChange(value: string) {
    const masked = formatCep(value);
    setCep(masked);
    if (isCepComplete(masked)) {
      void resolveCep(masked);
    } else {
      setCepState("idle");
      setCepError(null);
      lookedUpCep.current = null;
    }
  }

  /** Busca o endereço na base dos Correios e preenche os campos, deixando-os
   *  editáveis. Só refaz a busca se o CEP mudou desde a última consulta. */
  async function resolveCep(value: string) {
    const digits = value.replace(/\D/g, "");
    if (lookedUpCep.current === digits || cepState === "loading") return;
    lookedUpCep.current = digits;
    setCepState("loading");
    setCepError(null);
    try {
      const addr = await lookupCep(digits);
      setStreet(addr.street);
      setNeighborhood(addr.neighborhood);
      setCity(addr.city);
      setUf(addr.uf);
      setCepState("done");
    } catch (err) {
      // Deixa o cliente preencher à mão, mas revela os campos mesmo assim.
      setCepError(
        err instanceof Error ? err.message : "Não foi possível buscar o CEP — preencha à mão.",
      );
      setCepState("error");
    }
  }

  /** 1º passo: cliente escolhe a variante — sem chamar o servidor ainda.
   *  Só então pedimos o endereço, pra não travar quem só quer ver a prévia. */
  function onChooseVariant(variant: PetMiniatureVariant) {
    setChosenVariant(variant);
    setPayError(null);
    trackFunnel("previa_aprovada", { variante: variant });
  }

  /** 2º passo: com a variante já escolhida, valida o endereço e cria o
   *  pedido/preferência de pagamento. */
  async function onConfirmAddress() {
    const variant = chosenVariant;
    if (!variant) return;

    if (!isCepComplete(cep)) {
      setPayError("Informe o CEP de entrega (8 dígitos).");
      return;
    }
    if (!addressRevealed) {
      setPayError("Aguarde a busca do endereço pelo CEP.");
      return;
    }
    const fields = {
      street: street.trim(),
      number: number.trim(),
      neighborhood: neighborhood.trim(),
      city: city.trim(),
      uf: uf.trim(),
    };
    if (!fields.number) {
      setPayError("Informe o número do endereço.");
      return;
    }
    if (!fields.street || !fields.neighborhood || !fields.city || !fields.uf) {
      setPayError("Preencha todos os campos do endereço — nenhum pode ficar vazio.");
      return;
    }

    const line = `${fields.street}, ${fields.number}${
      complement.trim() ? ` - ${complement.trim()}` : ""
    } - ${fields.neighborhood}`;

    setBusyVariant(variant);
    setPayError(null);
    const res = await approvePetMiniatureAndPay(requestId, variant, {
      cep: cep.trim(),
      line,
      city: fields.city,
      uf: fields.uf,
    });
    if (res.ok) {
      trackFunnel("checkout_iniciado", { fluxo: "miniatura_pet" });
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
  const inputClass =
    "w-full rounded-xl border-2 border-charcoal bg-offwhite px-4 py-3 font-sans text-sm text-charcoal outline-none placeholder:text-charcoal/45 focus:border-teal-dark";

  // 2º passo: variante escolhida — agora sim pedimos o endereço de entrega.
  if (chosenVariant) {
    const priceCents = chosenVariant === "com_pintura" ? comPinturaCents : semPinturaCents;
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <h2 className="font-heading text-2xl font-extrabold text-charcoal">Endereço de entrega</h2>
        <p className="max-w-md font-sans text-sm text-charcoal/60">
          Você escolheu a miniatura{" "}
          <strong>{chosenVariant === "com_pintura" ? "com pintura" : "sem pintura"}</strong>
          {priceCents != null && <> — {formatBRL(priceCents)}</>}. Digite o CEP: buscamos o
          endereço nos Correios e você confere o resto. Preencha o número — nenhum campo pode
          ficar vazio.
        </p>

        <div className="w-full max-w-md rounded-2xl border-[3px] border-charcoal bg-offwhite-2 p-5 text-left">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              inputMode="numeric"
              placeholder="CEP *"
              value={cep}
              onChange={(e) => onCepChange(e.target.value)}
              onBlur={() => isCepComplete(cep) && void resolveCep(cep)}
              className={`${inputClass} sm:col-span-2`}
            />

            {cepState === "loading" && (
              <p className="font-sans text-xs text-charcoal/55 sm:col-span-2">
                Buscando endereço nos Correios…
              </p>
            )}
            {cepError && (
              <p className="font-sans text-xs font-medium text-coral sm:col-span-2">{cepError}</p>
            )}

            {addressRevealed && (
              <>
                <input
                  placeholder="Rua / logradouro *"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className={`${inputClass} sm:col-span-2`}
                />
                <input
                  inputMode="numeric"
                  placeholder="Número *"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  className={inputClass}
                />
                <input
                  placeholder="Complemento (opcional)"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  className={inputClass}
                />
                <input
                  placeholder="Bairro *"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className={`${inputClass} sm:col-span-2`}
                />
                <input
                  placeholder="Cidade *"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={inputClass}
                />
                <input
                  placeholder="UF *"
                  maxLength={2}
                  value={uf}
                  onChange={(e) => setUf(e.target.value.toUpperCase())}
                  className={inputClass}
                />
              </>
            )}
          </div>
        </div>

        {payError && (
          <div className="w-full max-w-sm rounded-xl border-2 border-coral bg-coral/15 px-4 py-3 font-sans text-sm font-medium text-charcoal">
            {payError}
          </div>
        )}

        <button
          type="button"
          onClick={onConfirmAddress}
          disabled={anyBusy}
          className="sticker-shadow w-full max-w-sm rounded-full border-[3px] border-charcoal bg-coral py-4 font-heading font-bold text-charcoal transition-transform hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none disabled:opacity-60"
        >
          {busyVariant ? "Redirecionando…" : "Ir para o pagamento →"}
        </button>

        <button
          type="button"
          onClick={() => {
            setChosenVariant(null);
            setPayError(null);
          }}
          disabled={anyBusy}
          className="font-heading text-sm font-bold text-charcoal/60 underline underline-offset-4 hover:text-charcoal disabled:opacity-60"
        >
          ‹ Voltar às prévias
        </button>
      </div>
    );
  }

  // 1º passo: só as prévias e a escolha da variante — nada trava quem só quer ver.
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
            {semPinturaCents != null && <PriceLine cents={semPinturaCents} />}
          </div>
          <button
            type="button"
            onClick={() => onChooseVariant("sem_pintura")}
            disabled={anyBusy}
            className="w-full rounded-full border-[3px] border-charcoal bg-transparent px-5 py-3 font-heading font-bold text-charcoal transition-colors hover:bg-charcoal/5 disabled:opacity-60"
          >
            Aprovar sem pintura
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
            {comPinturaCents != null && <PriceLine cents={comPinturaCents} />}
          </div>
          <button
            type="button"
            onClick={() => onChooseVariant("com_pintura")}
            disabled={anyBusy}
            className="sticker-shadow w-full rounded-full border-[3px] border-charcoal bg-teal px-5 py-3 font-heading font-bold text-charcoal transition-transform hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none disabled:opacity-60"
          >
            Aprovar com pintura →
          </button>
        </div>
      </div>

      <p className="max-w-sm font-sans text-sm text-charcoal/60">
        Curtiu? Aprove uma das opções pra seguir pro endereço e pagamento. Se quiser, dá pra
        gerar outra tentativa antes de decidir.
      </p>

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
        disabled={anyBusy}
        className="rounded-full border-[3px] border-charcoal bg-transparent px-7 py-4 font-heading font-bold text-charcoal transition-colors hover:bg-charcoal/5 disabled:opacity-60"
      >
        Gerar nova tentativa
      </button>
    </div>
  );
}
