import { prisma } from "@/lib/prisma";
import type { EmployeeInput, EmployeeUpdateInput } from "@/schemas/employee.schema";
import { Prisma } from "@prisma/client";

function normalizeCpf(cpf: string) {
  return cpf.replace(/\D/g, "");
}

export async function listEmployees(params: {
  userId: string;
  search?: string;
  status?: "ACTIVE" | "INACTIVE" | "ALL";
  page?: number;
  limit?: number;
}) {
  const { userId, search, status = "ALL", page = 1, limit = 20 } = params;
  const where: Prisma.EmployeeWhereInput = { userId };

  if (status !== "ALL") where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { cpf: { contains: search.replace(/\D/g, "") } },
      { phone: { contains: search } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { services: true, documents: true } } },
    }),
    prisma.employee.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getEmployee(id: string, userId: string) {
  return prisma.employee.findFirst({
    where: { id, userId },
    include: {
      documents: { orderBy: { uploadedAt: "desc" } },
      _count: { select: { services: true, monthlySheets: true } },
    },
  });
}

export async function createEmployee(data: EmployeeInput, userId: string) {
  return prisma.employee.create({
    data: {
      ...data,
      userId,
      cpf: normalizeCpf(data.cpf),
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      address: data.address ?? Prisma.JsonNull,
    },
  });
}

export async function updateEmployee(id: string, data: EmployeeUpdateInput, userId: string) {
  const owned = await prisma.employee.findFirst({ where: { id, userId } });
  if (!owned) throw new Error("NOT_FOUND");

  return prisma.employee.update({
    where: { id },
    data: {
      ...data,
      ...(data.cpf ? { cpf: normalizeCpf(data.cpf) } : {}),
      ...(data.birthDate !== undefined
        ? { birthDate: data.birthDate ? new Date(data.birthDate) : null }
        : {}),
    },
  });
}

export async function deleteEmployee(id: string, userId: string) {
  const owned = await prisma.employee.findFirst({ where: { id, userId } });
  if (!owned) throw new Error("NOT_FOUND");
  return prisma.employee.delete({ where: { id } });
}

export async function getActiveEmployeesCount(userId: string) {
  return prisma.employee.count({ where: { userId, status: "ACTIVE" } });
}

export async function listActiveEmployees(userId: string) {
  return prisma.employee.findMany({
    where: { userId, status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, defaultPercentage: true },
  });
}
