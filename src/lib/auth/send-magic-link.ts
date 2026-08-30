import "server-only";
import { Resend } from "resend";

/** Envia o e-mail com o magic link de acesso à conta. Reusa a mesma dep/chave
 *  Resend das notificações de venda (ver src/lib/notify/email.ts). */
export async function sendMagicLinkEmail(email: string, url: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.MAGIC_LINK_EMAIL_FROM ||
    process.env.SALE_NOTIFICATION_EMAIL_FROM ||
    "Camu <contato@camu.com.br>";
  if (!apiKey) {
    throw new Error(
      "Envio de e-mail não configurado: defina RESEND_API_KEY em .env.local",
    );
  }

  const html = `
    <div style="font-family:sans-serif;max-width:440px;margin:0 auto;color:#1b1f1e">
      <h2 style="font-size:20px">Seu acesso à conta Camu</h2>
      <p style="color:#555;line-height:1.5">
        Clique no botão abaixo pra entrar e acompanhar seus pedidos. O link vale
        por 20 minutos e só funciona uma vez.
      </p>
      <p style="margin:24px 0">
        <a href="${url}"
           style="background:#0FBFA0;color:#1b1f1e;font-weight:bold;text-decoration:none;
                  padding:14px 28px;border-radius:999px;border:3px solid #1b1f1e;display:inline-block">
          Entrar na minha conta
        </a>
      </p>
      <p style="color:#888;font-size:12px;word-break:break-all">
        Se o botão não abrir, copie este endereço no navegador:<br />${url}
      </p>
      <p style="color:#888;font-size:12px">
        Não pediu esse acesso? Pode ignorar este e-mail.
      </p>
    </div>`;

  const replyTo = process.env.EMAIL_REPLY_TO;
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: email,
    ...(replyTo ? { replyTo } : {}),
    subject: "Seu acesso à conta Camu",
    html,
  });
  if (error) throw new Error(error.message);
}
