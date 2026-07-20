import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, formatDate, getMonthName } from "@/lib/utils";
import { LILO_LOGO_PNG_BASE64, LILO_LOGO_ASPECT_RATIO } from "./logo";

type Numeric = number | string;

export interface MonthlySheetPdfData {
  employee: { name: string };
  year: number;
  month: number;
  status: string;
  grossTotal: Numeric;
  percentage: Numeric;
  costAllowance: Numeric;
  voucher: Numeric;
  inss: Numeric;
  coparticipation: Numeric;
  otherDiscounts: Numeric;
  netTotal: Numeric;
  services: Array<{
    serviceDate: Date | string;
    serviceNumber: string;
    baseValue: Numeric;
    additionalValue: Numeric;
    totalValue: Numeric;
  }>;
}

type RGB = [number, number, number];

const COLOR = {
  blue900: [0, 27, 77] as RGB,
  blue500: [0, 102, 204] as RGB,
  cyan: [0, 170, 246] as RGB,
  cyanSoft: [180, 205, 235] as RGB,
  ink: [15, 23, 42] as RGB,
  muted: [100, 116, 139] as RGB,
  border: [226, 232, 240] as RGB,
  soft: [241, 245, 249] as RGB,
  white: [255, 255, 255] as RGB,
  success: [5, 150, 105] as RGB,
};

const setFill = (d: jsPDF, c: RGB) => d.setFillColor(c[0], c[1], c[2]);
const setText = (d: jsPDF, c: RGB) => d.setTextColor(c[0], c[1], c[2]);
const setDraw = (d: jsPDF, c: RGB) => d.setDrawColor(c[0], c[1], c[2]);

function statusLabel(status: string): string {
  switch (status) {
    case "DRAFT":
      return "Rascunho";
    case "CLOSED":
      return "Fechada";
    case "REOPENED":
      return "Reaberta";
    default:
      return status;
  }
}

