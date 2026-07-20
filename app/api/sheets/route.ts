import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/auth-helpers";
import { sheetQuerySchema, sheetSchema } from "@/schemas/sheet.schema";
import { createSheet, getOrCreateSheet, listSheets } from "@/services/sheet.service";

export async function GET(request: NextRequest) {
  const authUser = await requireApiAuth(request);
  if (!authUser) return apiError("UNAUTHORIZED", "Não autorizado", 401);

  const params = Object.fromEntries(request.nextUrl.searchParams);

  if (params.employeeId && params.year && params.month) {
    try {
      const sheet = await getOrCreateSheet(
        params.employeeId,
        Number(params.year),
        Number(params.month),
        authUser.userId,
      );
      return apiSuccess(sheet);
    } catch (error) {
      if (error instanceof Error && error.message === "NOT_FOUND") {
        return apiError("NOT_FOUND", "Funcionário não encontrado", 404);
      }
      return apiError("INTERNAL_ERROR", "Erro ao carregar folha", 500);
    }
  }

  const parsed = sheetQuerySchema.safeParse(params);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Parâmetros inválidos", 400);
  }

  const result = await listSheets({ ...parsed.data, userId: authUser.userId });
  return apiSuccess(result.items, 200, { total: result.total });
}

export async function POST(request: NextRequest) {
  const authUser = await requireApiAuth(request);
  if (!authUser) return apiError("UNAUTHORIZED", "Não autorizado", 401);

  try {
    const body = await request.json();
    const parsed = sheetSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Dados inválidos", 400, parsed.error.flatten());
    }
    const sheet = await createSheet(parsed.data, authUser.userId);
    return apiSuccess(sheet, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return apiError("NOT_FOUND", "Funcionário não encontrado", 404);
    }
    return apiError("INTERNAL_ERROR", "Erro ao criar folha", 500);
  }
}
