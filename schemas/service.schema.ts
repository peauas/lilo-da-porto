import { z } from "zod";

export const serviceSchema = z.object({
  serviceNumber: z.string().min(1, "Número do serviço é obrigatório"),
  qru: z.string().min(1, "QRU é obrigatório"),
  employeeId: z.string().min(1, "Funcionário é obrigatório"),
  serviceDate: z.string().min(1, "Data é obrigatória"),
  baseValue: z.coerce.number().min(0),
  additionalValue: z.coerce.number().min(0),
  notes: z.string().optional(),
  origin: z.enum(["MANUAL", "EXTENSION"]),
});

export const serviceUpdateSchema = serviceSchema.partial();

export const serviceQuerySchema = z.object({
  year: z.coerce.number().optional(),
  month: z.coerce.number().min(1).max(12).optional(),
  employeeId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export const checkQruSchema = z.object({
  employeeId: z.string().min(1),
  qru: z.string().min(1),
  excludeId: z.string().optional(),
});

export type ServiceInput = z.infer<typeof serviceSchema>;
export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>;
