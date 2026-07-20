import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/auth-helpers";
import { serviceUpdateSchema } from "@/schemas/service.schema";
import {
  checkDuplicateQru,
  deleteService,
  getService,
  updateService,
} from "@/services/service.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const authUser = await requireApiAuth(_request);
  if (!authUser) return apiError("UNAUTHORIZED", "Não autorizado", 401);

  const { id } = await params;
  const service = await getService(id, authUser.userId);
  if (!service) return apiError("NOT_FOUND", "Serviço não encontrado", 404);
  return apiSuccess(service);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const authUser = await requireApiAuth(request);
  if (!authUser) return apiError("UNAUTHORIZED", "Não autorizado", 401);

  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = serviceUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Dados inválidos", 400, parsed.error.flatten());
    }

    if (parsed.data.qru && parsed.data.employeeId) {
      const duplicate = await checkDuplicateQru(
        parsed.data.employeeId,
        parsed.data.qru.trim(),
        authUser.userId,
        id,
      );
      if (duplicate) {
        return apiError("DUPLICATE_QRU", "QRU já existe", 409, duplicate);
      }
    }

    const service = await updateService(id, parsed.data, authUser.userId);
    return apiSuccess(service);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return apiError("NOT_FOUND", "Serviço não encontrado", 404);
    }
    return apiError("INTERNAL_ERROR", "Erro ao atualizar serviço", 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const authUser = await requireApiAuth(_request);
  if (!authUser) return apiError("UNAUTHORIZED", "Não autorizado", 401);

  const { id } = await params;
  try {
    await deleteService(id, authUser.userId);
    return apiSuccess({ deleted: true });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return apiError("NOT_FOUND", "Serviço não encontrado", 404);
    }
    return apiError("INTERNAL_ERROR", "Erro ao excluir serviço", 500);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  return PATCH(request, { params });
}
