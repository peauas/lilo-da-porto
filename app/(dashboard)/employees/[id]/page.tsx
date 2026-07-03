"use client";

import { use, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Trash2, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCPF, formatDate, formatPhone } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function fetchEmployee(id: string) {
  const res = await fetch(`/api/employees/${id}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message);
  return json.data;
}

async function fetchDocuments(employeeId: string) {
  const res = await fetch(`/api/employees/${employeeId}/documents`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message);
  return json.data;
}

export default function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [docName, setDocName] = useState("");
  const [docCategory, setDocCategory] = useState("OTHER");
  const [docNotes, setDocNotes] = useState("");
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [deleteDocOpen, setDeleteDocOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: employee, isLoading } = useQuery({
    queryKey: ["employee", id],
    queryFn: () => fetchEmployee(id),
  });

  const { data: documents, isLoading: isDocumentsLoading } = useQuery({
    queryKey: ["employee-documents", id],
    queryFn: () => fetchDocuments(id),
  });

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !docName.trim()) {
      toast.error("Selecione um arquivo e informe um nome para o documento");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", docName.trim());
      formData.append("category", docCategory);
      if (docNotes.trim()) formData.append("notes", docNotes.trim());

      const res = await fetch(`/api/employees/${id}/documents`, {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error?.message ?? "Erro ao enviar documento");
        return;
      }
      toast.success("Documento enviado");
      setFile(null);
      setDocName("");
      setDocNotes("");
      queryClient.invalidateQueries({ queryKey: ["employee-documents", id] });
    } catch {
      toast.error("Erro ao enviar documento");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error?.message ?? "Erro ao excluir");
        return;
      }
      toast.success("Funcionário excluído");
      router.push("/employees");
    } catch {
      toast.error("Erro ao excluir funcionário");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  async function handleDeleteDocument() {
    if (!deleteDocId) return;

    try {
      const res = await fetch(
        `/api/employees/${id}/documents?documentId=${deleteDocId}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error?.message ?? "Erro ao excluir documento");
        return;
      }
      toast.success("Documento excluído");
      queryClient.invalidateQueries({ queryKey: ["employee-documents", id] });
    } catch {
      toast.error("Erro ao excluir documento");
    } finally {
      setDeleteDocId(null);
      setDeleteDocOpen(false);
    }
  }

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!employee) return <p>Funcionário não encontrado</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/employees">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Link>
      </Button>

      <div className="rounded-[32px] border border-border bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Funcionário</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{employee.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">CPF {formatCPF(employee.cpf)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/employees/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-[32px] border border-border bg-card p-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Telefone:</span>{" "}
                {employee.phone ? formatPhone(employee.phone) : "—"}
              </p>
              <p>
                <span className="text-muted-foreground">RG:</span>{" "}
                {employee.rg ?? "—"}
              </p>
              <p>
                <span className="text-muted-foreground">CNH:</span>{" "}
                {employee.cnh ?? "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Nascimento:</span>{" "}
                {employee.birthDate ? formatDate(employee.birthDate) : "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Status:</span>{" "}
                <Badge variant={employee.status === "ACTIVE" ? "success" : "secondary"}>
                  {employee.status === "ACTIVE" ? "Ativo" : "Inativo"}
                </Badge>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados bancários</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">PIX:</span>{" "}
                {employee.pix ?? "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Banco:</span>{" "}
                {employee.bank ?? "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Agência:</span>{" "}
                {employee.agency ?? "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Conta:</span>{" "}
                {employee.account ?? "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Percentual:</span>{" "}
                {employee.defaultPercentage}%
              </p>
            </CardContent>
          </Card>
        </div>

        {employee.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{employee.notes}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Documentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Envie documentos diretamente aqui e acesse-os rapidamente. O fluxo é único e contínuo.
              </p>
              <form onSubmit={handleUpload} className="grid gap-4 lg:grid-cols-[1fr_280px]">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="doc-name">Nome do documento</Label>
                    <Input
                      id="doc-name"
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      placeholder="Ex: CNH frente"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doc-notes">Observações</Label>
                    <Textarea
                      id="doc-notes"
                      value={docNotes}
                      onChange={(e) => setDocNotes(e.target.value)}
                      placeholder="Informações adicionais"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="doc-category">Categoria</Label>
                    <Select value={docCategory} onValueChange={setDocCategory}>
                      <SelectTrigger id="doc-category">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OTHER">Outro</SelectItem>
                        <SelectItem value="RG">RG</SelectItem>
                        <SelectItem value="CNH">CNH</SelectItem>
                        <SelectItem value="CONTRACT">Contrato</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doc-file">Arquivo</Label>
                    <input
                      id="doc-file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      className="flex h-12 w-full cursor-pointer rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                    />
                  </div>
                  <Button type="submit" disabled={uploading} className="w-full">
                    {uploading ? "Enviando..." : "Enviar documento"}
                  </Button>
                </div>
              </form>
            </div>

            {isDocumentsLoading ? (
              <Skeleton className="h-40" />
            ) : documents?.length ? (
              <div className="overflow-hidden rounded-xl border border-border bg-card">
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
                    }) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium text-sm">
                          <a href={doc.blobUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                            {doc.name}
                          </a>
                        </TableCell>
                        <TableCell className="text-sm">{doc.category}</TableCell>
                        <TableCell className="text-sm">{formatDate(doc.uploadedAt)}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" asChild>
                            <a href={doc.blobUrl} target="_blank" rel="noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { setDeleteDocId(doc.id); setDeleteDocOpen(true); }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8">Ainda não há documentos para este funcionário.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir funcionário"
        description="Esta ação não pode ser desfeita. Todos os documentos serão removidos."
        confirmLabel="Excluir"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={deleteDocOpen}
        onOpenChange={setDeleteDocOpen}
        title="Excluir documento"
        description="O documento será removido permanentemente."
        confirmLabel="Excluir"
        destructive
        onConfirm={handleDeleteDocument}
      />
    </div>
  );
}
