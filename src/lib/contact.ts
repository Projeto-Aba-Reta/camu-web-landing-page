/** Validação e máscara de telefone/e-mail usadas no client (formulários da
 *  loja) e revalidadas no servidor. Sem `server-only` de propósito. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim().toLowerCase());
}

type ParsedPhone = { country: string; area: string; sub: string };

/** Quebra a entrada em país (55, opcional), DDD (2 dígitos, ou 3 com zero à
 *  frente) e número (8 ou 9 dígitos). Tolerante a entrada parcial. */
function parsePhone(input: string): ParsedPhone {
  const hasPlus = input.trimStart().startsWith("+");
  let digits = input.replace(/\D/g, "");
  let country = "";

  if ((hasPlus || digits.length > 12) && digits.startsWith("55")) {
    country = "55";
    digits = digits.slice(2);
  }

  const areaLen = digits.startsWith("0") ? 3 : 2;
  const area = digits.slice(0, areaLen);
  const sub = digits.slice(areaLen, areaLen + 9);
  return { country, area, sub };
}

/** Aplica a máscara +55 (11) 91258-1464 conforme o usuário digita. */
export function formatPhone(input: string): string {
  const { country, area, sub } = parsePhone(input);
  if (!area) return country ? "+55 " : "";

  let out = country ? "+55 " : "";
  out += `(${area}`;
  if (area.length < 2) return out;
  out += ") ";

  if (!sub) return out;
  if (sub.length <= 4) return out + sub;
  return `${out}${sub.slice(0, sub.length - 4)}-${sub.slice(-4)}`;
}

/** Aceita: +55 (11) 91258-1464, +55 (011) 91258-1464, (11) 91258-1464,
 *  (011) 91258-1464 e equivalentes só com dígitos. */
export function isValidPhone(input: string): boolean {
  const { area, sub } = parsePhone(input);
  const areaOk =
    (area.length === 2 && !area.startsWith("0")) ||
    (area.length === 3 && area.startsWith("0"));
  const subOk = sub.length === 8 || sub.length === 9;
  return areaOk && subOk;
}
