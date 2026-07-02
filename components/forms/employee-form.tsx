"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { employeeSchema, type EmployeeInput } from "@/schemas/employee.schema";
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

interface EmployeeFormProps {
  defaultValues?: Partial<EmployeeInput>;
  onSubmit: (data: EmployeeInput) => Promise<void>;
  loading?: boolean;
  submitLabel?: string;
}

export function EmployeeForm({
  defaultValues,
  onSubmit,
  loading,
  submitLabel = "Salvar",
}: EmployeeFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmployeeInput>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      status: "ACTIVE",
      defaultPercentage: 70,
      ...defaultValues,
    },
  });

  const status = watch("status");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Nome *</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="cpf">CPF *</Label>
          <Input id="cpf" {...register("cpf")} placeholder="000.000.000-00" />
          {errors.cpf && <p className="text-sm text-destructive">{errors.cpf.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" {...register("phone")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rg">RG</Label>
          <Input id="rg" {...register("rg")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cnh">CNH</Label>
          <Input id="cnh" {...register("cnh")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="birthDate">Data de nascimento</Label>
          <Input id="birthDate" type="date" {...register("birthDate")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="defaultPercentage">Percentual padrão (%)</Label>
          <Input id="defaultPercentage" type="number" step="0.01" {...register("defaultPercentage")} />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setValue("status", v as "ACTIVE" | "INACTIVE")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Ativo</SelectItem>
              <SelectItem value="INACTIVE">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pix">PIX</Label>
          <Input id="pix" {...register("pix")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bank">Banco</Label>
          <Input id="bank" {...register("bank")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="agency">Agência</Label>
          <Input id="agency" {...register("agency")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="account">Conta</Label>
          <Input id="account" {...register("account")} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Observações</Label>
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
