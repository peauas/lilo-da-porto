"use client";

import { use, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Upload, Trash2, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DOCUMENT_CATEGORY_LABELS } from "@/schemas/document.schema";
import { formatDate } from "@/lib/utils";

async function fetchDocuments(employeeId: string) {
  const res = await fetch(`/api/employees/${employeeId}/documents`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message);
  return json.data;
}

export default function EmployeeDocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [notes, setNotes] = useState("");

  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents", id],
    queryFn: () => fetchDocuments(id),
  });

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !name) {
      toast.error("Selecione um arquivo e informe o nome");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name);
      formData.append("category", category);
      if (notes) formData.append("notes", notes);

      const res = await fetch(`/api/employees/${id}/documents`, {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error?.message ?? "Erro no upload");
        return;
      }
      toast.success("Documento enviado");
      setFile(null);
      setName("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["documents", id] });
    } catch {
      toast.error("Erro no upload");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const res = await fetch(
        `/api/employees/${id}/documents?documentId=${deleteId}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error?.message ?? "Erro ao excluir");
        return;
      }
      toast.success("Documento excluído");
      queryClient.invalidateQueries({ queryKey: ["documents", id] });
    } catch {
      toast.error("Erro ao excluir documento");
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/employees/${id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Link>
      </Button>

      <div className="rounded-[32px] border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Documentos</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Documentos do funcionário</h1>
            <p className="mt-1 text-sm text-muted-foreground">Veja, edite ou baixe arquivos anexados ao funcionário.</p>
          </div>
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/employees/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao perfil
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-[32px] border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Upload de documento</p>
            <p className="text-sm text-muted-foreground">Envie novo arquivo e mantenha tudo organizado.</p>
          </div>
          <div className="rounded-3xl bg-muted px-4 py-2 text-sm text-muted-foreground">Apenas PDF, JPG, PNG e WEBP</div>
        </div>
        <form onSubmit={handleUpload} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Arquivo (PDF, JPG, PNG — máx. 10 MB)</Label>
            <Input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: RG frente" />
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Observação</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        <Button type="submit" disabled={uploading}>
          {uploading ? "Enviando..." : "Enviar documento"}
        </Button>
      </form>
      </div>

      {isLoading ? (
        <Skeleton className="h-48" />
      ) : documents?.length ? (
        <div className="overflow-hidden rounded-[28px] border border-border bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc: {
                id: string;
                name: string;
                category: string;
                uploadedAt: string;
                blobUrl: string;
                notes: string | null;
              }) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {DOCUMENT_CATEGORY_LABELS[doc.category] ?? doc.category}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" asChild>
                      <a href={doc.blobUrl} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <a href={doc.blobUrl} download>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(doc.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground py-8">Nenhum documento enviado</p>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Excluir documento"
        description="O arquivo será removido permanentemente."
        confirmLabel="Excluir"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
