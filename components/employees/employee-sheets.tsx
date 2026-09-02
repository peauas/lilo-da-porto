"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, FileSpreadsheet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, getMonthName } from "@/lib/utils";

interface SheetRow {
  id: string;
  year: number;
  month: number;
  status: "DRAFT" | "CLOSED" | "REOPENED";
  grossTotal: string;
  netTotal: string;
}

async function fetchEmployeeSheets(employeeId: string): Promise<SheetRow[]> {
  const res = await fetch(`/api/sheets?employeeId=${employeeId}&status=ALL&limit=100`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message);
  return json.data;
}

function hasServices(sheet: SheetRow) {
  return Number(sheet.grossTotal) > 0;
}

function SheetTable({ sheets, emptyLabel }: { sheets: SheetRow[]; emptyLabel: string }) {
  if (sheets.length === 0) {
    return <p className="py-8 text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Período</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Bruto</TableHead>
            <TableHead className="text-right">Líquido</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sheets.map((sheet) => (
            <TableRow key={sheet.id}>
              <TableCell className="font-medium text-sm">
                {getMonthName(sheet.month)}/{sheet.year}
              </TableCell>
              <TableCell>
                <Badge variant={sheet.status === "CLOSED" ? "success" : "secondary"}>
                  {sheet.status === "CLOSED"
                    ? "Enviada"
                    : sheet.status === "REOPENED"
                      ? "Reaberta"
                      : "Rascunho"}
                </Badge>
              </TableCell>
              <TableCell className="text-right text-sm">
                {formatCurrency(Number(sheet.grossTotal))}
              </TableCell>
              <TableCell className="text-right text-sm font-medium">
                {formatCurrency(Number(sheet.netTotal))}
              </TableCell>
              <TableCell className="text-right">
                <Link
                  href={`/sheets/${sheet.id}`}
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Abrir
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function EmployeeSheets({ employeeId }: { employeeId: string }) {
  const { data: sheets, isLoading } = useQuery({
    queryKey: ["employee-sheets", employeeId],
    queryFn: () => fetchEmployeeSheets(employeeId),
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  const withServices = (sheets ?? []).filter(hasServices);
  const toSend = withServices.filter((s) => s.status === "DRAFT" || s.status === "REOPENED");
  const sent = withServices.filter((s) => s.status === "CLOSED");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FileSpreadsheet className="h-4 w-4" />
        Folhas com serviços lançados. Fechada = já enviada.
      </div>
      <Tabs defaultValue="toSend">
        <TabsList>
          <TabsTrigger value="toSend">A enviar ({toSend.length})</TabsTrigger>
          <TabsTrigger value="sent">Enviadas ({sent.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="toSend">
          <SheetTable sheets={toSend} emptyLabel="Nenhuma folha aberta com serviços no momento." />
        </TabsContent>
        <TabsContent value="sent">
          <SheetTable sheets={sent} emptyLabel="Nenhuma folha fechada ainda." />
        </TabsContent>
      </Tabs>
    </div>
  );
}
