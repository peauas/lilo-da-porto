"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ServiceForm } from "@/components/forms/service-form";
import { DuplicateQRUDialog } from "@/components/dialogs/duplicate-qru-dialog";
import { Button } from "@/components/ui/button";
import type { ServiceInput } from "@/schemas/service.schema";

async function fetchEmployees() {
  const res = await fetch("/api/employees?status=ACTIVE&limit=100");
  const json = await res.json();
  return json.data ?? [];
}

export default function NewServicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [existingService, setExistingService] = useState<{
    id: string;
    qru: string;
    serviceNumber: string;
    serviceDate: string;
    totalValue: string;
  } | null>(null);
  const [pendingData, setPendingData] = useState<ServiceInput | null>(null);

  const { data: employees = [] } = useQuery({
    queryKey: ["employees-active"],
    queryFn: fetchEmployees,
  });

  async function submitService(data: ServiceInput, updateExisting = false) {
    setLoading(true);
    try {
      if (updateExisting && existingService) {
        const res = await fetch(`/api/services/${existingService.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!json.success) {
          toast.error(json.error?.message ?? "Erro ao atualizar");
          return;
        }
        toast.success("Serviço atualizado");
      } else {
        const res = await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (res.status === 409) {
          setExistingService(json.error.details);
          setPendingData(data);
          setDuplicateOpen(true);
          return;
        }
        if (!json.success) {
          toast.error(json.error?.message ?? "Erro ao criar serviço");
          return;
        }
        toast.success("Serviço criado com sucesso");
      }
      router.push("/services");
    } catch {
      toast.error("Erro ao salvar serviço");
    } finally {
      setLoading(false);
      setDuplicateOpen(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/services">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Link>
      </Button>
      <PageHeader title="Novo serviço" description="Lançamento manual de serviço" />
      <div className="rounded-xl border border-border bg-card p-6">
        <ServiceForm
          employees={employees}
          onSubmit={(data) => submitService(data)}
          loading={loading}
        />
      </div>

      <DuplicateQRUDialog
        open={duplicateOpen}
        onOpenChange={setDuplicateOpen}
        existingService={existingService}
        onUpdate={() => pendingData && submitService(pendingData, true)}
        onCancel={() => {
          setDuplicateOpen(false);
          setPendingData(null);
        }}
        loading={loading}
      />
    </div>
  );
}
