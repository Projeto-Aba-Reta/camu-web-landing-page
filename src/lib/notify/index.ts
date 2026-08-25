import "server-only";
import { emailChannel } from "./email";
import type { SaleEvent, SaleNotificationChannel } from "./types";

export type { SaleEvent, SaleNotificationChannel };

/** Canais ativos. Pra adicionar um novo (Slack, webhook…), implemente
 *  `SaleNotificationChannel` e inclua a instância aqui — o ponto de disparo
 *  (`notifySaleChannels`) não muda. */
const CHANNELS: SaleNotificationChannel[] = [emailChannel];

/**
 * Dispara o evento de venda em todos os canais ativos, em paralelo. A falha
 * de um canal é logada mas nunca interrompe os demais nem o fluxo do pedido
 * — notificação é best-effort, não faz parte do caminho crítico da compra.
 */
export async function notifySaleChannels(event: SaleEvent): Promise<void> {
  await Promise.all(
    CHANNELS.map(async (channel) => {
      try {
        await channel.send(event);
      } catch (err) {
        console.error(`[notify:${channel.name}]`, err);
      }
    }),
  );
}
