"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { serviceSchema, type ServiceInput } from "@/schemas/service.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormSection, Field } from "@/components/forms/form-section";
import { Loader2 } from "lucide-react";

interface EmployeeOption {
  id: string;
  name: string;
}

interface ServiceFormProps {
  employees: EmployeeOption[];
  defaultValues?: Partial<ServiceInput>;
  onSubmit: (data: ServiceInput) => Promise<void>;
  loading?: boolean;
  submitLabel?: string;
}

export function ServiceForm({
  employees,
  defaultValues,
  onSubmit,
  loading,
  submitLabel = "Salvar serviço",
}: ServiceFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ServiceInput>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      origin: "MANUAL",
      additionalValue: 0,
      serviceDate: new Date().toISOString().split("T")[0],
      ...defaultValues,
    },
  });

  const employeeId = watch("employeeId");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <FormSection title="Identificação" description="Funcionário e dados do serviço.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Funcionário" required error={errors.employeeId?.message}>
            <Select value={employeeId} onValueChange={(v) => setValue("employeeId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Data" htmlFor="serviceDate" required error={errors.serviceDate?.message}>
            <Input id="serviceDate" type="date" {...register("serviceDate")} />
          </Field>
          <Field
            label="Nº do serviço"
            htmlFor="serviceNumber"
            required
            error={errors.serviceNumber?.message}
          >
            <Input id="serviceNumber" {...register("serviceNumber")} />
          </Field>
          <Field label="QRU" htmlFor="qru">
            <Input id="qru" {...register("qru")} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Valores" description="Valores base e adicionais do serviço.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Valor base" htmlFor="baseValue" required error={errors.baseValue?.message}>
            <Input id="baseValue" type="number" step="0.01" {...register("baseValue")} />
          </Field>
          <Field label="Valor adicional" htmlFor="additionalValue">
            <Input
              id="additionalValue"
              type="number"
              step="0.01"
              {...register("additionalValue")}
            />
          </Field>
          <Field label="Observação" htmlFor="notes" className="sm:col-span-2">
            <Textarea id="notes" placeholder="Opcional" {...register("notes")} />
          </Field>
        </div>
      </FormSection>

      <div className="flex justify-end border-t border-border pt-6">
        <Button type="submit" size="lg" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
