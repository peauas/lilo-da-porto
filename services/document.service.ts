import { prisma } from "@/lib/prisma";
import { uploadDocument, deleteBlob } from "@/lib/blob";
import type { DocumentInput } from "@/schemas/document.schema";

export async function listDocuments(employeeId: string) {
  return prisma.employeeDocument.findMany({
    where: { employeeId },
    orderBy: { uploadedAt: "desc" },
  });
}

export async function createDocument(
  employeeId: string,
  file: File,
  data: DocumentInput,
) {
  const blob = await uploadDocument(file, employeeId, data.category);
  return prisma.employeeDocument.create({
    data: {
      employeeId,
      name: data.name,
      category: data.category,
      blobUrl: blob.url,
      blobPathname: blob.pathname,
      mimeType: file.type,
      sizeBytes: file.size,
      notes: data.notes,
    },
  });
}

export async function deleteDocument(id: string) {
  const doc = await prisma.employeeDocument.findUniqueOrThrow({ where: { id } });
  try {
    await deleteBlob(doc.blobUrl);
  } catch {
    // blob may already be deleted
  }
  return prisma.employeeDocument.delete({ where: { id } });
}

export async function getDocument(id: string) {
  return prisma.employeeDocument.findUnique({ where: { id } });
}
