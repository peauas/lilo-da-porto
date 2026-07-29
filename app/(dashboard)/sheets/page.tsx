"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { FileSpreadsheet, ChevronRight, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmployeeQuickSearch, type EmployeeOption } from "@/components/forms/employee-quick-search";
import { getMonthName, formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

type StatusFilter = "OPEN" | "CLOSED" | "ALL";

interface SheetFilters {
  year: number | null;
  month: number | null;
  status: StatusFilter;
  employeeId: string | null;
}

async function fetchSheets(filters: SheetFilters) {
  const params = new URLSearchParams({ limit: "50", status: filters.status });
  if (filters.year) params.set("year", String(filters.year));
  if (filters.month) params.set("month", String(filters.month));
  if (filters.employeeId) params.set("employeeId", filters.employeeId);

  const res = await fetch(`/api/sheets?${params}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message);
  return json.data;
}

const now = new Date();
const DEFAULT_FILTERS: SheetFilters = {
  year: now.getFullYear(),
  month: now.getMonth() + 1,
  status: "OPEN",
  employeeId: null,
};

function SheetsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectEmployeeId = searchParams.get("employeeId");
  const redirectYear = searchParams.get("year");
  const redirectMonth = searchParams.get("month");

  const [filters, setFilters] = useState<SheetFilters>(DEFAULT_FILTERS);
  const [employeeName, setEmployeeName] = useState<string | null>(null);

  // Vindo do link "Ver folha" (Serviços ou ficha do funcionário): cria/acha
  // a folha exata e redireciona — não passa pelos filtros manuais abaixo.
  useEffect(() => {
    if (redirectEmployeeId && redirectYear && redirectMonth) {
      fetch(`/api/sheets?employeeId=${redirectEmployeeId}&year=${redirectYear}&month=${redirectMonth}`)
        .then((r) => r.json())
        .then((json) => {
          if (json.success && json.data?.id) {
            router.replace(`/sheets/${json.data.id}`);
          }
        });
    }
  }, [redirectEmployeeId, redirectYear, redirectMonth, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["sheets", filters],
    queryFn: () => fetchSheets(filters),
    enabled: !redirectEmployeeId,
  });

  const statusLabel: Record<string, string> = {
    DRAFT: "Rascunho",
    CLOSED: "Fechada",
    REOPENED: "Reaberta",
  };

  const isDefaultFilter =
    filters.year === DEFAULT_FILTERS.year &&
    filters.month === DEFAULT_FILTERS.month &&
    filters.status === "OPEN" &&
    !filters.employeeId;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Folhas mensais"
        description="Gestão e fechamento de folhas por funcionário"
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm shadow-slate-900/[0.03] sm:flex-row sm:items-center">
        <Select
          value={filters.month ? String(filters.month) : "ALL"}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, month: v === "ALL" ? null : Number(v) }))
          }
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os meses</SelectItem>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <SelectItem key={m} value={String(m)}>
                {getMonthName(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.year ? String(filters.year) : "ALL"}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, year: v === "ALL" ? null : Number(v) }))
          }
        >
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os anos</SelectItem>
            {Array.from({ length: 6 }, (_, i) => now.getFullYear() + 1 - i).map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(v) => setFilters((f) => ({ ...f, status: v as StatusFilter }))}
        >
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="OPEN">Em aberto</SelectItem>
            <SelectItem value="CLOSED">Fechadas</SelectItem>
            <SelectItem value="ALL">Todas</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1">
          {employeeName ? (
            <div className="flex h-10 items-center justify-between rounded-lg border border-border bg-muted/40 px-3 text-sm">
              <span className="truncate font-medium">{employeeName}</span>
              <button
                type="button"
                onClick={() => {
                  setEmployeeName(null);
                  setFilters((f) => ({ ...f, employeeId: null }));
                }}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Limpar funcionário"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <EmployeeQuickSearch
              placeholder="Filtrar por funcionário..."
              onSelect={(emp: EmployeeOption) => {
                setEmployeeName(emp.name);
                setFilters((f) => ({ ...f, employeeId: emp.id }));
              }}
            />
          )}
        </div>

        {!isDefaultFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilters(DEFAULT_FILTERS);
              setEmployeeName(null);
            }}
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : data?.length ? (
        <div className="grid gap-3">
          {data.map(
            (sheet: {
              id: string;
              year: number;
              month: number;
              status: string;
              grossTotal: string;
              netTotal: string;
              employee: { name: string };
            }) => (
              <Link key={sheet.id} href={`/sheets/${sheet.id}`} className="group">
                <Card className="transition-all hover:border-primary/30 hover:shadow-md hover:shadow-slate-900/[0.06]">
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{sheet.employee.name}</p>
                      <p className="mt-0.5 text-sm capitalize text-muted-foreground">
                        {getMonthName(sheet.month)}/{sheet.year}
                      </p>
                      <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                        Bruto {formatCurrency(Number(sheet.grossTotal))} · Líquido{" "}
                        <span className="font-medium text-foreground">
                          {formatCurrency(Number(sheet.netTotal))}
                        </span>
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant={sheet.status === "CLOSED" ? "success" : "warning"}>
                        {statusLabel[sheet.status] ?? sheet.status}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ),
          )}
        </div>
      ) : (
        <EmptyState
          icon={FileSpreadsheet}
          title={isDefaultFilter ? "Nenhuma folha em aberto este mês" : "Nenhuma folha encontrada"}
          description={
            isDefaultFilter
              ? "As folhas são criadas automaticamente ao lançar serviços ou ao acessar o período de um funcionário."
              : "Tente ajustar os filtros acima."
          }
        />
      )}
    </div>
  );
}

export default function SheetsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <SheetsContent />
    </Suspense>
  );
}
