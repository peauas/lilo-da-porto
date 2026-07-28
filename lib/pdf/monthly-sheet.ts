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

// Mesma paleta de app/globals.css (--primary, --border, --muted-foreground etc.)
// e das variantes do componente Badge, para o PDF ficar consistente com o site.
const COLOR = {
  primary: [20, 112, 239] as RGB, // #1470ef
  primaryDark: [15, 82, 184] as RGB, // #0f52b8
  primarySoftText: [214, 231, 253] as RGB, // texto secundário sobre fundo primary
  ink: [11, 18, 32] as RGB, // #0b1220
  muted: [100, 116, 139] as RGB, // #64748b
  mutedBg: [241, 245, 249] as RGB, // #f1f5f9
  border: [230, 234, 241] as RGB, // #e6eaf1
  white: [255, 255, 255] as RGB,
  success: [5, 150, 105] as RGB, // #059669
  successSoftBg: [219, 244, 236] as RGB,
  successSoftText: [4, 120, 87] as RGB,
  warning: [217, 119, 6] as RGB, // #d97706
  warningSoftBg: [253, 240, 218] as RGB,
  warningSoftText: [180, 83, 9] as RGB,
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

/** Mesmas cores das variantes do componente Badge (success/warning) usado no site. */
function statusColors(status: string): { bg: RGB; text: RGB } {
  if (status === "CLOSED") return { bg: COLOR.successSoftBg, text: COLOR.successSoftText };
  return { bg: COLOR.warningSoftBg, text: COLOR.warningSoftText };
}

function sectionCardHeader(doc: jsPDF, title: string, x: number, y: number, w: number): number {
  const headingH = 12;
  setFill(doc, COLOR.white);
  doc.rect(x, y, w, headingH, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  setText(doc, COLOR.ink);
  doc.text(title, x + 6, y + headingH / 2 + 1.2);
  setDraw(doc, COLOR.border);
  doc.setLineWidth(0.25);
  doc.line(x, y + headingH, x + w, y + headingH);
  return y + headingH;
}

/**
 * Desenha a borda do card. Se a tabela quebrou para outra(s) página(s) — o
 * finalY do autoTable é relativo à última página, não ao documento como um
 * todo — a borda é dividida por página (começo/meio/fim) em vez de um único
 * rect com altura calculada entre páginas diferentes.
 */
function closeCard(
  doc: jsPDF,
  x: number,
  w: number,
  startPage: number,
  startY: number,
  endPage: number,
  endY: number,
  pageH: number,
  tableMarginTop: number,
  tableMarginBottom: number,
) {
  setDraw(doc, COLOR.border);
  doc.setLineWidth(0.3);

  if (startPage === endPage) {
    doc.setPage(startPage);
    doc.rect(x, startY, w, endY - startY, "S");
    return;
  }

  doc.setPage(startPage);
  doc.rect(x, startY, w, pageH - tableMarginBottom - startY, "S");

  for (let p = startPage + 1; p < endPage; p++) {
    doc.setPage(p);
    doc.rect(x, tableMarginTop, w, pageH - tableMarginBottom - tableMarginTop, "S");
  }

  doc.setPage(endPage);
  doc.rect(x, tableMarginTop, w, endY - tableMarginTop, "S");
}

export function buildMonthlySheetPdf(data: MonthlySheetPdfData): ArrayBuffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const contentW = pageW - marginX * 2;
  const period = `${getMonthName(data.month)} / ${data.year}`;

  // ===== Cabeçalho =====
  setFill(doc, COLOR.primary);
  doc.rect(0, 0, pageW, 40, "F");
  setFill(doc, COLOR.primaryDark);
  doc.rect(0, 40, pageW, 1, "F");

  // Chip branco com a logo (fundo claro necessário: "Lilo" é azul na própria logo)
  const chipW = 52;
  const chipH = 26;
  const chipX = marginX;
  const chipY = 7;
  setFill(doc, COLOR.white);
  doc.roundedRect(chipX, chipY, chipW, chipH, 3, 3, "F");
  const logoW = 44;
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
  doc.text("FOLHA DE PAGAMENTO", pageW - marginX, 17, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  setText(doc, COLOR.primarySoftText);
  doc.text(period, pageW - marginX, 25, { align: "right" });

  // ===== Bloco do funcionário + status =====
  let y = 54;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setText(doc, COLOR.muted);
  doc.text("FUNCIONÁRIO", marginX, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  setText(doc, COLOR.ink);
  doc.text(data.employee.name, marginX, y + 7);

  const label = statusLabel(data.status).toUpperCase();
  const { bg: badgeBg, text: badgeText } = statusColors(data.status);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  const badgeW = doc.getTextWidth(label) + 8;
  const badgeH = 6;
  doc.setFillColor(badgeBg[0], badgeBg[1], badgeBg[2]);
  doc.roundedRect(marginX, y + 12, badgeW, badgeH, 3, 3, "F");
  setText(doc, badgeText);
  doc.text(label, marginX + badgeW / 2, y + 12 + 4, { align: "center" });

  const now = new Date();
  const time = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setText(doc, COLOR.muted);
  doc.text("GERADO EM", pageW - marginX, y, { align: "right" });
  doc.setFontSize(9);
  setText(doc, COLOR.ink);
  doc.text(`${formatDate(now)} · ${time}`, pageW - marginX, y + 6, { align: "right" });

  y += 26;

  // ===== Resumo financeiro (card) =====
  const summaryCardTop = y;
  const summaryStartY = sectionCardHeader(doc, "Resumo Financeiro", marginX, y, contentW);

  autoTable(doc, {
    startY: summaryStartY,
    margin: { left: marginX, right: marginX, top: 20, bottom: 22 },
    theme: "plain",
    showHead: false,
    styles: {
      font: "helvetica",
      fontSize: 10,
      cellPadding: { top: 2.8, bottom: 2.8, left: 6, right: 6 },
      textColor: COLOR.ink,
      lineWidth: 0,
    },
    bodyStyles: { fillColor: COLOR.white },
    alternateRowStyles: { fillColor: COLOR.mutedBg },
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

  const summaryFinalY =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  closeCard(doc, marginX, contentW, 1, summaryCardTop, doc.getNumberOfPages(), summaryFinalY, pageH, 20, 22);

  const afterSummary = summaryFinalY + 6;

  // Caixa de destaque do valor líquido
  const boxH = 17;
  setFill(doc, COLOR.primary);
  doc.roundedRect(marginX, afterSummary, contentW, boxH, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  setText(doc, COLOR.primarySoftText);
  doc.text("VALOR LÍQUIDO", marginX + 6, afterSummary + boxH / 2, { baseline: "middle" });
  setText(doc, COLOR.white);
  doc.setFontSize(17);
  doc.text(formatCurrency(Number(data.netTotal)), pageW - marginX - 6, afterSummary + boxH / 2, {
    align: "right",
    baseline: "middle",
  });

  // ===== Serviços do período (card) =====
  const servicesCardTop = afterSummary + boxH + 12;
  const servicesStartPage = doc.getNumberOfPages();
  const servicesStartY = sectionCardHeader(
    doc,
    `Serviços do Período  (${data.services.length})`,
    marginX,
    servicesCardTop,
    contentW,
  );

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
    startY: servicesStartY,
    margin: { left: marginX, right: marginX, top: 20, bottom: 22 },
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 9.5,
      cellPadding: { top: 3, bottom: 3, left: 6, right: 6 },
      textColor: COLOR.ink,
      lineWidth: 0,
    },
    headStyles: {
      fillColor: COLOR.primary,
      textColor: COLOR.white,
      fontStyle: "bold",
      fontSize: 9.5,
    },
    bodyStyles: { fillColor: COLOR.white },
    alternateRowStyles: { fillColor: COLOR.mutedBg },
    head: [["Data", "Nº Serviço", "Valor Base", "Adicional", "Total"]],
    columnStyles: {
      0: { cellWidth: 24, cellPadding: { top: 3, bottom: 3, left: 2, right: 2 } },
      1: { cellWidth: "auto" },
      2: { halign: "right", cellWidth: 32 },
      3: { halign: "right", cellWidth: 30 },
      4: {
        halign: "right",
        cellWidth: 34,
        fontStyle: "bold",
        textColor: COLOR.primaryDark,
      },
    },
    body: serviceRows,
  });

  const servicesFinalY =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  closeCard(
    doc,
    marginX,
    contentW,
    servicesStartPage,
    servicesCardTop,
    doc.getNumberOfPages(),
    servicesFinalY,
    pageH,
    20,
    22,
  );

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
    doc.text(`Página ${i} de ${pageCount}`, pageW - marginX, pageH - 9, { align: "right" });
  }

  return doc.output("arraybuffer");
}
