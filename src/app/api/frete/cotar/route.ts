import type { NextRequest } from "next/server";
import { quoteFrete } from "@/lib/shipping/melhor-envio";

/**
 * Cotação de frete para exibir no carrinho/checkout (entregas fora do Sul e
 * Sudeste). O token do Melhor Envio fica só no servidor. O valor cobrado é
 * recalculado de novo em `createOrder` — esta rota é só pra UI.
 *
 * Body: { cep: string, itemCount?: number, insuranceValueReais?: number }
 * 200:  { ok: true, freteCents, service, carrier, prazoDias }
 *       | { ok: false, error }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      cep?: string;
      itemCount?: number;
      insuranceValueReais?: number;
    };

    const quote = await quoteFrete({
      toCep: String(body.cep ?? ""),
      itemCount: Number(body.itemCount ?? 1),
      insuranceValueReais: Number(body.insuranceValueReais ?? 0),
    });

    return Response.json({
      ok: true,
      freteCents: quote.cents,
      service: quote.service,
      carrier: quote.carrier,
      prazoDias: quote.prazoDias,
    });
  } catch (err) {
    return Response.json({
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao calcular frete.",
    });
  }
}
