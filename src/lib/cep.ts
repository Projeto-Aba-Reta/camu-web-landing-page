/** Endereço resolvido a partir de um CEP. Campos podem vir vazios quando a
 *  base dos Correios não tem o logradouro (CEP de cidade inteira). */
export type CepAddress = {
  street: string;
  neighborhood: string;
  city: string;
  uf: string;
};

/** Só os 8 dígitos do CEP, sem máscara. */
export function cepDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 8);
}

export function isCepComplete(value: string): boolean {
  return cepDigits(value).length === 8;
}

/**
 * Consulta o CEP na base dos Correios. Usa a BrasilAPI (que consulta os
 * Correios e cai pra provedores alternativos) e, se falhar, o ViaCEP.
 * Lança se nenhuma das duas responder com um endereço válido.
 */
export async function lookupCep(value: string, signal?: AbortSignal): Promise<CepAddress> {
  const cep = cepDigits(value);
  if (cep.length !== 8) throw new Error("CEP incompleto.");

  try {
    const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`, { signal });
    if (res.ok) {
      const d = (await res.json()) as {
        street?: string;
        neighborhood?: string;
        city?: string;
        state?: string;
      };
      if (d.city && d.state) {
        return {
          street: d.street ?? "",
          neighborhood: d.neighborhood ?? "",
          city: d.city,
          uf: d.state,
        };
      }
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
  }

  const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal });
  const d = (await res.json()) as {
    erro?: boolean;
    logradouro?: string;
    bairro?: string;
    localidade?: string;
    uf?: string;
  };
  if (d.erro || !d.localidade || !d.uf) {
    throw new Error("CEP não encontrado. Confira o número digitado.");
  }
  return {
    street: d.logradouro ?? "",
    neighborhood: d.bairro ?? "",
    city: d.localidade,
    uf: d.uf,
  };
}
