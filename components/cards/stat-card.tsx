import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  format?: "currency" | "number";
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  format,
  className,
}: StatCardProps) {
  const displayValue =
    format === "currency" && typeof value === "number" ? formatCurrency(value) : value;

  return (
    <Card
      className={cn(
        "animate-fade-in transition-shadow hover:shadow-md hover:shadow-slate-900/[0.06]",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tracking-tight text-foreground">{displayValue}</p>
        {description && <p className="mt-1.5 text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}
