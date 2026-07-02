import { put, del } from "@vercel/blob";

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export function validateFile(file: File) {
  if (file.size > MAX_SIZE) {
    throw new Error("Arquivo excede o limite de 10 MB");
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Tipo de arquivo não permitido");
  }
}

export async function uploadDocument(
  file: File,
  employeeId: string,
  category: string,
) {
  validateFile(file);
  const pathname = `employees/${employeeId}/${category}/${Date.now()}-${file.name}`;
  const blob = await put(pathname, file, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return blob;
}

export async function deleteBlob(url: string) {
  await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
}
