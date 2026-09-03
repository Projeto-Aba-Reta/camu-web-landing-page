import "server-only";
import { formatBRL } from "@/lib/money";
import { fullAddress, paymentMethodLabel, variantLabel } from "./format";
import type { SaleEvent, SaleNotificationChannel } from "./types";

function text(event: SaleEvent): string {
  const emoji = event.kind === "pet_miniature" ? "🐾" : "🛒";
  // Menção opcional no Slack: use o ID, não o nome — ex. `<@U012ABCDEF>`,
  // `<!subteam^S012ABC>`, `<!here>`. Configure SALE_NOTIFICATION_SLACK_MENTION.
  const mention = process.env.SALE_NOTIFICATION_SLACK_MENTION?.trim();
  const created = event.createdAt
    ? new Date(event.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
    : "—";

  const itemLines = event.items
    .map(
      (it) =>
        `  • ${it.name}${it.variant ? ` — ${variantLabel(it.variant)}` : ""} ×${it.qty} — ${formatBRL(it.unitPriceCents)}`,
    )
    .join("\n");

  const lines = [
    `${emoji} *Nova venda na Camu* — pedido \`#${event.orderCode}\`${mention ? ` ${mention}` : ""}`,
    `*Data:* ${created}`,
    `*Pagamento:* ${paymentMethodLabel(event.paymentMethod)} · ${event.paymentStatus}`,
    "",
    `*Nome:* ${event.customer.name ?? "—"}`,
    `*E-mail:* ${event.customer.email ?? "—"}`,
    `*Telefone:* ${event.customer.phone ?? "—"}`,
    `*Endereço:* ${fullAddress(event.shippingAddress) || "—"}`,
    "",
    `*Itens:*\n${itemLines || "  —"}`,
    `*Subtotal:* ${formatBRL(event.subtotalCents)}  |  *Frete:* ${formatBRL(event.shippingCents)}  |  *Total:* ${formatBRL(event.totalCents)}`,
  ];

  if (event.petMiniature) {
    lines.push(
      "",
      `*Encomenda:* \`#${event.petMiniature.requestId}\``,
      `*Variante:* ${variantLabel(event.petMiniature.selectedVariant)}`,
      `*Fotos enviadas:* ${event.petMiniature.photoCount}`,
    );
  }

  return lines.join("\n");
}

/** Canal do Slack — posta via Incoming Webhook (App do Slack).
 *  Configure `SALE_NOTIFICATION_SLACK_WEBHOOK_URL` no .env.local. Ver
 *  `docs/notificacao-slack.md`. */
export const slackChannel: SaleNotificationChannel = {
  name: "slack",
  async send(event) {
    const webhookUrl = process.env.SALE_NOTIFICATION_SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error(
        "Canal do Slack não configurado: defina SALE_NOTIFICATION_SLACK_WEBHOOK_URL em .env.local",
      );
    }

    const body = text(event);
    const blocks = [
      { type: "section", text: { type: "mrkdwn", text: body } },
      ...(event.previewImageUrl
        ? [
            {
              type: "image" as const,
              image_url: event.previewImageUrl,
              alt_text: "Prévia da miniatura",
            },
          ]
        : []),
    ];

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: body, blocks }),
    });
    if (!res.ok) {
      throw new Error(`Slack respondeu ${res.status}: ${await res.text()}`);
    }
  },
};
