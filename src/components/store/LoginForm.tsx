"use client";

import { useRef, useState } from "react";
import { requestMagicLink } from "@/app/actions/auth";
import { trackFunnel } from "@/lib/analytics";

const inputClass =
  "w-full rounded-xl border-2 border-charcoal bg-offwhite px-4 py-3.5 font-sans text-sm text-charcoal outline-none placeholder:text-charcoal/45 focus:border-teal-dark";

export default function LoginForm() {
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Conta quantos pedidos de link o cliente faz nesta visita — pedir de novo
  // sem sair da tela é sinal de impaciência (achou que não chegou, etc).
  const requestCountRef = useRef(0);

  async function onSubmit(formData: FormData) {
    setError(null);
    setSubmitting(true);
    const email = String(formData.get("email") ?? "").trim();
    const res = await requestMagicLink(formData);
    setSubmitting(false);
    requestCountRef.current += 1;
    if (res.ok) {
      trackFunnel("login_link_solicitado", {
        tentativa: requestCountRef.current,
        reenvio: requestCountRef.current > 1,
      });
      setSentTo(email);
      setSent(true);
    } else {
      setError(res.error);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border-[3px] border-charcoal bg-offwhite-2 p-6 text-center">
        <div className="mb-2 font-heading text-lg font-extrabold text-charcoal">
          Link enviado! ✉️
        </div>
        <p className="font-sans text-sm leading-relaxed text-charcoal/65">
          Mandamos um link de acesso pra <strong>{sentTo}</strong>. Abra no mesmo
          aparelho — ele vale por 20 minutos.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-4 font-heading text-sm font-bold text-charcoal/60 underline underline-offset-4 hover:text-charcoal"
        >
          Usar outro e-mail
        </button>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <input
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="seu@email.com"
        className={inputClass}
      />

      {error && (
        <div className="rounded-xl border-2 border-coral bg-coral/15 px-4 py-3 font-sans text-sm font-medium text-charcoal">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="sticker-shadow mt-1 rounded-full border-[3px] border-charcoal bg-teal py-4 text-center font-heading font-bold text-charcoal transition-transform hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-none disabled:opacity-60"
      >
        {submitting ? "Enviando…" : "Enviar link de acesso →"}
      </button>
    </form>
  );
}
