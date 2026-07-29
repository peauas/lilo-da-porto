import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/auth-helpers";
import { forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } from "@/schemas/auth.schema";
import { prisma } from "@/lib/prisma";
import { getAppUrl } from "@/lib/app-url";
import { sendPasswordResetEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "crypto";
import { auth } from "@/lib/auth";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const action = body.action as string;

  if (action === "forgot") {
    const rateLimited = await checkRateLimit(request, "auth-forgot", 5, 15 * 60 * 1000);
    if (rateLimited) return rateLimited;

    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "E-mail inválido", 400);
    }

    const email = parsed.data.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const rawToken = randomBytes(32).toString("hex");
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: hashToken(rawToken),
          expiresAt: new Date(Date.now() + 3600000),
        },
      });

      const resetUrl = `${getAppUrl()}/reset-password/${rawToken}`;
      const { sent } = await sendPasswordResetEmail(user.email, resetUrl);

      // Dev convenience only when there's no real e-mail provider configured
      // to actually deliver the link.
      if (process.env.NODE_ENV === "development" && !sent) {
        return apiSuccess({
          message: "Link de recuperação gerado (dev)",
          resetUrl: `/reset-password/${rawToken}`,
        });
      }
    }

    return apiSuccess({
      message: "Se o e-mail existir, você receberá instruções de recuperação.",
    });
  }

  if (action === "reset") {
    const rateLimited = await checkRateLimit(request, "auth-reset", 10, 15 * 60 * 1000);
    if (rateLimited) return rateLimited;

    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Dados inválidos", 400);
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: hashToken(parsed.data.token) },
      include: { user: true },
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      return apiError("INVALID_TOKEN", "Token inválido ou expirado", 400);
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash, passwordChangedAt: new Date() },
    });
    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });

    return apiSuccess({ message: "Senha alterada com sucesso" });
  }

  if (action === "change") {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("UNAUTHORIZED", "Não autorizado", 401);
    }

    const rateLimited = await checkRateLimit(request, `auth-change:${session.user.id}`, 5, 15 * 60 * 1000);
    if (rateLimited) return rateLimited;

    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Dados inválidos", 400);
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
    });

    const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!valid) {
      return apiError("INVALID_PASSWORD", "Senha atual incorreta", 400);
    }

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordChangedAt: new Date() },
    });

    return apiSuccess({ message: "Senha alterada com sucesso" });
  }

  return apiError("INVALID_ACTION", "Ação inválida", 400);
}
