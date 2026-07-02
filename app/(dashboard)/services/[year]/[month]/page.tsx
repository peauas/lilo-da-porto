"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, getMonthName } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

async function fetchMonthStats(year: number, month: number) {
  const res = await fetch(`/api/dashboard/stats?year=${year}&month=${month}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message);
  return json.data;
}

export default function ServicesMonthPage({
  params,
}: {
  params: Promise<{ year: string; month: string }>;
}) {
  const { year, month } = use(params);
  const yearNum = Number(year);
  const monthNum = Number(month);

  const { data, isLoading } = useQuery({
    queryKey: ["month-stats", year, month],
    queryFn: () => fetchMonthStats(yearNum, monthNum),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/services">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Link>
      </Button>

      <PageHeader
        title={`${getMonthName(monthNum)} ${year}`}
        description={`${data?.totalServices ?? 0} serviços · ${formatCurrency(data?.totalValue ?? 0)}`}
      />

      {isLoading ? (
        <Skeleton className="h-48" />
      ) : data?.byEmployee?.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.byEmployee.map((emp: {
            employeeId: string;
            name: string;
            count: number;
            total: number;
          }) => (
            <Link key={emp.employeeId} href={`/services/${year}/${month}/${emp.employeeId}`}>
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{emp.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {emp.count} serviços · {formatCurrency(emp.total)}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-12">Nenhum serviço neste período</p>
      )}
    </div>
  );
}