function sectionHeading(doc: jsPDF, title: string, x: number, y: number): number {
  setFill(doc, COLOR.cyan);
  doc.rect(x, y - 3, 3.2, 3.2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  setText(doc, COLOR.blue900);
  doc.text(title, x + 6, y);
  return y + 7;
}

export function buildMonthlySheetPdf(data: MonthlySheetPdfData): ArrayBuffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const contentW = pageW - marginX * 2;
  const period = `${getMonthName(data.month)} / ${data.year}`;

  // ===== Cabeçalho =====
  setFill(doc, COLOR.blue900);
  doc.rect(0, 0, pageW, 42, "F");
  setFill(doc, COLOR.cyan);
  doc.rect(0, 42, pageW, 1.5, "F");

  // Chip branco com a logo
  const chipW = 56;
  const chipH = 28;
  const chipX = marginX;
  const chipY = 7;
  setFill(doc, COLOR.white);
  doc.roundedRect(chipX, chipY, chipW, chipH, 3, 3, "F");
  const logoW = 48;
  const logoH = logoW / LILO_LOGO_ASPECT_RATIO;
  doc.addImage(
    LILO_LOGO_PNG_BASE64,
    "PNG",
    chipX + (chipW - logoW) / 2,
    chipY + (chipH - logoH) / 2,
    logoW,
    logoH,
  );

  // Título + período
  setText(doc, COLOR.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("FOLHA DE PAGAMENTO", pageW - marginX, 18, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  setText(doc, COLOR.cyanSoft);
  doc.text(period, pageW - marginX, 25, { align: "right" });

  // Badge de status
  const label = statusLabel(data.status).toUpperCase();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  const badgeW = doc.getTextWidth(label) + 8;
  const badgeH = 6;
  const badgeX = pageW - marginX - badgeW;
  const badgeY = 30;
  setFill(doc, COLOR.cyan);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 3, 3, "F");
  setText(doc, COLOR.blue900);
  doc.text(label, badgeX + badgeW / 2, badgeY + 4, { align: "center" });

  // ===== Bloco do funcionário =====
  let y = 55;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setText(doc, COLOR.muted);
  doc.text("FUNCIONÁRIO", marginX, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  setText(doc, COLOR.ink);
  doc.text(data.employee.name, marginX, y + 7);

  const now = new Date();
  const time = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setText(doc, COLOR.muted);
  doc.text("GERADO EM", pageW - marginX, y, { align: "right" });
  doc.setFontSize(9);
  setText(doc, COLOR.ink);
  doc.text(`${formatDate(now)} · ${time}`, pageW - marginX, y + 6, {
    align: "right",
  });

  y += 16;

  // ===== Resumo financeiro =====
  y = sectionHeading(doc, "Resumo Financeiro", marginX, y);

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX, top: 20, bottom: 22 },
    theme: "striped",
    showHead: false,
    styles: {
      font: "helvetica",
      fontSize: 10,
      cellPadding: { top: 2.6, bottom: 2.6, left: 4, right: 4 },
      textColor: COLOR.ink,
      lineWidth: 0,
    },
    bodyStyles: { fillColor: COLOR.white },
    alternateRowStyles: { fillColor: COLOR.soft },
    columnStyles: {
      0: { textColor: COLOR.muted },
      1: { halign: "right", fontStyle: "bold" },
    },
    body: [
      ["Valor bruto", formatCurrency(Number(data.grossTotal))],
      ["Percentual aplicado", `${Number(data.percentage)}%`],
      ["Ajuda de custo", formatCurrency(Number(data.costAllowance))],
      ["Vale", formatCurrency(Number(data.voucher))],
      ["INSS", formatCurrency(Number(data.inss))],
      ["Coparticipação", formatCurrency(Number(data.coparticipation))],
      ["Outros descontos", formatCurrency(Number(data.otherDiscounts))],
    ],
  });

  const afterSummary =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

  // Caixa de destaque do valor líquido
  const boxH = 16;
  setFill(doc, COLOR.blue900);
  doc.roundedRect(marginX, afterSummary, contentW, boxH, 3, 3, "F");
  setText(doc, COLOR.cyanSoft);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("VALOR LÍQUIDO", marginX + 6, afterSummary + boxH / 2, {
    baseline: "middle",
  });
  setText(doc, COLOR.white);
  doc.setFontSize(16);
  doc.text(formatCurrency(Number(data.netTotal)), pageW - marginX - 6, afterSummary + boxH / 2, {
    align: "right",
    baseline: "middle",
  });

  // ===== Serviços do período =====
  let sy = afterSummary + boxH + 12;
  sy = sectionHeading(doc, `Serviços do Período  (${data.services.length})`, marginX, sy);

  const serviceRows =
    data.services.length > 0
      ? data.services.map((s) => [
          formatDate(s.serviceDate),
          s.serviceNumber,
          formatCurrency(Number(s.baseValue)),
          formatCurrency(Number(s.additionalValue)),
          formatCurrency(Number(s.totalValue)),
        ])
      : [["—", "Nenhum serviço lançado no período", "", "", ""]];

  autoTable(doc, {
    startY: sy,
    margin: { left: marginX, right: marginX, top: 20, bottom: 22 },
    theme: "striped",
    styles: {
      font: "helvetica",
      fontSize: 9.5,
      cellPadding: { top: 2.8, bottom: 2.8, left: 4, right: 4 },
      textColor: COLOR.ink,
      lineWidth: 0,
    },
    headStyles: {
      fillColor: COLOR.blue900,
      textColor: COLOR.white,
      fontStyle: "bold",
      fontSize: 9.5,
    },
    bodyStyles: { fillColor: COLOR.white },
    alternateRowStyles: { fillColor: COLOR.soft },
    head: [["Data", "Nº Serviço", "Valor Base", "Adicional", "Total"]],
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: "auto" },
      2: { halign: "right", cellWidth: 32 },
      3: { halign: "right", cellWidth: 30 },
      4: {
        halign: "right",
        cellWidth: 34,
        fontStyle: "bold",
        textColor: COLOR.blue500,
      },
    },
    body: serviceRows,
  });

  // ===== Rodapé em todas as páginas =====
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    setDraw(doc, COLOR.border);
    doc.setLineWidth(0.2);
    doc.line(marginX, pageH - 14, pageW - marginX, pageH - 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setText(doc, COLOR.muted);
    doc.text("Lilo da Porto · Gestão de serviços", marginX, pageH - 9);
    doc.text(`Página ${i} de ${pageCount}`, pageW - marginX, pageH - 9, {
      align: "right",
    });
  }

  return doc.output("arraybuffer");
}
