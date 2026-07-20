"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { employeeSchema, type EmployeeInput } from "@/schemas/employee.schema";
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
import { Separator } from "@/components/ui/separator";
import { FormSection, Field } from "@/components/forms/form-section";
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <FormSection
        title="Dados pessoais"
        description="Informações de identificação do funcionário."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Nome"
            htmlFor="name"
            required
            error={errors.name?.message}
            className="sm:col-span-2"
          >
            <Input id="name" placeholder="Nome completo" {...register("name")} />
          </Field>
          <Field label="CPF" htmlFor="cpf" required error={errors.cpf?.message}>
            <Input id="cpf" placeholder="000.000.000-00" {...register("cpf")} />
          </Field>
          <Field label="Telefone" htmlFor="phone">
            <Input id="phone" placeholder="(00) 00000-0000" {...register("phone")} />
          </Field>
          <Field label="RG" htmlFor="rg">
            <Input id="rg" {...register("rg")} />
          </Field>
          <Field label="CNH" htmlFor="cnh">
            <Input id="cnh" {...register("cnh")} />
          </Field>
          <Field label="Data de nascimento" htmlFor="birthDate">
            <Input id="birthDate" type="date" {...register("birthDate")} />
          </Field>
          <Field label="Status">
            <Select
              value={status}
              onValueChange={(v) => setValue("status", v as "ACTIVE" | "INACTIVE")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Ativo</SelectItem>
                <SelectItem value="INACTIVE">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </FormSection>

      <Separator />

      <FormSection title="Pagamento" description="Percentual de repasse e dados bancários.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Percentual padrão (%)"
            htmlFor="defaultPercentage"
            error={errors.defaultPercentage?.message}
            hint="Aplicado por padrão nas folhas mensais."
          >
            <Input
              id="defaultPercentage"
              type="number"
              step="0.01"
              {...register("defaultPercentage")}
            />
          </Field>
          <Field label="PIX" htmlFor="pix">
            <Input id="pix" placeholder="Chave PIX" {...register("pix")} />
          </Field>
          <Field label="Banco" htmlFor="bank">
            <Input id="bank" {...register("bank")} />
          </Field>
          <Field label="Agência" htmlFor="agency">
            <Input id="agency" {...register("agency")} />
          </Field>
          <Field label="Conta" htmlFor="account">
            <Input id="account" {...register("account")} />
          </Field>
        </div>
      </FormSection>

      <Separator />

      <FormSection title="Observações" description="Anotações internas sobre o funcionário.">
        <Field label="Observações" htmlFor="notes">
          <Textarea id="notes" placeholder="Opcional" {...register("notes")} />
        </Field>
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
