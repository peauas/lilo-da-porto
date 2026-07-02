"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { FileSpreadsheet, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getMonthName, formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

async function fetchSheets() {
  const res = await fetch("/api/sheets?limit=50");
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message);
  return json.data;
}

function SheetsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const employeeId = searchParams.get("employeeId");
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  useEffect(() => {
    if (employeeId && year && month) {
      fetch(`/api/sheets?employeeId=${employeeId}&year=${year}&month=${month}`)
        .then((r) => r.json())
        .then((json) => {
          if (json.success && json.data?.id) {
            router.replace(`/sheets/${json.data.id}`);
          }
        });
    }
  }, [employeeId, year, month, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["sheets"],
    queryFn: fetchSheets,
  });

  const statusLabel: Record<string, string> = {
    DRAFT: "Rascunho",
    CLOSED: "Fechada",
    REOPENED: "Reaberta",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Folhas mensais"
        description="Gestão e fechamento de folhas por funcionário"
      />

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : data?.length ? (
        <div className="grid gap-3">
          {data.map((sheet: {
            id: string;
            year: number;
            month: number;
            status: string;
            grossTotal: string;
            netTotal: string;
            employee: { name: string };
          }) => (
            <Link key={sheet.id} href={`/sheets/${sheet.id}`}>
              <Card className="hover:bg-accent transition-colors">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{sheet.employee.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {getMonthName(sheet.month)}/{sheet.year} · Bruto {formatCurrency(Number(sheet.grossTotal))} · Líquido {formatCurrency(Number(sheet.netTotal))}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={sheet.status === "CLOSED" ? "success" : "warning"}>
                      {statusLabel[sheet.status] ?? sheet.status}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileSpreadsheet}
          title="Nenhuma folha gerada"
          description="As folhas são criadas automaticamente ao lançar serviços ou ao acessar o período."
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
