import { put, del } from "@vercel/blob";
import fs from "fs/promises";
import path from "path";

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
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
  const relativePathname = `employees/${employeeId}/${category}/${filename}`;

  if (!token) {
    // Local fallback
    const uploadDir = path.join(process.cwd(), "public", "uploads", "employees", employeeId, category);
    await fs.mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    return {
      url: `/uploads/${relativePathname}`,
      pathname: relativePathname,
    };
  }

  const pathname = `employees/${employeeId}/${category}/${filename}`;
  const blob = await put(pathname, file, {
    access: "public",
    token,
  });
  return blob;
}

export async function deleteBlob(url: string) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token || url.startsWith("/uploads/")) {
    try {
      const relativePath = url.replace(/^\/uploads\//, "");
      const filePath = path.join(process.cwd(), "public", "uploads", relativePath);
      await fs.unlink(filePath);
    } catch (e) {
      console.error("Erro ao deletar arquivo local:", e);
    }
    return;
  }
  await del(url, { token });
}
