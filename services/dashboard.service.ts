import { prisma } from "@/lib/prisma";
import { getActiveEmployeesCount } from "@/services/employee.service";
import { getPendingSheets } from "@/services/sheet.service";

export async function getDashboardStats() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const [
    activeEmployees,
    monthServices,
    recentServices,
    pendingSheets,
  ] = await Promise.all([
    getActiveEmployeesCount(),
    prisma.service.findMany({
      where: { serviceDate: { gte: start, lte: end } },
      select: { totalValue: true, serviceNumber: true },
    }),
    prisma.service.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { employee: { select: { name: true } } },
    }),
    getPendingSheets(),
  ]);

  const grossTotal = monthServices.reduce((acc, s) => acc + Number(s.totalValue), 0);
  const uniqueServiceNumbers = new Set(monthServices.map((s) => s.serviceNumber)).size;

  const employees = await prisma.employee.findMany({
    where: { status: "ACTIVE" },
    select: { defaultPercentage: true },
  });
  const avgPercentage =
    employees.length > 0
      ? employees.reduce((acc, e) => acc + Number(e.defaultPercentage), 0) / employees.length
      : 0;
  const estimatedNet = grossTotal * (avgPercentage / 100);

  return {
    activeEmployees,
    totalServices: monthServices.length,
    grossTotal,
    estimatedNet,
    uniqueServiceNumbers,
    recentServices,
    pendingSheets,
  };
}

export async function getChartData() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const services = await prisma.service.findMany({
    where: { serviceDate: { gte: sixMonthsAgo } },
    select: { serviceDate: true, totalValue: true },
  });

  const grouped = new Map<string, { count: number; total: number }>();
  for (const s of services) {
    const d = new Date(s.serviceDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const current = grouped.get(key) ?? { count: 0, total: 0 };
    current.count += 1;
    current.total += Number(s.totalValue);
    grouped.set(key, current);
  }

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, data]) => {
      const [year, month] = key.split("-");
      return { year: Number(year), month: Number(month), ...data };
    });
}
