"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Users,
  Wrench,
  DollarSign,
  Clock,
  FileWarning,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/cards/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, getMonthName } from "@/lib/utils";
import { ServicesChart } from "@/components/charts/services-chart";

async function fetchDashboard() {
  const res = await fetch("/api/dashboard/stats");
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message);
  return json.data;
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const now = new Date();
  const monthLabel = `${getMonthName(now.getMonth() + 1)} ${now.getFullYear()}`;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Dashboard"
        description={`Resumo de ${monthLabel}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Funcionários ativos"
          value={data?.activeEmployees ?? 0}
          icon={Users}
        />
        <StatCard
          title="Serviços do mês"
          value={data?.totalServices ?? 0}
          icon={Wrench}
        />
        <StatCard
          title="Valor bruto"
          value={data?.grossTotal ?? 0}
          format="currency"
          icon={DollarSign}
        />
        <StatCard
          title="Serviços únicos"
          value={data?.uniqueServiceNumbers ?? 0}
          icon={Clock}
          description={`Líquido est.: ${formatCurrency(data?.estimatedNet ?? 0)}`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Últimos lançamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.recentServices?.length ? (
              <div className="space-y-3">
                {data.recentServices.map((s: {
                  id: string;
                  serviceNumber: string;
                  totalValue: string;
                  serviceDate: string;
                  employee: { name: string };
                }) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="font-medium">{s.employee.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Serviço {s.serviceNumber} · {formatDate(s.serviceDate)}
                      </p>
                    </div>
                    <p className="font-semibold">{formatCurrency(Number(s.totalValue))}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum lançamento recente</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileWarning className="h-4 w-4" />
              Folhas pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.pendingSheets?.length ? (
              <div className="space-y-3">
                {data.pendingSheets.map((sheet: {
                  id: string;
                  year: number;
                  month: number;
                  status: string;
                  employee: { name: string };
                }) => (
                  <Link
                    key={sheet.id}
                    href={`/sheets/${sheet.id}`}
                    className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent transition-colors"
                  >
                    <div>
                      <p className="font-medium">{sheet.employee.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {getMonthName(sheet.month)}/{sheet.year}
                      </p>
                    </div>
                    <Badge variant={sheet.status === "DRAFT" ? "warning" : "secondary"}>
                      {sheet.status === "DRAFT" ? "Rascunho" : "Reaberta"}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma folha pendente</p>
            )}
          </CardContent>
        </Card>
      </div>

      {data?.chartData?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Serviços nos últimos meses</CardTitle>
          </CardHeader>
          <CardContent>
            <ServicesChart data={data.chartData} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
