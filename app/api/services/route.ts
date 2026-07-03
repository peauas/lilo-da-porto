import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireApiAuth, checkRateLimit } from "@/lib/auth-helpers";
import { serviceQuerySchema, serviceSchema } from "@/schemas/service.schema";
import {
  checkDuplicateServiceNumber,
  createService,
  getServicesGroupedByYearMonth,
  listServices,
} from "@/services/service.service";

export async function GET(request: NextRequest) {
  const authUser = await requireApiAuth(request);
  if (!authUser) return apiError("UNAUTHORIZED", "Não autorizado", 401);

  const params = Object.fromEntries(request.nextUrl.searchParams);
  if (params.grouped === "true") {
    const grouped = await getServicesGroupedByYearMonth();
    return apiSuccess(grouped);
  }

  const parsed = serviceQuerySchema.safeParse(params);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Parâmetros inválidos", 400);
  }

  const result = await listServices(parsed.data);
  return apiSuccess(result.items, 200, { total: result.total, page: result.page });
}

export async function POST(request: NextRequest) {
  const authUser = await requireApiAuth(request);
  if (!authUser) return apiError("UNAUTHORIZED", "Não autorizado", 401);

  const rateLimited = await checkRateLimit(request, "services", 100, 60000);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const parsed = serviceSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Dados inválidos", 400, parsed.error.flatten());
    }

    const duplicate = await checkDuplicateServiceNumber(
      parsed.data.employeeId,
      parsed.data.serviceNumber.trim(),
    );
    if (duplicate) {
      return apiError("DUPLICATE_SERVICE", "Número de serviço já existe para este funcionário", 409, duplicate);
    }

    const service = await createService(parsed.data);
    return apiSuccess(service, 201);
  } catch {
    return apiError("INTERNAL_ERROR", "Erro ao criar serviço", 500);
  }
}
