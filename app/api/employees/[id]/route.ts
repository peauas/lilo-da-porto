import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/auth-helpers";
import { employeeUpdateSchema } from "@/schemas/employee.schema";
import {
  deleteEmployee,
  getEmployee,
  updateEmployee,
} from "@/services/employee.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const authUser = await requireApiAuth(_request);
  if (!authUser) return apiError("UNAUTHORIZED", "Não autorizado", 401);

  const { id } = await params;
  const employee = await getEmployee(id);
  if (!employee) return apiError("NOT_FOUND", "Funcionário não encontrado", 404);
  return apiSuccess(employee);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const authUser = await requireApiAuth(request);
  if (!authUser) return apiError("UNAUTHORIZED", "Não autorizado", 401);

  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = employeeUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Dados inválidos", 400, parsed.error.flatten());
    }
    const employee = await updateEmployee(id, parsed.data);
    return apiSuccess(employee);
  } catch {
    return apiError("INTERNAL_ERROR", "Erro ao atualizar funcionário", 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const authUser = await requireApiAuth(_request);
  if (!authUser) return apiError("UNAUTHORIZED", "Não autorizado", 401);

  const { id } = await params;
  try {
    await deleteEmployee(id);
    return apiSuccess({ deleted: true });
  } catch {
    return apiError("INTERNAL_ERROR", "Erro ao excluir funcionário", 500);
  }
}
