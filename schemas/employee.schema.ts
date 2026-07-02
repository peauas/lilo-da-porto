import { z } from "zod";

export const addressSchema = z.object({
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

export const employeeSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  phone: z.string().optional(),
  cpf: z.string().min(11, "CPF inválido").max(14),
  rg: z.string().optional(),
  cnh: z.string().optional(),
  birthDate: z.string().optional().nullable(),
  address: addressSchema.optional(),
  pix: z.string().optional(),
  bank: z.string().optional(),
  agency: z.string().optional(),
  account: z.string().optional(),
  defaultPercentage: z.coerce.number().min(0).max(100),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  notes: z.string().optional(),
});

export const employeeUpdateSchema = employeeSchema.partial();

export const employeeQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ALL"]).optional().default("ALL"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;
export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>;
