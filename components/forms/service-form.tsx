"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { serviceSchema, type ServiceInput } from "@/schemas/service.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Funcionário *</Label>
          <Select value={employeeId} onValueChange={(v) => setValue("employeeId", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.employeeId && <p className="text-sm text-destructive">{errors.employeeId.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="serviceDate">Data *</Label>
          <Input id="serviceDate" type="date" {...register("serviceDate")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="serviceNumber">Nº do serviço *</Label>
          <Input id="serviceNumber" {...register("serviceNumber")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="qru">QRU</Label>
          <Input id="qru" {...register("qru")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="baseValue">Valor base *</Label>
          <Input id="baseValue" type="number" step="0.01" {...register("baseValue")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="additionalValue">Valor adicional</Label>
          <Input id="additionalValue" type="number" step="0.01" {...register("additionalValue")} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Observação</Label>
          <Textarea id="notes" {...register("notes")} />
        </div>
      </div>
      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}
