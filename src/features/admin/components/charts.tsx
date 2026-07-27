"use client";

import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { formatNaira } from "@/lib/format";
import type { SeriesPoint } from "../admin-types";

/** Chart palette derived from the design tokens so it tracks light/dark themes. */
export const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--success))",
  "#F59E0B",
  "hsl(var(--destructive))",
  "#8B5CF6",
  "#EC4899",
];

const axisProps = {
  stroke: "hsl(var(--muted-foreground))",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

/**
 * Analytics DTO field names aren't pinned by the contract, so the charts read
 * the first key that exists rather than assuming one. This keeps them rendering
 * against the real payload without a schema change.
 */
function pickX(p: SeriesPoint): string {
  return (p.date ?? p.label ?? p.period ?? p.name ?? "") as string;
}
function pickY(p: SeriesPoint, preferred?: string): number {
  if (preferred && typeof p[preferred] === "number") return p[preferred] as number;
  const candidates = [p.value, p.revenue, p.orders, p.count, p.amount];
  return (candidates.find((v) => typeof v === "number") as number) ?? 0;
}

export function normalizeSeries(series: SeriesPoint[] | undefined, valueKey?: string) {
  return (series ?? []).map((p) => ({ x: pickX(p), y: pickY(p, valueKey), raw: p }));
}

function ChartFrame({ title, subtitle, children, action, empty }: {
  title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode; empty?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="font-bold tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {action}
        </div>
        {empty ? (
          <div className="grid h-56 place-items-center text-center">
            <p className="text-sm text-muted-foreground">No data for this period yet.</p>
          </div>
        ) : (
          <div className="h-56 w-full">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Recharts v3 types the tooltip formatter value as `ValueType | undefined`, so
 * formatters coerce defensively rather than assuming a number.
 */
function makeFormatter(label: string, currency: boolean) {
  return (value: unknown): [string, string] => {
    const n = typeof value === "number" ? value : Number(value ?? 0);
    const safe = Number.isFinite(n) ? n : 0;
    return [currency ? formatNaira(safe) : safe.toLocaleString(), label];
  };
}

const tooltipStyle = {
  contentStyle: {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "0.75rem",
    fontSize: "12px",
    color: "hsl(var(--foreground))",
  },
  labelStyle: { color: "hsl(var(--muted-foreground))", marginBottom: 4 },
} as const;

export function RevenueTrendChart({ data, title = "Revenue trend", subtitle }: {
  data: SeriesPoint[] | undefined; title?: string; subtitle?: string;
}) {
  const points = normalizeSeries(data, "revenue");
  return (
    <ChartFrame title={title} subtitle={subtitle} empty={points.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.28} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="x" {...axisProps} />
          <YAxis {...axisProps} width={64}
            tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))} />
          <Tooltip {...tooltipStyle} formatter={makeFormatter("Revenue", true)} />
          <Area type="monotone" dataKey="y" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#revFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function OrdersBarChart({ data, title = "Sales overview", subtitle }: {
  data: SeriesPoint[] | undefined; title?: string; subtitle?: string;
}) {
  const points = normalizeSeries(data, "orders");
  return (
    <ChartFrame title={title} subtitle={subtitle} empty={points.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="x" {...axisProps} />
          <YAxis {...axisProps} width={44} allowDecimals={false} />
          <Tooltip {...tooltipStyle} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
          <Bar dataKey="y" name="Orders" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={38} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function GrowthLineChart({ data, title = "Customer growth", subtitle }: {
  data: SeriesPoint[] | undefined; title?: string; subtitle?: string;
}) {
  const points = normalizeSeries(data, "count");
  return (
    <ChartFrame title={title} subtitle={subtitle} empty={points.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="x" {...axisProps} />
          <YAxis {...axisProps} width={44} allowDecimals={false} />
          <Tooltip {...tooltipStyle} />
          <Line type="monotone" dataKey="y" name="Customers" stroke="hsl(var(--accent))" strokeWidth={2}
            dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function HorizontalBarChart({ data, title, subtitle, valueKey, currency }: {
  data: SeriesPoint[] | undefined; title: string; subtitle?: string; valueKey?: string; currency?: boolean;
}) {
  const points = normalizeSeries(data, valueKey).slice(0, 8);
  return (
    <ChartFrame title={title} subtitle={subtitle} empty={points.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
          <XAxis type="number" {...axisProps} />
          <YAxis type="category" dataKey="x" {...axisProps} width={110} />
          <Tooltip {...tooltipStyle} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
            formatter={makeFormatter(title, !!currency)} />
          <Bar dataKey="y" radius={[0, 6, 6, 0]} maxBarSize={22}>
            {points.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function DistributionPieChart({ data, title, subtitle, currency }: {
  data: SeriesPoint[] | undefined; title: string; subtitle?: string; currency?: boolean;
}) {
  const points = normalizeSeries(data);
  return (
    <ChartFrame title={title} subtitle={subtitle} empty={points.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={points} dataKey="y" nameKey="x" cx="50%" cy="50%" innerRadius={44} outerRadius={72} paddingAngle={2}>
            {points.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Pie>
          <Tooltip {...tooltipStyle} formatter={makeFormatter(title, !!currency)} />
          <Legend verticalAlign="bottom" height={28}
            formatter={(value: string) => <span style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
