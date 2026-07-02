import { NextRequest } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/auth-helpers";
import { getSheet } from "@/services/sheet.service";
import { getMonthName, formatCurrency, formatDate } from "@/lib/utils";
import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const authUser = await requireApiAuth(request);
  if (!authUser) return apiError("UNAUTHORIZED", "Não autorizado", 401);

  const { id } = await params;
  const format = request.nextUrl.searchParams.get("format") ?? "pdf";
  const sheet = await getSheet(id);
  if (!sheet) return apiError("NOT_FOUND", "Folha não encontrada", 404);

  const period = `${getMonthName(sheet.month)}/${sheet.year}`;

  if (format === "excel") {
    const workbook = new ExcelJS.Workbook();
    const summary = workbook.addWorksheet("Resumo");
    summary.addRows([
      ["Lilo da Porto - Folha Mensal"],
      ["Funcionário", sheet.employee.name],
      ["Período", period],
      ["Status", sheet.status],
      [],
      ["Valor bruto", Number(sheet.grossTotal)],
      ["Percentual", Number(sheet.percentage)],
      ["Ajuda de custo", Number(sheet.costAllowance)],
      ["Vale", Number(sheet.voucher)],
      ["INSS", Number(sheet.inss)],
      ["Coparticipação", Number(sheet.coparticipation)],
      ["Outros descontos", Number(sheet.otherDiscounts)],
      ["Valor líquido", Number(sheet.netTotal)],
    ]);

    const details = workbook.addWorksheet("Serviços");
    details.addRow(["Data", "Nº Serviço", "QRU", "Valor Base", "Adicional", "Total"]);
    for (const s of sheet.services) {
      details.addRow([
        formatDate(s.serviceDate),
        s.serviceNumber,
        s.qru,
        Number(s.baseValue),
        Number(s.additionalValue),
        Number(s.totalValue),
      ]);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="folha-${sheet.employee.name}-${period}.xlsx"`,
      },
    });
  }

  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.setTextColor(0, 48, 135);
  doc.text("Lilo da Porto", 14, 20);
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Folha Mensal - ${period}`, 14, 30);
  doc.text(`Funcionário: ${sheet.employee.name}`, 14, 38);

  autoTable(doc, {
    startY: 48,
    head: [["Campo", "Valor"]],
    body: [
      ["Valor bruto", formatCurrency(Number(sheet.grossTotal))],
      ["Percentual", `${sheet.percentage}%`],
      ["Ajuda de custo", formatCurrency(Number(sheet.costAllowance))],
      ["Vale", formatCurrency(Number(sheet.voucher))],
      ["INSS", formatCurrency(Number(sheet.inss))],
      ["Coparticipação", formatCurrency(Number(sheet.coparticipation))],
      ["Outros descontos", formatCurrency(Number(sheet.otherDiscounts))],
      ["Valor líquido", formatCurrency(Number(sheet.netTotal))],
    ],
  });

  autoTable(doc, {
    startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10,
    head: [["Data", "Serviço", "QRU", "Total"]],
    body: sheet.services.map((s) => [
      formatDate(s.serviceDate),
      s.serviceNumber,
      s.qru,
      formatCurrency(Number(s.totalValue)),
    ]),
  });

  const pdfBuffer = doc.output("arraybuffer");
  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="folha-${sheet.employee.name}-${period}.pdf"`,
    },
  });
}
