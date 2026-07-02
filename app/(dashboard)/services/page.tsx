"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, Wrench, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getMonthName } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

async function fetchGrouped() {
  const res = await fetch("/api/services?grouped=true");
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message);
  return json.data;
}

export default function ServicesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["services-grouped"],
    queryFn: fetchGrouped,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Serviços"
        description="Navegue por ano, mês e funcionário"
        action={
          <Button asChild>
            <Link href="/services/new">
              <Plus className="mr-2 h-4 w-4" />
              Novo serviço
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : data?.length ? (
        <div className="space-y-4">
          {data.map((yearGroup: { year: number; months: number[] }) => (
            <Card key={yearGroup.year}>
              <CardContent className="p-4">
                <h3 className="mb-3 text-lg font-semibold">{yearGroup.year}</h3>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {yearGroup.months.map((month: number) => (
                    <Link
                      key={month}
                      href={`/services/${yearGroup.year}/${month}`}
                      className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent transition-colors"
                    >
                      <span>{getMonthName(month)}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Wrench}
          title="Nenhum serviço lançado"
          description="Comece registrando o primeiro serviço manualmente ou use a extensão Chrome."
          actionLabel="Novo serviço"
          actionHref="/services/new"
        />
      )}
    </div>
  );
}
