import { Resend } from "resend";
import nodemailer from "nodemailer";

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
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Redefinição de senha</h2>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
      <p>
        <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#003087;color:#fff;text-decoration:none;border-radius:6px;">
          Redefinir senha
        </a>
      </p>
      <p>Este link expira em 1 hora. Se você não solicitou esta alteração, ignore este e-mail.</p>
    </div>
  `;
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
