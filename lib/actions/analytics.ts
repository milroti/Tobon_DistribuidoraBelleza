"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  TopProduct,
  SalesByHour,
  SalesByDay,
  SellerPerformance,
} from "@/lib/types/database";

export type AnalyticsPeriod = "today" | "week" | "month" | "custom";

export interface AnalyticsDashboardData {
  period: AnalyticsPeriod;
  fromIso: string;
  toIso: string;
  kpis: {
    totalRevenue: number;
    totalTransactions: number;
    averageTicket: number;
    totalUnitsSold: number;
    activeProductsCount: number;
  };
  topProducts: TopProduct[];
  salesByHour: SalesByHour[];
  salesByDay: SalesByDay[];
  sellerPerformance: SellerPerformance[];
}

function resolveDateRange(
  period: AnalyticsPeriod,
  customFrom?: string,
  customTo?: string
): { fromIso: string; toIso: string } {
  const now = new Date();

  if (period === "custom" && customFrom && customTo) {
    const start = new Date(`${customFrom}T00:00:00-05:00`);
    const end = new Date(`${customTo}T23:59:59.999-05:00`);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      return {
        fromIso: start.toISOString(),
        toIso: end.toISOString(),
      };
    }
  }

  if (period === "today") {
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    );
    const end = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );
    return { fromIso: start.toISOString(), toIso: end.toISOString() };
  }

  if (period === "week") {
    const dayOfWeek = now.getDay(); // 0 (Sun) - 6 (Sat)
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - diffToMonday,
      0,
      0,
      0,
      0
    );
    const end = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );
    return { fromIso: start.toISOString(), toIso: end.toISOString() };
  }

  // Default: "month"
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );
  return { fromIso: start.toISOString(), toIso: end.toISOString() };
}

export async function getAnalyticsDashboard(opts?: {
  period?: AnalyticsPeriod;
  from?: string;
  to?: string;
}): Promise<AnalyticsDashboardData> {
  const period = opts?.period ?? "month";
  const { fromIso, toIso } = resolveDateRange(period, opts?.from, opts?.to);
  const supabase = await createClient();

  const [
    topRes,
    hourRes,
    dayRes,
    sellerRes,
    ticketRes,
    unitsRes,
    activeProdsRes,
  ] = await Promise.all([
    (supabase.rpc as any)("top_products", {
      p_from: fromIso,
      p_to: toIso,
      p_limit: 5,
    }) as Promise<{ data: TopProduct[] | null; error: unknown }>,
    (supabase.rpc as any)("sales_by_hour", {
      p_from: fromIso,
      p_to: toIso,
    }) as Promise<{ data: SalesByHour[] | null; error: unknown }>,
    (supabase.rpc as any)("sales_by_day", {
      p_from: fromIso,
      p_to: toIso,
    }) as Promise<{ data: SalesByDay[] | null; error: unknown }>,
    (supabase.rpc as any)("seller_performance", {
      p_from: fromIso,
      p_to: toIso,
    }) as Promise<{ data: SellerPerformance[] | null; error: unknown }>,
    (supabase.rpc as any)("average_ticket", {
      p_from: fromIso,
      p_to: toIso,
    }) as Promise<{
      data:
        | { avg_ticket: number; total_sales: number; total_revenue: number }[]
        | null;
      error: unknown;
    }>,
    supabase
      .from("sale_items")
      .select("quantity, sales!inner(status, created_at)")
      .eq("sales.status", "completed")
      .gte("sales.created_at", fromIso)
      .lte("sales.created_at", toIso) as unknown as Promise<{
      data: { quantity: number }[] | null;
    }>,
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true) as unknown as Promise<{ count: number | null }>,
  ]);

  const ticketRow = ticketRes.data?.[0];
  const totalRevenue = Number(ticketRow?.total_revenue ?? 0);
  const totalTransactions = Number(ticketRow?.total_sales ?? 0);
  const averageTicket = Number(ticketRow?.avg_ticket ?? 0);

  const totalUnitsSold = (unitsRes.data ?? []).reduce(
    (sum, item) => sum + Number(item.quantity ?? 0),
    0
  );

  const topProducts: TopProduct[] = (topRes.data ?? []).map((p) => ({
    product_id: p.product_id,
    product_name: p.product_name,
    total_quantity: Number(p.total_quantity ?? 0),
    total_revenue: Number(p.total_revenue ?? 0),
  }));

  const salesByHour: SalesByHour[] = (hourRes.data ?? []).map((h) => ({
    hour: Number(h.hour),
    sale_count: Number(h.sale_count ?? 0),
    total_amount: Number(h.total_amount ?? 0),
  }));

  const salesByDay: SalesByDay[] = (dayRes.data ?? []).map((d) => ({
    sale_date: String(d.sale_date),
    sale_count: Number(d.sale_count ?? 0),
    total_amount: Number(d.total_amount ?? 0),
  }));

  const sellerPerformance: SellerPerformance[] = (sellerRes.data ?? []).map(
    (s) => ({
      seller_id: s.seller_id,
      seller_name: s.seller_name,
      sale_count: Number(s.sale_count ?? 0),
      total_amount: Number(s.total_amount ?? 0),
    })
  );

  return {
    period,
    fromIso,
    toIso,
    kpis: {
      totalRevenue,
      totalTransactions,
      averageTicket,
      totalUnitsSold,
      activeProductsCount: activeProdsRes.count ?? 0,
    },
    topProducts,
    salesByHour,
    salesByDay,
    sellerPerformance,
  };
}

