import "server-only";
import { Resend } from "resend";
import { formatBRL } from "@/lib/money";
import { fullAddress, paymentMethodLabel, variantLabel } from "./format";
import type { SaleEvent, SaleNotificationChannel } from "./types";

function subject(event: SaleEvent): string {
  const prefix = event.kind === "pet_miniature" ? "🐾 Miniatura de pet vendida" : "Venda confirmada";
  return `${prefix} — pedido #${event.orderCode}`;
}

function row(label: string, value: string): string {
  return `<tr><td style="padding:4px 16px 4px 0;color:#666;vertical-align:top;white-space:nowrap">${label}</td><td><strong>${value || "—"}</strong></td></tr>`;
}

function html(event: SaleEvent): string {
  const created = event.createdAt
    ? new Date(event.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
    : "—";

  const itemsRows = event.items
    .map(
      (it) =>
        `<tr><td style="padding:2px 12px 2px 0">${it.name}${it.variant ? ` — ${variantLabel(it.variant)}` : ""}</td>` +
        `<td style="padding:2px 12px 2px 0;text-align:center">×${it.qty}</td>` +
        `<td style="padding:2px 0;text-align:right">${formatBRL(it.unitPriceCents)}</td></tr>`,
    )
    .join("");

  const dados = [
    row("Pedido", `#${event.orderCode}`),
    row("Data", created),
    row("Pagamento", `${paymentMethodLabel(event.paymentMethod)} · ${event.paymentStatus}`),
    row("Nome", event.customer.name ?? ""),
    row("E-mail", event.customer.email ?? ""),
    row("Telefone", event.customer.phone ?? ""),
    row("Endereço", fullAddress(event.shippingAddress)),
  ];

  if (event.petMiniature) {
    const pm = event.petMiniature;
    dados.push(
      row("Encomenda", `#${pm.requestId}`),
      row("Miniaturas no pedido", String(pm.requestCount)),
      row("Variante", pm.selectedVariant === "Variadas" ? "Variadas" : variantLabel(pm.selectedVariant)),
      row("Fotos enviadas", String(pm.photoCount)),
    );
  }

  const previewHtml = event.previewImageUrl
    ? `<p><img src="${event.previewImageUrl}" alt="Prévia da miniatura" style="max-width:280px;border-radius:12px" /></p>`
    : "";

  return `<div style="font-family:sans-serif;color:#1b1f1e;max-width:560px">
    <h2>Nova venda na Camu</h2>
    <table style="border-collapse:collapse">${dados.join("")}</table>
    <h3 style="margin-top:24px">Itens</h3>
    <table style="border-collapse:collapse">${itemsRows}</table>
    <table style="border-collapse:collapse;margin-top:12px">
      ${row("Subtotal", formatBRL(event.subtotalCents))}
      ${row("Frete", formatBRL(event.shippingCents))}
      ${event.discountCents > 0 ? row("Desconto", `−${formatBRL(event.discountCents)}`) : ""}
      ${row("Total", formatBRL(event.totalCents))}
    </table>
    ${previewHtml}
  </div>`;
}

/** Canal de e-mail — implementação padrão via Resend. */
export const emailChannel: SaleNotificationChannel = {
  name: "email",
  async send(event) {
    const apiKey = process.env.RESEND_API_KEY;
    // Aceita uma lista separada por vírgula (ex.: caixa da loja + Gmail da Camu).
    const to = (process.env.SALE_NOTIFICATION_EMAIL_TO ?? "")
      .split(",")
      .map((addr) => addr.trim())
      .filter(Boolean);
    const from = process.env.SALE_NOTIFICATION_EMAIL_FROM || "Camu <vendas@camu.com.br>";
    if (!apiKey || to.length === 0) {
      throw new Error(
        "Canal de e-mail não configurado: defina RESEND_API_KEY e SALE_NOTIFICATION_EMAIL_TO em .env.local",
      );
    }

    const replyTo = process.env.EMAIL_REPLY_TO;
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      ...(replyTo ? { replyTo } : {}),
      subject: subject(event),
      html: html(event),
    });
    if (error) throw new Error(error.message);
  },
};
