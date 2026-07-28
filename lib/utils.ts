import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num || 0);
}

/**
 * Colunas "pura data" (@db.Date no Prisma, ex: Service.serviceDate) chegam
 * sempre como meia-noite UTC. Formatar com o fuso local (ex: America/Sao_Paulo,
 * UTC-3) exibe o dia anterior. Timestamps reais (createdAt, uploadedAt) quase
 * nunca caem exatamente em meia-noite UTC, então detectamos o caso pela hora.
 */
export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const isDateOnly =
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 &&
    d.getUTCMilliseconds() === 0;
  return new Intl.DateTimeFormat("pt-BR", isDateOnly ? { timeZone: "UTC" } : undefined).format(d);
}

/** Ano/mês (UTC) de uma coluna "pura data" — ver nota em formatDate. */
export function getUTCYearMonth(date: Date | string): { year: number; month: number } {
  const d = typeof date === "string" ? new Date(date) : date;
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

/** Início/fim (inclusive) de um mês em UTC, para comparar com colunas "pura data". */
export function monthRangeUTC(year: number, month: number): { start: Date; end: Date } {
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)),
  };
}

export function formatCPF(cpf: string) {
  const digits = cpf.replace(/\D/g, "");
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
}

export function getMonthName(month: number) {
  const names = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  return names[month - 1] ?? "";
}
