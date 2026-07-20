"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmployeeForm } from "@/components/forms/employee-form";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import type { EmployeeInput } from "@/schemas/employee.schema";

export default function NewEmployeePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(data: EmployeeInput) {
    setLoading(true);
    try {
      const res = await apiFetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      // apiFetch already handles the redirect to /login on 401.
      if (res.status === 401) return;
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error?.message ?? "Erro ao criar funcionário");
        return;
      }
      toast.success("Funcionário criado com sucesso");
      router.push(`/employees/${json.data.id}`);
    } catch {
      toast.error("Erro ao criar funcionário");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/employees">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Link>
      </Button>
      <PageHeader title="Novo funcionário" description="Preencha os dados do funcionário" />
      <div className="rounded-xl border border-border bg-card p-6">
        <EmployeeForm onSubmit={onSubmit} loading={loading} submitLabel="Cadastrar funcionário" />
      </div>
    </div>
  );
}
