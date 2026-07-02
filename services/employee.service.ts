import { prisma } from "@/lib/prisma";
import type { EmployeeInput, EmployeeUpdateInput } from "@/schemas/employee.schema";
import { Prisma } from "@prisma/client";

function normalizeCpf(cpf: string) {
  return cpf.replace(/\D/g, "");
}

export async function listEmployees(params: {
  search?: string;
  status?: "ACTIVE" | "INACTIVE" | "ALL";
  page?: number;
  limit?: number;
}) {
  const { search, status = "ALL", page = 1, limit = 20 } = params;
  const where: Prisma.EmployeeWhereInput = {};

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

export async function getEmployee(id: string) {
  return prisma.employee.findUnique({
    where: { id },
    include: {
      documents: { orderBy: { uploadedAt: "desc" } },
      _count: { select: { services: true, monthlySheets: true } },
    },
  });
}

export async function createEmployee(data: EmployeeInput) {
  return prisma.employee.create({
    data: {
      ...data,
      cpf: normalizeCpf(data.cpf),
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      address: data.address ?? Prisma.JsonNull,
    },
  });
}

export async function updateEmployee(id: string, data: EmployeeUpdateInput) {
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

export async function deleteEmployee(id: string) {
  return prisma.employee.delete({ where: { id } });
}

export async function getActiveEmployeesCount() {
  return prisma.employee.count({ where: { status: "ACTIVE" } });
}

export async function listActiveEmployees() {
  return prisma.employee.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, defaultPercentage: true },
  });
}
