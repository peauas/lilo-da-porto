import { prisma } from "@/lib/prisma";
import { uploadDocument, deleteBlob } from "@/lib/blob";
import type { DocumentInput } from "@/schemas/document.schema";

async function assertEmployeeOwnership(employeeId: string, userId: string) {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, userId },
    select: { id: true },
  });
  if (!employee) throw new Error("NOT_FOUND");
}

export async function listDocuments(employeeId: string, userId: string) {
  return prisma.employeeDocument.findMany({
    where: { employeeId, userId },
    orderBy: { uploadedAt: "desc" },
  });
}

export async function createDocument(
  employeeId: string,
  file: File,
  data: DocumentInput,
  userId: string,
) {
  await assertEmployeeOwnership(employeeId, userId);

  const blob = await uploadDocument(file, employeeId, data.category);
  return prisma.employeeDocument.create({
    data: {
      userId,
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

export async function deleteDocument(id: string, userId: string) {
  const doc = await prisma.employeeDocument.findFirst({ where: { id, userId } });
  if (!doc) throw new Error("NOT_FOUND");
  try {
    await deleteBlob(doc.blobUrl);
  } catch {
    // blob may already be deleted
  }
  return prisma.employeeDocument.delete({ where: { id } });
}

export async function getDocument(id: string, userId: string) {
  return prisma.employeeDocument.findFirst({ where: { id, userId } });
}
