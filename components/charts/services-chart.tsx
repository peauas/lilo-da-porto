"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getMonthName } from "@/lib/utils";

interface ChartDataPoint {
  year: number;
  month: number;
  count: number;
  total: number;
}

export function ServicesChart({ data }: { data: ChartDataPoint[] }) {
  const chartData = data.map((d) => ({
    name: `${getMonthName(d.month).slice(0, 3)}/${String(d.year).slice(2)}`,
    servicos: d.count,
    valor: d.total,
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="name" className="text-xs" />
          <YAxis className="text-xs" />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Bar dataKey="servicos" fill="#003087" radius={[4, 4, 0, 0]} name="Serviços" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
