"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

interface DuplicateQRUDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingService: {
    id: string;
    qru: string;
    serviceNumber: string;
    serviceDate: string | Date;
    totalValue: number | string;
  } | null;
  onUpdate: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function DuplicateQRUDialog({
  open,
  onOpenChange,
  existingService,
  onUpdate,
  onCancel,
  loading,
}: DuplicateQRUDialogProps) {
  if (!existingService) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>QRU duplicado</DialogTitle>
          <DialogDescription>
            Já existe um serviço com este QRU para o funcionário selecionado.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm space-y-1">
          <p><strong>QRU:</strong> {existingService.qru}</p>
          <p><strong>Serviço:</strong> {existingService.serviceNumber}</p>
          <p><strong>Data:</strong> {formatDate(existingService.serviceDate)}</p>
          <p><strong>Valor:</strong> {formatCurrency(Number(existingService.totalValue))}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={onUpdate} disabled={loading}>
            Atualizar existente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
