"use client";

import { use, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, getMonthName } from "@/lib/utils";

async function fetchServices(year: string, month: string, employeeId: string) {
  const params = new URLSearchParams({ year, month, employeeId, limit: "100" });
  const res = await fetch(`/api/services?${params}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message);
  return json.data;
}

async function fetchEmployee(id: string) {
  const res = await fetch(`/api/employees/${id}`);
  const json = await res.json();
  return json.data;
}

export default function EmployeeServicesPage({
  params,
}: {
  params: Promise<{ year: string; month: string; employeeId: string }>;
}) {
  const { year, month, employeeId } = use(params);
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: services, isLoading } = useQuery({
    queryKey: ["services", year, month, employeeId],
    queryFn: () => fetchServices(year, month, employeeId),
  });

  const { data: employee } = useQuery({
    queryKey: ["employee", employeeId],
    queryFn: () => fetchEmployee(employeeId),
  });

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/services/${deleteId}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error?.message ?? "Erro ao excluir");
        return;
      }
      toast.success("Serviço excluído");
      queryClient.invalidateQueries({ queryKey: ["services", year, month, employeeId] });
    } catch {
      toast.error("Erro ao excluir serviço");
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/services/${year}/${month}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Link>
      </Button>

      <PageHeader
        title={employee?.name ?? "Serviços"}
        description={`${getMonthName(Number(month))} ${year}`}
        action={
          <Button asChild>
            <Link href={`/sheets?employeeId=${employeeId}&year=${year}&month=${month}`}>
              Ver folha
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : services?.length ? (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>QRU</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((s: {
                id: string;
                serviceDate: string;
                serviceNumber: string;
                qru: string;
                totalValue: string;
                origin: string;
              }) => (
                <TableRow key={s.id}>
                  <TableCell>{formatDate(s.serviceDate)}</TableCell>
                  <TableCell>{s.serviceNumber}</TableCell>
                  <TableCell>{s.qru}</TableCell>
                  <TableCell>{formatCurrency(Number(s.totalValue))}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {s.origin === "EXTENSION" ? "Extensão" : "Manual"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(s.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-12">Nenhum serviço encontrado</p>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Excluir serviço"
        description="Esta ação recalculará a folha do mês."
        confirmLabel="Excluir"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
