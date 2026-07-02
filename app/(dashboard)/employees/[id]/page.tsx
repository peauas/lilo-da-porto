"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Trash2, FileText } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { formatCPF, formatDate, formatPhone } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function fetchEmployee(id: string) {
  const res = await fetch(`/api/employees/${id}`);
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

  const { data: employee, isLoading } = useQuery({
    queryKey: ["employee", id],
    queryFn: () => fetchEmployee(id),
  });

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

      <PageHeader
        title={employee.name}
        description={`CPF ${formatCPF(employee.cpf)}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/employees/${id}/documents`}>
                <FileText className="mr-2 h-4 w-4" />
                Documentos
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/employees/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Dados pessoais</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Telefone:</span> {employee.phone ? formatPhone(employee.phone) : "—"}</p>
            <p><span className="text-muted-foreground">RG:</span> {employee.rg ?? "—"}</p>
            <p><span className="text-muted-foreground">CNH:</span> {employee.cnh ?? "—"}</p>
            <p><span className="text-muted-foreground">Nascimento:</span> {employee.birthDate ? formatDate(employee.birthDate) : "—"}</p>
            <p><span className="text-muted-foreground">Status:</span>{" "}
              <Badge variant={employee.status === "ACTIVE" ? "success" : "secondary"}>
                {employee.status === "ACTIVE" ? "Ativo" : "Inativo"}
              </Badge>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Dados bancários</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">PIX:</span> {employee.pix ?? "—"}</p>
            <p><span className="text-muted-foreground">Banco:</span> {employee.bank ?? "—"}</p>
            <p><span className="text-muted-foreground">Agência:</span> {employee.agency ?? "—"}</p>
            <p><span className="text-muted-foreground">Conta:</span> {employee.account ?? "—"}</p>
            <p><span className="text-muted-foreground">Percentual:</span> {employee.defaultPercentage}%</p>
          </CardContent>
        </Card>
      </div>

      {employee.notes && (
        <Card>
          <CardHeader><CardTitle className="text-base">Observações</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{employee.notes}</p></CardContent>
        </Card>
      )}

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
    </div>
  );
}
