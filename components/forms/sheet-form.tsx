"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sheetUpdateSchema, type SheetUpdateInput } from "@/schemas/sheet.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
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
  const { register, handleSubmit, watch, formState: { errors } } = useForm<SheetUpdateInput>({
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
    grossTotal * (percentage / 100) + costAllowance - voucher - inss - coparticipation - otherDiscounts,
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">Valor bruto (serviços)</p>
        <p className="text-2xl font-bold">{formatCurrency(grossTotal)}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="percentage">Percentual (%)</Label>
          <Input id="percentage" type="number" step="0.01" disabled={readOnly} {...register("percentage")} />
          {errors.percentage && <p className="text-sm text-destructive">{errors.percentage.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="costAllowance">Ajuda de custo</Label>
          <Input id="costAllowance" type="number" step="0.01" disabled={readOnly} {...register("costAllowance")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="voucher">Vale</Label>
          <Input id="voucher" type="number" step="0.01" disabled={readOnly} {...register("voucher")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="inss">INSS</Label>
          <Input id="inss" type="number" step="0.01" disabled={readOnly} {...register("inss")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="coparticipation">Coparticipação</Label>
          <Input id="coparticipation" type="number" step="0.01" disabled={readOnly} {...register("coparticipation")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="otherDiscounts">Outros descontos</Label>
          <Input id="otherDiscounts" type="number" step="0.01" disabled={readOnly} {...register("otherDiscounts")} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Observações</Label>
          <Textarea id="notes" disabled={readOnly} {...register("notes")} />
        </div>
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <p className="text-sm text-muted-foreground">Valor líquido estimado</p>
        <p className="text-2xl font-bold text-primary">{formatCurrency(netTotal)}</p>
      </div>

      {!readOnly && (
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar folha
        </Button>
      )}
    </form>
  );
}
