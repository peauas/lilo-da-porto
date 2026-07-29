import { Resend } from "resend";
import nodemailer from "nodemailer";
import { getAppUrl } from "@/lib/app-url";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const resendFrom = process.env.RESEND_FROM_EMAIL ?? "Lilo da Porto <onboarding@resend.dev>";

// SMTP fallback (e.g. Gmail with an App Password) for setups without a
// domain to verify with Resend. Gmail rejects a "from" address that isn't
// the authenticated account, so the SMTP path always sends as SMTP_USER.
const smtpTransport =
  process.env.SMTP_USER && process.env.SMTP_PASS
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST ?? "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT ?? 465),
        secure: (process.env.SMTP_SECURE ?? "true") === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    : null;
const smtpFrom = `${process.env.SMTP_FROM_NAME ?? "Lilo da Porto"} <${process.env.SMTP_USER}>`;

function passwordResetHtml(resetUrl: string): string {
  const logoUrl = `${getAppUrl()}/logo-lockup.png`;
  const fontStack =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Redefinição de senha</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f1f5f9; font-family:${fontStack};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background-color:#ffffff; border-radius:16px; border:1px solid #e6eaf1; overflow:hidden;">
            <tr>
              <td align="center" style="padding:40px 40px 8px 40px;">
                <img src="${logoUrl}" width="141" height="52" alt="Lilo da Porto" style="display:block;" />
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:16px 40px 0 40px;">
                <h1 style="margin:0; font-size:21px; line-height:1.3; font-weight:700; color:#0b1220;">
                  Redefinição de senha
                </h1>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:12px 40px 0 40px;">
                <p style="margin:0; font-size:14px; line-height:1.6; color:#64748b;">
                  Recebemos uma solicitação para redefinir a senha da sua conta no Lilo da Porto.
                  Clique no botão abaixo para criar uma nova senha.
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:28px 40px 0 40px;">
                <a href="${resetUrl}" style="display:inline-block; padding:12px 32px; background-color:#1470ef; color:#ffffff; font-size:14px; font-weight:600; text-decoration:none; border-radius:10px;">
                  Redefinir senha
                </a>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:20px 40px 0 40px;">
                <p style="margin:0; font-size:12.5px; line-height:1.6; color:#94a3b8;">
                  Este link expira em 1 hora. Se você não solicitou esta alteração, pode ignorar
                  este e-mail com segurança.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 40px 0 40px;">
                <div style="border-top:1px solid #e6eaf1;"></div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:20px 40px 32px 40px;">
                <p style="margin:0; font-size:12px; color:#94a3b8;">Lilo da Porto</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
): Promise<{ sent: boolean }> {
  const subject = "Redefinição de senha - Lilo da Porto";
  const html = passwordResetHtml(resetUrl);

  if (resend) {
    const { error } = await resend.emails.send({ from: resendFrom, to, subject, html });
    if (!error) return { sent: true };
    console.error("[email] Falha ao enviar via Resend:", error);
  }

  if (smtpTransport) {
    try {
      await smtpTransport.sendMail({ from: smtpFrom, to, subject, html });
      return { sent: true };
    } catch (err) {
      console.error("[email] Falha ao enviar via SMTP:", err);
    }
  }

  if (process.env.NODE_ENV === "production") {
    console.error(
      "[email] Nenhum provedor de e-mail configurado (RESEND_API_KEY ou SMTP_USER/SMTP_PASS) — e-mail de recuperação de senha não foi enviado.",
    );
  }
  return { sent: false };
}
