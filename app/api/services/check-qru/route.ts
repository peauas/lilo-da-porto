import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/auth-helpers";
import { checkServiceNumberSchema } from "@/schemas/service.schema";
import { checkDuplicateServiceNumber } from "@/services/service.service";

export async function POST(request: NextRequest) {
  const authUser = await requireApiAuth(request);
  if (!authUser) return apiError("UNAUTHORIZED", "Não autorizado", 401);

  const body = await request.json();
  const parsed = checkServiceNumberSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Dados inválidos", 400);
  }

  const duplicate = await checkDuplicateServiceNumber(
    parsed.data.employeeId,
    parsed.data.serviceNumber.trim(),
    authUser.userId,
    parsed.data.excludeId,
  );

  return apiSuccess({ exists: !!duplicate, service: duplicate });
}
