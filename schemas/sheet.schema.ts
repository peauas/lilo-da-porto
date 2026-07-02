import { z } from "zod";

export const sheetSchema = z.object({
  employeeId: z.string().min(1),
  year: z.coerce.number().min(2000).max(2100),
  month: z.coerce.number().min(1).max(12),
  percentage: z.coerce.number().min(0).max(100),
  costAllowance: z.coerce.number().min(0).default(0),
  voucher: z.coerce.number().min(0).default(0),
  inss: z.coerce.number().min(0).default(0),
  coparticipation: z.coerce.number().min(0).default(0),
  otherDiscounts: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});

export const sheetUpdateSchema = sheetSchema.partial().omit({
  employeeId: true,
  year: true,
  month: true,
});

export const sheetQuerySchema = z.object({
  year: z.coerce.number().optional(),
  month: z.coerce.number().min(1).max(12).optional(),
  employeeId: z.string().optional(),
  status: z.enum(["DRAFT", "CLOSED", "REOPENED", "ALL"]).optional().default("ALL"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type SheetInput = z.infer<typeof sheetSchema>;
export type SheetUpdateInput = z.infer<typeof sheetUpdateSchema>;

export function calculateSheetTotals(
  grossTotal: number,
  percentage: number,
  costAllowance: number,
  voucher: number,
  inss: number,
  coparticipation: number,
  otherDiscounts: number,
) {
  const netTotal =
    grossTotal * (percentage / 100) +
    costAllowance -
    voucher -
    inss -
    coparticipation -
    otherDiscounts;
  return { grossTotal, netTotal: Math.max(0, netTotal) };
}
