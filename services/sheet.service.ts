import { prisma } from "@/lib/prisma";
import { calculateSheetTotals, type SheetInput, type SheetUpdateInput } from "@/schemas/sheet.schema";
import { Prisma } from "@prisma/client";

async function sumServicesForPeriod(
  employeeId: string,
  year: number,
  month: number,
) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const result = await prisma.service.aggregate({
    where: {
      employeeId,
      serviceDate: { gte: start, lte: end },
    },
    _sum: { totalValue: true },
  });

  return Number(result._sum.totalValue ?? 0);
}

export async function recalculateSheetForService(
  employeeId: string,
  serviceDate: Date,
) {
  const d = new Date(serviceDate);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;

  const sheet = await prisma.monthlySheet.findUnique({
    where: { employeeId_year_month: { employeeId, year, month } },
  });

  if (!sheet || sheet.status === "CLOSED") return;

  const grossTotal = await sumServicesForPeriod(employeeId, year, month);
  const { netTotal } = calculateSheetTotals(
    grossTotal,
    Number(sheet.percentage),
    Number(sheet.costAllowance),
    Number(sheet.voucher),
    Number(sheet.inss),
    Number(sheet.coparticipation),
    Number(sheet.otherDiscounts),
  );

  await prisma.monthlySheet.update({
    where: { id: sheet.id },
    data: { grossTotal, netTotal },
  });
}

export async function getOrCreateSheet(
  employeeId: string,
  year: number,
  month: number,
) {
  let sheet = await prisma.monthlySheet.findUnique({
    where: { employeeId_year_month: { employeeId, year, month } },
    include: {
      employee: true,
      history: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!sheet) {
    const employee = await prisma.employee.findUniqueOrThrow({
      where: { id: employeeId },
    });
    const grossTotal = await sumServicesForPeriod(employeeId, year, month);
    const percentage = Number(employee.defaultPercentage);
    const { netTotal } = calculateSheetTotals(grossTotal, percentage, 0, 0, 0, 0, 0);

    sheet = await prisma.monthlySheet.create({
      data: {
        employeeId,
        year,
        month,
        percentage,
        grossTotal,
        netTotal,
        status: "DRAFT",
      },
      include: {
        employee: true,
        history: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    await prisma.monthlySheetHistory.create({
      data: {
        sheetId: sheet.id,
        action: "CREATED",
        details: { year, month },
      },
    });
  }

  const services = await getSheetServices(employeeId, year, month);
  return { ...sheet, services };
}

async function getSheetServices(employeeId: string, year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);
  return prisma.service.findMany({
    where: { employeeId, serviceDate: { gte: start, lte: end } },
    orderBy: { serviceDate: "asc" },
  });
}

export async function listSheets(params: {
  year?: number;
  month?: number;
  employeeId?: string;
  status?: "DRAFT" | "CLOSED" | "REOPENED" | "ALL";
  page?: number;
  limit?: number;
}) {
  const { year, month, employeeId, status = "ALL", page = 1, limit = 20 } = params;
  const where: Prisma.MonthlySheetWhereInput = {};
  if (year) where.year = year;
  if (month) where.month = month;
  if (employeeId) where.employeeId = employeeId;
  if (status !== "ALL") where.status = status;

  const [items, total] = await Promise.all([
    prisma.monthlySheet.findMany({
      where,
      orderBy: [{ year: "desc" }, { month: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: { employee: { select: { id: true, name: true } } },
    }),
    prisma.monthlySheet.count({ where }),
  ]);

  return { items, total, page, limit };
}

export async function getSheet(id: string) {
  const sheet = await prisma.monthlySheet.findUnique({
    where: { id },
    include: {
      employee: true,
      history: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!sheet) return null;
  const services = await getSheetServices(sheet.employeeId, sheet.year, sheet.month);
  return { ...sheet, services };
}

export async function updateSheet(id: string, data: SheetUpdateInput) {
  const existing = await prisma.monthlySheet.findUniqueOrThrow({ where: { id } });
  if (existing.status === "CLOSED") {
    throw new Error("Folha fechada não pode ser editada. Reabra primeiro.");
  }

  const grossTotal = await sumServicesForPeriod(
    existing.employeeId,
    existing.year,
    existing.month,
  );

  const percentage = data.percentage ?? Number(existing.percentage);
  const costAllowance = data.costAllowance ?? Number(existing.costAllowance);
  const voucher = data.voucher ?? Number(existing.voucher);
  const inss = data.inss ?? Number(existing.inss);
  const coparticipation = data.coparticipation ?? Number(existing.coparticipation);
  const otherDiscounts = data.otherDiscounts ?? Number(existing.otherDiscounts);

  const { netTotal } = calculateSheetTotals(
    grossTotal,
    percentage,
    costAllowance,
    voucher,
    inss,
    coparticipation,
    otherDiscounts,
  );

  return prisma.monthlySheet.update({
    where: { id },
    data: { ...data, grossTotal, netTotal },
    include: { employee: true },
  });
}

export async function createSheet(data: SheetInput) {
  const existing = await prisma.monthlySheet.findUnique({
    where: {
      employeeId_year_month: {
        employeeId: data.employeeId,
        year: data.year,
        month: data.month,
      },
    },
  });
  if (existing) return getOrCreateSheet(data.employeeId, data.year, data.month);

  const grossTotal = await sumServicesForPeriod(data.employeeId, data.year, data.month);
  const { netTotal } = calculateSheetTotals(
    grossTotal,
    data.percentage,
    data.costAllowance ?? 0,
    data.voucher ?? 0,
    data.inss ?? 0,
    data.coparticipation ?? 0,
    data.otherDiscounts ?? 0,
  );

  const sheet = await prisma.monthlySheet.create({
    data: {
      ...data,
      grossTotal,
      netTotal,
    },
    include: { employee: true },
  });

  await prisma.monthlySheetHistory.create({
    data: { sheetId: sheet.id, action: "CREATED", details: data },
  });

  return sheet;
}

export async function closeSheet(id: string) {
  const sheet = await prisma.monthlySheet.update({
    where: { id },
    data: { status: "CLOSED" },
  });
  await prisma.monthlySheetHistory.create({
    data: { sheetId: id, action: "CLOSED" },
  });
  return sheet;
}

export async function reopenSheet(id: string) {
  const sheet = await prisma.monthlySheet.update({
    where: { id },
    data: { status: "REOPENED" },
  });
  await prisma.monthlySheetHistory.create({
    data: { sheetId: id, action: "REOPENED" },
  });
  return sheet;
}

export async function getPendingSheets() {
  const now = new Date();
  const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  return prisma.monthlySheet.findMany({
    where: {
      OR: [
        { status: "DRAFT" },
        { status: "REOPENED" },
        { year: prevYear, month: prevMonth, status: { not: "CLOSED" } },
      ],
    },
    include: { employee: { select: { name: true } } },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    take: 10,
  });
}
