"use client";

import { use, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Download, Lock, LockOpen } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SheetForm } from "@/components/forms/sheet-form";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, getMonthName } from "@/lib/utils";
import type { SheetUpdateInput } from "@/schemas/sheet.schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function fetchSheet(id: string) {
  const res = await fetch(`/api/sheets/${id}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message);
  return json.data;
}

export default function SheetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);

  const { data: sheet, isLoading } = useQuery({
    queryKey: ["sheet", id],
    queryFn: () => fetchSheet(id),
  });

  const readOnly = sheet?.status === "CLOSED";

  async function onSubmit(data: SheetUpdateInput) {
    setLoading(true);
    try {
      const res = await fetch(`/api/sheets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error?.message ?? "Erro ao salvar");
        return;
      }
      toast.success("Folha salva");
      queryClient.invalidateQueries({ queryKey: ["sheet", id] });
    } catch {
      toast.error("Erro ao salvar folha");
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: "close" | "reopen") {
    setLoading(true);
    try {
      const res = await fetch(`/api/sheets/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error?.message ?? "Erro na operação");
        return;
      }
      toast.success(action === "close" ? "Folha fechada" : "Folha reaberta");
      queryClient.invalidateQueries({ queryKey: ["sheet", id] });
    } catch {
      toast.error("Erro na operação");
    } finally {
      setLoading(false);
      setCloseOpen(false);
    }
  }

  if (isLoading) return <Skeleton className="h-96" />;
  if (!sheet) return <p>Folha não encontrada</p>;

  const statusLabel: Record<string, string> = {
    DRAFT: "Rascunho",
    CLOSED: "Fechada",
    REOPENED: "Reaberta",
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/sheets">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Link>
      </Button>

      <PageHeader
        title={`Folha — ${sheet.employee.name}`}
        description={`${getMonthName(sheet.month)}/${sheet.year}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Badge variant={sheet.status === "CLOSED" ? "success" : "warning"}>
              {statusLabel[sheet.status]}
            </Badge>
            <Button variant="outline" size="sm" asChild>
              <a href={`/api/sheets/${id}/export?format=pdf`} download>
                <Download className="mr-2 h-4 w-4" />
                PDF
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`/api/sheets/${id}/export?format=excel`} download>
                <Download className="mr-2 h-4 w-4" />
                Excel
              </a>
            </Button>
            {readOnly ? (
              <Button size="sm" variant="outline" onClick={() => handleAction("reopen")} disabled={loading}>
                <LockOpen className="mr-2 h-4 w-4" />
                Reabrir
              </Button>
            ) : (
              <Button size="sm" onClick={() => setCloseOpen(true)} disabled={loading}>
                <Lock className="mr-2 h-4 w-4" />
                Fechar folha
              </Button>
            )}
          </div>
        }
      />

      <div className="rounded-xl border border-border bg-card p-6">
        <SheetForm
          grossTotal={Number(sheet.grossTotal)}
          defaultValues={{
            percentage: Number(sheet.percentage),
            costAllowance: Number(sheet.costAllowance),
            voucher: Number(sheet.voucher),
            inss: Number(sheet.inss),
            coparticipation: Number(sheet.coparticipation),
            otherDiscounts: Number(sheet.otherDiscounts),
            notes: sheet.notes ?? undefined,
          }}
          onSubmit={onSubmit}
          loading={loading}
          readOnly={readOnly}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Serviços do período ({sheet.services?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {sheet.services?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sheet.services.map((s: {
                  id: string;
                  serviceDate: string;
                  serviceNumber: string;
                  totalValue: string;
                }) => (
                  <TableRow key={s.id}>
                    <TableCell>{formatDate(s.serviceDate)}</TableCell>
                    <TableCell>{s.serviceNumber}</TableCell>
                    <TableCell>{formatCurrency(Number(s.totalValue))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum serviço neste período</p>
          )}
        </CardContent>
      </Card>

      {sheet.history?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Histórico</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {sheet.history.map((h: { id: string; action: string; createdAt: string }) => (
              <div key={h.id} className="flex justify-between text-sm">
                <span>{h.action}</span>
                <span className="text-muted-foreground">{formatDate(h.createdAt)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        title="Fechar folha"
        description="Após fechar, a folha não poderá ser editada até ser reaberta."
        confirmLabel="Fechar folha"
        onConfirm={() => handleAction("close")}
        loading={loading}
      />
    </div>
  );
}
