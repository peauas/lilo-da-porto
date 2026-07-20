"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sheetUpdateSchema, type SheetUpdateInput } from "@/schemas/sheet.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormSection, Field } from "@/components/forms/form-section";
import { Loader2, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SheetFormProps {
  grossTotal: number;
  defaultValues?: SheetUpdateInput;
  onSubmit: (data: SheetUpdateInput) => Promise<void>;
  loading?: boolean;
  readOnly?: boolean;
}

export function SheetForm({
  grossTotal,
  defaultValues,
  onSubmit,
  loading,
  readOnly,
}: SheetFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SheetUpdateInput>({
    resolver: zodResolver(sheetUpdateSchema),
    defaultValues,
  });

  const percentage = Number(watch("percentage") ?? defaultValues?.percentage ?? 0);
  const costAllowance = Number(watch("costAllowance") ?? 0);
  const voucher = Number(watch("voucher") ?? 0);
  const inss = Number(watch("inss") ?? 0);
  const coparticipation = Number(watch("coparticipation") ?? 0);
  const otherDiscounts = Number(watch("otherDiscounts") ?? 0);

  const netTotal = Math.max(
    0,
    grossTotal * (percentage / 100) +
      costAllowance -
      voucher -
      inss -
      coparticipation -
      otherDiscounts,
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-muted/40 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Valor bruto (serviços)
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            {formatCurrency(grossTotal)}
          </p>
        </div>
        <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-primary">
            <TrendingUp className="h-3.5 w-3.5" />
            Líquido estimado
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-primary">
            {formatCurrency(netTotal)}
          </p>
        </div>
      </div>

      <FormSection
        title="Cálculo da folha"
        description="Percentual, adicionais e descontos do mês."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Percentual (%)" htmlFor="percentage" error={errors.percentage?.message}>
            <Input
              id="percentage"
              type="number"
              step="0.01"
              disabled={readOnly}
              {...register("percentage")}
            />
          </Field>
          <Field label="Ajuda de custo" htmlFor="costAllowance">
            <Input
              id="costAllowance"
              type="number"
              step="0.01"
              disabled={readOnly}
              {...register("costAllowance")}
            />
          </Field>
          <Field label="Vale" htmlFor="voucher">
            <Input
              id="voucher"
              type="number"
              step="0.01"
              disabled={readOnly}
              {...register("voucher")}
            />
          </Field>
          <Field label="INSS" htmlFor="inss">
            <Input id="inss" type="number" step="0.01" disabled={readOnly} {...register("inss")} />
          </Field>
          <Field label="Coparticipação" htmlFor="coparticipation">
            <Input
              id="coparticipation"
              type="number"
              step="0.01"
              disabled={readOnly}
              {...register("coparticipation")}
            />
          </Field>
          <Field label="Outros descontos" htmlFor="otherDiscounts">
            <Input
              id="otherDiscounts"
              type="number"
              step="0.01"
              disabled={readOnly}
              {...register("otherDiscounts")}
            />
          </Field>
          <Field label="Observações" htmlFor="notes" className="sm:col-span-2">
            <Textarea
              id="notes"
              disabled={readOnly}
              placeholder="Opcional"
              {...register("notes")}
            />
          </Field>
        </div>
      </FormSection>

      {!readOnly && (
        <div className="flex justify-end border-t border-border pt-6">
          <Button type="submit" size="lg" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar folha
          </Button>
        </div>
      )}
    </form>
  );
}
