import { auth } from "@/lib/auth";
import { createExtensionToken } from "@/lib/auth-helpers";
import { apiError, apiSuccess } from "@/lib/api-response";
import { loginSchema } from "@/schemas/auth.schema";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Dados inválidos", 400, parsed.error.flatten());
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (!user) {
      return apiError("INVALID_CREDENTIALS", "E-mail ou senha incorretos", 401);
    }

    const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!valid) {
      return apiError("INVALID_CREDENTIALS", "E-mail ou senha incorretos", 401);
    }

    const token = await createExtensionToken(user.id);
    return apiSuccess({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch {
    return apiError("INTERNAL_ERROR", "Erro interno", 500);
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return apiError("UNAUTHORIZED", "Não autorizado", 401);
  }
  const token = await createExtensionToken(session.user.id);
  return apiSuccess({ token, user: session.user });
}
