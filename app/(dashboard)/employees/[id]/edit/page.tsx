"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmployeeForm } from "@/components/forms/employee-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { EmployeeInput } from "@/schemas/employee.schema";

async function fetchEmployee(id: string) {
  const res = await fetch(`/api/employees/${id}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message);
  return json.data;
}

export default function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { data: employee, isLoading } = useQuery({
    queryKey: ["employee", id],
    queryFn: () => fetchEmployee(id),
  });

  async function onSubmit(data: EmployeeInput) {
    setLoading(true);
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error?.message ?? "Erro ao atualizar");
        return;
      }
      toast.success("Funcionário atualizado");
      router.push(`/employees/${id}`);
    } catch {
      toast.error("Erro ao atualizar funcionário");
    } finally {
      setLoading(false);
    }
  }

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/employees/${id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Link>
      </Button>
      <PageHeader title="Editar funcionário" />
      <div className="rounded-xl border border-border bg-card p-6">
        <EmployeeForm
          defaultValues={{
            ...employee,
            birthDate: employee?.birthDate
              ? new Date(employee.birthDate).toISOString().split("T")[0]
              : undefined,
            defaultPercentage: Number(employee?.defaultPercentage),
          }}
          onSubmit={onSubmit}
          loading={loading}
        />
      </div>
    </div>
  );
}
