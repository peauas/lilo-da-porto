import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/auth-helpers";
import { getDashboardStats, getChartData } from "@/services/dashboard.service";
import { getMonthStats } from "@/services/service.service";

export async function GET(request: NextRequest) {
  const authUser = await requireApiAuth(request);
  if (!authUser) return apiError("UNAUTHORIZED", "Não autorizado", 401);

  const year = request.nextUrl.searchParams.get("year");
  const month = request.nextUrl.searchParams.get("month");

  if (year && month) {
    const stats = await getMonthStats(Number(year), Number(month), authUser.userId);
    return apiSuccess(stats);
  }

  const [stats, chartData] = await Promise.all([
    getDashboardStats(authUser.userId),
    getChartData(authUser.userId),
  ]);

  return apiSuccess({ ...stats, chartData });
}
