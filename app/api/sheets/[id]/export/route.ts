import { NextRequest } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/auth-helpers";
import { getSheet } from "@/services/sheet.service";
import { getMonthName, formatDate } from "@/lib/utils";
import { buildMonthlySheetPdf } from "@/lib/pdf/monthly-sheet";
import ExcelJS from "exceljs";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const authUser = await requireApiAuth(request);
  if (!authUser) return apiError("UNAUTHORIZED", "Não autorizado", 401);

  const { id } = await params;
  const format = request.nextUrl.searchParams.get("format") ?? "pdf";
  const sheet = await getSheet(id, authUser.userId);
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
    details.addRow(["Data", "Nº Serviço", "Valor Base", "Adicional", "Total"]);
    for (const s of sheet.services) {
      details.addRow([
        formatDate(s.serviceDate),
        s.serviceNumber,
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

  const pdfBuffer = buildMonthlySheetPdf({
    employee: { name: sheet.employee.name },
    year: sheet.year,
    month: sheet.month,
    status: sheet.status,
    grossTotal: Number(sheet.grossTotal),
    percentage: Number(sheet.percentage),
    costAllowance: Number(sheet.costAllowance),
    voucher: Number(sheet.voucher),
    inss: Number(sheet.inss),
    coparticipation: Number(sheet.coparticipation),
    otherDiscounts: Number(sheet.otherDiscounts),
    netTotal: Number(sheet.netTotal),
    services: sheet.services.map((s) => ({
      serviceDate: s.serviceDate,
      serviceNumber: s.serviceNumber,
      baseValue: Number(s.baseValue),
      additionalValue: Number(s.additionalValue),
      totalValue: Number(s.totalValue),
    })),
  });

  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="folha-${sheet.employee.name}-${period}.pdf"`,
    },
  });
}
