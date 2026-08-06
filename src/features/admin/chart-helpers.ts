import type { ChartPoint } from "./components/charts";
import type { SeriesPoint, TopCategory, TopCustomer, TopProduct } from "./admin-types";

export const seriesToRevenue = (points: SeriesPoint[] | undefined): ChartPoint[] =>
  (points ?? []).map((p) => ({ x: p.period, y: p.valueInKobo / 100 }));

export const seriesToCount = (points: SeriesPoint[] | undefined): ChartPoint[] =>
  (points ?? []).map((p) => ({ x: p.period, y: p.count }));

export const topProductsToRevenue = (points: TopProduct[] | undefined): ChartPoint[] =>
  (points ?? []).map((p) => ({ x: p.productName, y: p.revenueInKobo / 100 }));

export const topProductsToUnits = (points: TopProduct[] | undefined): ChartPoint[] =>
  (points ?? []).map((p) => ({ x: p.productName, y: p.unitsSold }));

export const topCategoriesToRevenue = (points: TopCategory[] | undefined): ChartPoint[] =>
  (points ?? []).map((p) => ({ x: p.categoryName, y: p.revenueInKobo / 100 }));

export const topCustomersToSpend = (points: TopCustomer[] | undefined): ChartPoint[] =>
  (points ?? []).map((p) => ({ x: p.fullName, y: p.totalSpentInKobo / 100 }));

export const recordToChartPoints = (record: Record<string, number> | undefined): ChartPoint[] =>
  Object.entries(record ?? {}).map(([x, y]) => ({ x, y }));
