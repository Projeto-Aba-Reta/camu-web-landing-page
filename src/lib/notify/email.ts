import "server-only";
import { Resend } from "resend";
import { formatBRL } from "@/lib/money";
import type { SaleEvent, SaleNotificationChannel } from "./types";

function subject(event: SaleEvent): string {
  const prefix = event.kind === "pet_miniature" ? "🐾 Miniatura de pet vendida" : "Venda confirmada";
  return `${prefix} — pedido #${event.orderCode}`;
}

function html(event: SaleEvent): string {
  const rows = [
    ["Pedido", `#${event.orderCode}`],
    ["Cliente", event.customerName ?? "—"],
    ["Itens", event.itemsSummary],
    ["Total", formatBRL(event.totalCents)],
  ];
  const rowsHtml = rows
    .map(([label, value]) => `<tr><td style="padding:4px 12px 4px 0;color:#666">${label}</td><td><strong>${value}</strong></td></tr>`)
    .join("");
  const previewHtml = event.previewImageUrl
    ? `<p><img src="${event.previewImageUrl}" alt="Prévia da miniatura" style="max-width:280px;border-radius:12px" /></p>`
    : "";
  return `<div style="font-family:sans-serif"><h2>Nova venda na Camu</h2><table>${rowsHtml}</table>${previewHtml}</div>`;
}

/** Canal de e-mail — implementação padrão via Resend. */
export const emailChannel: SaleNotificationChannel = {
  name: "email",
  async send(event) {
    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.SALE_NOTIFICATION_EMAIL_TO;
    const from = process.env.SALE_NOTIFICATION_EMAIL_FROM || "Camu <vendas@camu.com.br>";
    if (!apiKey || !to) {
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
