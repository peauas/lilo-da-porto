import { z } from "zod";

export const documentSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  category: z.enum([
    "RG",
    "CPF",
    "CNH",
    "RESIDENCE_PROOF",
    "CONTRACT",
    "SIGNED_SHEET",
    "OTHER",
  ]),
  notes: z.string().optional(),
});

export const DOCUMENT_CATEGORY_LABELS: Record<string, string> = {
  RG: "RG",
  CPF: "CPF",
  CNH: "CNH",
  RESIDENCE_PROOF: "Comprovante de residência",
  CONTRACT: "Contrato",
  SIGNED_SHEET: "Folha assinada",
  OTHER: "Outros",
};

export type DocumentInput = z.infer<typeof documentSchema>;
