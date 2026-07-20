import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireApiAuth, checkRateLimit } from "@/lib/auth-helpers";
import { employeeQuerySchema, employeeSchema } from "@/schemas/employee.schema";
import { createEmployee, listEmployees } from "@/services/employee.service";

export async function GET(request: NextRequest) {
  const authUser = await requireApiAuth(request);
  if (!authUser) return apiError("UNAUTHORIZED", "Não autorizado", 401);

  const rateLimited = await checkRateLimit(request, "employees", 100, 60000);
  if (rateLimited) return rateLimited;

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = employeeQuerySchema.safeParse(params);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Parâmetros inválidos", 400);
  }

  const result = await listEmployees({ ...parsed.data, userId: authUser.userId });
  return apiSuccess(result.items, 200, {
    page: result.page,
    total: result.total,
    totalPages: result.totalPages,
  });
}

export async function POST(request: NextRequest) {
  const authUser = await requireApiAuth(request);
  if (!authUser) return apiError("UNAUTHORIZED", "Não autorizado", 401);

  try {
    const body = await request.json();
    const parsed = employeeSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Dados inválidos", 400, parsed.error.flatten());
    }

    const employee = await createEmployee(parsed.data, authUser.userId);
    return apiSuccess(employee, 201);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "P2002") {
      return apiError("DUPLICATE_CPF", "CPF já cadastrado", 409);
    }
    if (code === "P2003") {
      return apiError("SESSION_EXPIRED", "Sessão inválida. Faça login novamente.", 401);
    }
    console.error("[v0] Erro ao criar funcionário:", error);
    return apiError("INTERNAL_ERROR", "Erro ao criar funcionário", 500);
  }
}
