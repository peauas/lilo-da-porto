import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/auth-helpers";
import { documentSchema } from "@/schemas/document.schema";
import { createDocument, deleteDocument, listDocuments } from "@/services/document.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const authUser = await requireApiAuth(_request);
  if (!authUser) return apiError("UNAUTHORIZED", "Não autorizado", 401);

  const { id } = await params;
  const documents = await listDocuments(id);
  return apiSuccess(documents);
}

export async function POST(request: NextRequest, { params }: Params) {
  const authUser = await requireApiAuth(request);
  if (!authUser) return apiError("UNAUTHORIZED", "Não autorizado", 401);

  const { id } = await params;
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return apiError("VALIDATION_ERROR", "Arquivo é obrigatório", 400);

    const meta = {
      name: formData.get("name") as string,
      category: formData.get("category") as string,
      notes: (formData.get("notes") as string) || undefined,
    };

    const parsed = documentSchema.safeParse(meta);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Dados inválidos", 400, parsed.error.flatten());
    }

    const document = await createDocument(id, file, parsed.data);
    return apiSuccess(document, 201);
  } catch (error) {
    return apiError(
      "UPLOAD_ERROR",
      error instanceof Error ? error.message : "Erro no upload",
      400,
    );
  }
}

export async function DELETE(request: NextRequest) {
  const authUser = await requireApiAuth(request);
  if (!authUser) return apiError("UNAUTHORIZED", "Não autorizado", 401);

  const documentId = request.nextUrl.searchParams.get("documentId");
  if (!documentId) return apiError("VALIDATION_ERROR", "documentId é obrigatório", 400);

  try {
    await deleteDocument(documentId);
    return apiSuccess({ deleted: true });
  } catch {
    return apiError("INTERNAL_ERROR", "Erro ao excluir documento", 500);
  }
}
