import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/auth-helpers";
import { sheetUpdateSchema } from "@/schemas/sheet.schema";
import { closeSheet, getSheet, reopenSheet, updateSheet } from "@/services/sheet.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const authUser = await requireApiAuth(_request);
  if (!authUser) return apiError("UNAUTHORIZED", "Não autorizado", 401);

  const { id } = await params;
  const sheet = await getSheet(id, authUser.userId);
  if (!sheet) return apiError("NOT_FOUND", "Folha não encontrada", 404);
  return apiSuccess(sheet);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const authUser = await requireApiAuth(request);
  if (!authUser) return apiError("UNAUTHORIZED", "Não autorizado", 401);

  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = sheetUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Dados inválidos", 400, parsed.error.flatten());
    }
    const sheet = await updateSheet(id, parsed.data, authUser.userId);
    return apiSuccess(sheet);
  } catch (error) {
    return apiError(
      "UPDATE_ERROR",
      error instanceof Error ? error.message : "Erro ao atualizar folha",
      400,
    );
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  const authUser = await requireApiAuth(request);
  if (!authUser) return apiError("UNAUTHORIZED", "Não autorizado", 401);

  const { id } = await params;
  const body = await request.json();
  const action = body.action as string;

  try {
    if (action === "close") {
      const sheet = await closeSheet(id, authUser.userId);
      return apiSuccess(sheet);
    }
    if (action === "reopen") {
      const sheet = await reopenSheet(id, authUser.userId);
      return apiSuccess(sheet);
    }
    return apiError("INVALID_ACTION", "Ação inválida", 400);
  } catch {
    return apiError("INTERNAL_ERROR", "Erro na operação", 500);
  }
}
