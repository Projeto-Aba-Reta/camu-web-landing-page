import "server-only";
import { formatBRL } from "@/lib/money";
import type { SaleEvent, SaleNotificationChannel } from "./types";

function text(event: SaleEvent): string {
  const emoji = event.kind === "pet_miniature" ? "🐾" : "🛒";
  const lines = [
    `${emoji} *Nova venda na Camu* — pedido \`#${event.orderCode}\``,
    `*Cliente:* ${event.customerName ?? "—"}`,
    `*Itens:* ${event.itemsSummary || "—"}`,
    `*Total:* ${formatBRL(event.totalCents)}`,
  ];
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

    const blocks = [
      {
        type: "section",
        text: { type: "mrkdwn", text: text(event) },
      },
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
      body: JSON.stringify({ text: text(event), blocks }),
    });
    if (!res.ok) {
      throw new Error(`Slack respondeu ${res.status}: ${await res.text()}`);
    }
  },
};
