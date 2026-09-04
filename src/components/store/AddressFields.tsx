"use client";

import { useRef, useState } from "react";
import { FRETE_ENABLED, isFreteInclusoUF } from "@/lib/money";
import { isCepComplete, lookupCep } from "@/lib/cep";

/** Campos crus do formulário de endereço (miniatura de pet). */
export type AddressFormValue = {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  uf: string;
};

export const emptyAddress: AddressFormValue = {
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  uf: "",
};

/** Linha única de endereço (logradouro, número, complemento, bairro). */
export function addressLine(v: AddressFormValue): string {
  const comp = v.complement.trim() ? ` - ${v.complement.trim()}` : "";
  return `${v.street.trim()}, ${v.number.trim()}${comp} - ${v.neighborhood.trim()}`;
}

/** Devolve a mensagem de erro do endereço, ou null se está tudo certo. */
export function validateAddress(v: AddressFormValue): string | null {
  if (!isCepComplete(v.cep)) return "Informe o CEP de entrega (8 dígitos).";
  if (!v.number.trim()) return "Informe o número do endereço.";
  if (!v.street.trim() || !v.neighborhood.trim() || !v.city.trim() || !v.uf.trim()) {
    return "Preencha todos os campos do endereço — nenhum pode ficar vazio.";
  }
  return null;
}

function formatCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

const inputClass =
  "w-full rounded-xl border-2 border-charcoal bg-offwhite px-4 py-3 font-sans text-sm text-charcoal outline-none placeholder:text-charcoal/45 focus:border-teal-dark";

type Props = {
  value: AddressFormValue;
  onChange: (next: AddressFormValue) => void;
  disabled?: boolean;
};

/** Endereço de entrega com busca automática pelo CEP (Correios) — extraído do
 *  fluxo antigo da miniatura de pet pra ser reusado no carrinho. */
export default function AddressFields({ value, onChange, disabled }: Props) {
  const [cepState, setCepState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [cepError, setCepError] = useState<string | null>(null);
  const lookedUpCep = useRef<string | null>(null);

  const addressRevealed = cepState === "done" || cepState === "error";
  const patch = (p: Partial<AddressFormValue>) => onChange({ ...value, ...p });

  async function resolveCep(raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (lookedUpCep.current === digits || cepState === "loading") return;
    lookedUpCep.current = digits;
    setCepState("loading");
    setCepError(null);
    try {
      const addr = await lookupCep(digits);
      onChange({
        ...value,
        cep: formatCep(raw),
        street: addr.street,
        neighborhood: addr.neighborhood,
        city: addr.city,
        uf: addr.uf,
      });
      setCepState("done");
    } catch (err) {
      setCepError(
        err instanceof Error ? err.message : "Não foi possível buscar o CEP — preencha à mão.",
      );
      setCepState("error");
    }
  }

  function onCepChange(raw: string) {
    const masked = formatCep(raw);
    patch({ cep: masked });
    if (isCepComplete(masked)) {
      void resolveCep(masked);
    } else {
      setCepState("idle");
      setCepError(null);
      lookedUpCep.current = null;
    }
  }

  return (
    <div className="w-full rounded-2xl border-[3px] border-charcoal bg-offwhite-2 p-5 text-left">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          inputMode="numeric"
          placeholder="CEP *"
          value={value.cep}
          disabled={disabled}
          onChange={(e) => onCepChange(e.target.value)}
          onBlur={() => isCepComplete(value.cep) && void resolveCep(value.cep)}
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
              value={value.street}
              disabled={disabled}
              onChange={(e) => patch({ street: e.target.value })}
              className={`${inputClass} sm:col-span-2`}
            />
            <input
              inputMode="numeric"
              placeholder="Número *"
              value={value.number}
              disabled={disabled}
              onChange={(e) => patch({ number: e.target.value })}
              className={inputClass}
            />
            <input
              placeholder="Complemento (opcional)"
              value={value.complement}
              disabled={disabled}
              onChange={(e) => patch({ complement: e.target.value })}
              className={inputClass}
            />
            <input
              placeholder="Bairro *"
              value={value.neighborhood}
              disabled={disabled}
              onChange={(e) => patch({ neighborhood: e.target.value })}
              className={`${inputClass} sm:col-span-2`}
            />
            <input
              placeholder="Cidade *"
              value={value.city}
              disabled={disabled}
              onChange={(e) => patch({ city: e.target.value })}
              className={inputClass}
            />
            <input
              placeholder="UF *"
              maxLength={2}
              value={value.uf}
              disabled={disabled}
              onChange={(e) => patch({ uf: e.target.value.toUpperCase() })}
              className={inputClass}
            />
          </>
        )}
      </div>

      {value.uf.trim() && !FRETE_ENABLED && (
        <p className="mt-3 font-sans text-sm text-charcoal/60">
          {isFreteInclusoUF(value.uf)
            ? "Frete incluso — seu endereço é no Sul ou Sudeste. Nada a mais no total."
            : "Seu endereço está fora do Sul e Sudeste — o frete é calculado pelo CEP e somado ao total."}
        </p>
      )}
    </div>
  );
}
