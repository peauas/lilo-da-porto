import { prisma } from "@/lib/prisma";
import type { ServiceInput, ServiceUpdateInput } from "@/schemas/service.schema";
import { recalculateSheetForService } from "@/services/sheet.service";
import { Prisma } from "@prisma/client";

function computeTotal(base: number, additional: number) {
  return base + additional;
}

async function assertEmployeeOwnership(employeeId: string, userId: string) {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, userId },
    select: { id: true },
  });
  if (!employee) throw new Error("NOT_FOUND");
}

export async function listServices(params: {
  userId: string;
  year?: number;
  month?: number;
  employeeId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const { userId, year, month, employeeId, search, page = 1, limit = 50 } = params;
  const where: Prisma.ServiceWhereInput = { userId };

  if (employeeId) where.employeeId = employeeId;
  if (year && month) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    where.serviceDate = { gte: start, lte: end };
  }
  if (search) {
    where.OR = [
      { qru: { contains: search, mode: "insensitive" } },
      { serviceNumber: { contains: search, mode: "insensitive" } },
      { employee: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.service.findMany({
      where,
      orderBy: [{ serviceDate: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: { employee: { select: { id: true, name: true } } },
    }),
    prisma.service.count({ where }),
  ]);

  return { items, total, page, limit };
}

export async function getService(id: string, userId: string) {
  return prisma.service.findFirst({
    where: { id, userId },
    include: { employee: true },
  });
}

export async function checkDuplicateServiceNumber(
  employeeId: string,
  serviceNumber: string,
  userId: string,
  excludeId?: string,
) {
  return prisma.service.findFirst({
    where: {
      userId,
      employeeId,
      serviceNumber,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    include: { employee: { select: { name: true } } },
  });
}

export async function checkDuplicateQru(
  employeeId: string,
  qru: string,
  userId: string,
  excludeId?: string,
) {
  return prisma.service.findFirst({
    where: {
      userId,
      employeeId,
      qru,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    include: { employee: { select: { name: true } } },
  });
}

export async function createService(data: ServiceInput, userId: string) {
  await assertEmployeeOwnership(data.employeeId, userId);

  const totalValue = computeTotal(data.baseValue, data.additionalValue ?? 0);
  const service = await prisma.service.create({
    data: {
      userId,
      serviceNumber: data.serviceNumber,
      qru: data.qru ? data.qru.trim() : null,
      employeeId: data.employeeId,
      serviceDate: new Date(data.serviceDate),
      baseValue: data.baseValue,
      additionalValue: data.additionalValue ?? 0,
      totalValue,
      notes: data.notes,
      origin: data.origin,
    },
    include: { employee: { select: { name: true } } },
  });

  await recalculateSheetForService(service.employeeId, service.serviceDate, userId);
  return service;
}

export async function updateService(id: string, data: ServiceUpdateInput, userId: string) {
  const existing = await prisma.service.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("NOT_FOUND");

  const baseValue = data.baseValue ?? Number(existing.baseValue);
  const additionalValue = data.additionalValue ?? Number(existing.additionalValue);
  const totalValue = computeTotal(baseValue, additionalValue);

  const service = await prisma.service.update({
    where: { id },
    data: {
      ...data,
      ...(data.serviceDate ? { serviceDate: new Date(data.serviceDate) } : {}),
      ...(data.qru !== undefined ? { qru: data.qru ? data.qru.trim() : null } : {}),
      totalValue,
    },
    include: { employee: { select: { name: true } } },
  });

  await recalculateSheetForService(service.employeeId, service.serviceDate, userId);
  if (data.serviceDate && existing.serviceDate !== service.serviceDate) {
    await recalculateSheetForService(existing.employeeId, existing.serviceDate, userId);
  }
  return service;
}

export async function deleteService(id: string, userId: string) {
  const existing = await prisma.service.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("NOT_FOUND");

  const service = await prisma.service.delete({ where: { id } });
  await recalculateSheetForService(service.employeeId, service.serviceDate, userId);
  return service;
}

export async function getServicesGroupedByYearMonth(userId: string) {
  const services = await prisma.service.findMany({
    where: { userId },
    select: { serviceDate: true },
    orderBy: { serviceDate: "desc" },
  });

  const grouped = new Map<number, Set<number>>();
  for (const s of services) {
    const d = new Date(s.serviceDate);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    if (!grouped.has(year)) grouped.set(year, new Set());
    grouped.get(year)!.add(month);
  }

  return Array.from(grouped.entries())
    .map(([year, months]) => ({
      year,
      months: Array.from(months).sort((a, b) => b - a),
    }))
    .sort((a, b) => b.year - a.year);
}

export async function getMonthStats(year: number, month: number, userId: string) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const services = await prisma.service.findMany({
    where: { userId, serviceDate: { gte: start, lte: end } },
    include: { employee: { select: { id: true, name: true } } },
  });

  const byEmployee = new Map<
    string,
    { employeeId: string; name: string; count: number; total: number }
  >();
  for (const s of services) {
    const key = s.employeeId;
    const current = byEmployee.get(key) ?? {
      employeeId: s.employeeId,
      name: s.employee.name,
      count: 0,
      total: 0,
    };
    current.count += 1;
    current.total += Number(s.totalValue);
    byEmployee.set(key, current);
  }

  return {
    totalServices: services.length,
    totalValue: services.reduce((acc, s) => acc + Number(s.totalValue), 0),
    uniqueQrus: new Set(services.map((s) => s.qru)).size,
    byEmployee: Array.from(byEmployee.values()).sort((a, b) => a.name.localeCompare(b.name)),
  };
}
