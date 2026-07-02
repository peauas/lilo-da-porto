import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/auth-helpers";
import { checkQruSchema } from "@/schemas/service.schema";
import { checkDuplicateQru } from "@/services/service.service";

export async function POST(request: NextRequest) {
  const authUser = await requireApiAuth(request);
  if (!authUser) return apiError("UNAUTHORIZED", "Não autorizado", 401);

  const body = await request.json();
  const parsed = checkQruSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Dados inválidos", 400);
  }

  const duplicate = await checkDuplicateQru(
    parsed.data.employeeId,
    parsed.data.qru.trim(),
    parsed.data.excludeId,
  );

  return apiSuccess({ exists: !!duplicate, service: duplicate });
}
