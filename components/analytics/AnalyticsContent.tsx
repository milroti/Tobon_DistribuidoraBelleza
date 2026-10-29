"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { Icon } from "@/components/ui/Icon";
import { formatCOP } from "@/lib/utils/currency";
import type {
  AnalyticsDashboardData,
  AnalyticsPeriod,
} from "@/lib/actions/analytics";

interface AnalyticsContentProps {
  data: AnalyticsDashboardData;
  customFrom: string;
  customTo: string;
}

const PERIOD_OPTIONS: { value: AnalyticsPeriod; label: string; icon?: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mes" },
  { value: "custom", label: "Personalizado", icon: "tune" },
];

const BAR_COLORS = [
  "#951753",
  "#b5336b",
  "#ab2b63",
  "#fdcd74",
  "#7b5804",
];

function formatHourLabel(hour: number): string {
  const suffix = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12} ${suffix}`;
}

export function AnalyticsContent({
  data,
  customFrom,
  customTo,
}: AnalyticsContentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fromDate, setFromDate] = useState(
    customFrom || data.fromIso.slice(0, 10)
  );
  const [toDate, setToDate] = useState(customTo || data.toIso.slice(0, 10));

  const handlePeriodSelect = (nextPeriod: AnalyticsPeriod) => {
    if (nextPeriod === "custom") {
      startTransition(() => {
        router.push(
          `/analiticas?period=custom&from=${fromDate}&to=${toDate}`
        );
      });
      return;
    }

    startTransition(() => {
      router.push(`/analiticas?period=${nextPeriod}`);
    });
  };

  const handleApplyCustomDates = () => {
    if (!fromDate || !toDate) return;
    startTransition(() => {
      router.push(`/analiticas?period=custom&from=${fromDate}&to=${toDate}`);
    });
  };

  // Prepare hourly series (07:00 to 21:00 or full active hours)
  const hourlyMap = new Map(
    data.salesByHour.map((h) => [h.hour, h])
  );
  const hourlyChartData = Array.from({ length: 15 }, (_, idx) => {
    const hour = idx + 7; // 07:00 to 21:00
    const found = hourlyMap.get(hour);
    return {
      hour,
      label: `${String(hour).padStart(2, "0")}:00`,
      total_amount: found?.total_amount ?? 0,
      sale_count: found?.sale_count ?? 0,
    };
  });

  // Include any sales outside 07:00–21:00 if present
  for (const h of data.salesByHour) {
    if (h.hour < 7 || h.hour > 21) {
      hourlyChartData.push({
        hour: h.hour,
        label: `${String(h.hour).padStart(2, "0")}:00`,
        total_amount: h.total_amount,
        sale_count: h.sale_count,
      });
    }
  }
  hourlyChartData.sort((a, b) => a.hour - b.hour);

  // Peak hour calculation
  const peakHourEntry = data.salesByHour.reduce<{
    hour: number;
    total_amount: number;
  } | null>((best, curr) => {
    if (!best || curr.total_amount > best.total_amount) {
      return { hour: curr.hour, total_amount: curr.total_amount };
    }
    return best;
  }, null);

  // Prepare top 5 products horizontal bar data
  const topProductsChartData = data.topProducts.map((p, idx) => ({
    rank: `#${idx + 1}`,
    name:
      p.product_name.length > 22
        ? `${p.product_name.slice(0, 22)}…`
        : p.product_name,
    fullName: p.product_name,
    quantity: p.total_quantity,
    revenue: p.total_revenue,
  }));

  const maxProductQty = Math.max(
    1,
    ...data.topProducts.map((p) => p.total_quantity)
  );

  // Prepare daily chart & calendar heatmap data
  const dailyChartData = data.salesByDay.map((d) => {
    const parts = d.sale_date.split("-");
    const dayLabel =
      parts.length === 3 ? `${parts[2]}/${parts[1]}` : d.sale_date;
    return {
      date: d.sale_date,
      label: dayLabel,
      total_amount: d.total_amount,
      sale_count: d.sale_count,
    };
  });

  const maxDailyAmount = Math.max(
    1,
    ...data.salesByDay.map((d) => d.total_amount)
  );
  const dailyMap = new Map(
    data.salesByDay.map((d) => [d.sale_date, d])
  );

  // Calendar heatmap for the month of `toIso`
  const refDate = new Date(data.toIso);
  const calYear = refDate.getFullYear();
  const calMonth = refDate.getMonth(); // 0-indexed
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayWeek = new Date(calYear, calMonth, 1).getDay(); // 0=Sun..6=Sat
  const leadingEmptyDays = firstDayWeek === 0 ? 6 : firstDayWeek - 1; // Mon-based

  const monthLabel = refDate.toLocaleDateString("es-CO", {
    month: "long",
    year: "numeric",
  });

  // Seller performance total
  const totalSellerRevenue = Math.max(
    1,
    data.sellerPerformance.reduce((sum, s) => sum + s.total_amount, 0)
  );

  return (
    <div className="flex flex-col gap-5 pb-12 relative">
      {/* Loading Overlay */}
      {isPending && (
        <div className="fixed inset-0 bg-background/50 z-40 flex items-center justify-center backdrop-blur-[1px]">
          <div className="bg-surface-container-lowest px-4 py-3 rounded-xl shadow-md flex items-center gap-2.5 border border-outline-variant/30">
            <Icon
              name="progress_activity"
              size={22}
              className="text-primary animate-spin"
            />
            <span className="font-heading text-xs font-bold text-on-surface">
              Actualizando métricas...
            </span>
          </div>
        </div>
      )}

      {/* Top Context & Admin Badge */}
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-extrabold text-on-surface tracking-tight">
              Analíticas
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-heading text-[11px] font-bold">
              <Icon name="shield_person" size={14} fill />
              Admin
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-lowest shadow-xs border border-outline-variant/30 text-on-surface-variant">
            <Icon name="calendar_today" size={16} className="text-primary" />
            <span className="font-heading text-xs text-on-surface font-semibold capitalize">
              {monthLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-on-surface-variant text-xs">
          <Icon name="store" size={15} className="text-secondary" />
          <span>Tobón Distribuidora de Belleza • Reporte en tiempo real</span>
        </div>
      </div>

      {/* Period Selector Horizontal Chips */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {PERIOD_OPTIONS.map((opt) => {
            const active = data.period === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handlePeriodSelect(opt.value)}
                className={`px-4 py-2 rounded-full font-heading text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  active
                    ? "bg-primary-container text-on-primary shadow-sm"
                    : "bg-surface-container-lowest text-on-surface-variant border border-outline-variant/40 hover:text-primary hover:bg-surface-container-low"
                }`}
              >
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-surface-bright" />
                )}
                {opt.icon && <Icon name={opt.icon} size={14} />}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Custom Date Range Picker */}
        {data.period === "custom" && (
          <div className="bg-surface-container-lowest rounded-xl p-3.5 shadow-xs border border-outline-variant/40 flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
              <label
                htmlFor="analytics-from"
                className="font-heading text-[11px] font-bold text-on-surface-variant uppercase"
              >
                Desde
              </label>
              <input
                id="analytics-from"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/50 text-xs font-medium text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
              <label
                htmlFor="analytics-to"
                className="font-heading text-[11px] font-bold text-on-surface-variant uppercase"
              >
                Hasta
              </label>
              <input
                id="analytics-to"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/50 text-xs font-medium text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <button
              type="button"
              onClick={handleApplyCustomDates}
              className="h-9 px-4 rounded-lg bg-primary text-on-primary font-heading text-xs font-bold hover:bg-primary-container transition-colors cursor-pointer"
            >
              Aplicar rango
            </button>
          </div>
        )}
      </div>

      {/* KPI Summary Grid / Carousel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Ventas totales */}
        <div className="p-4 rounded-2xl bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary-fixed/30 via-transparent to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="font-heading text-xs font-semibold text-on-surface-variant">
              Ventas totales
            </span>
            <div className="w-8 h-8 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
              <Icon name="payments" size={18} />
            </div>
          </div>
          <div>
            <span className="font-heading text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight block truncate">
              {formatCOP(data.kpis.totalRevenue)}
            </span>
            <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-surface-container-low text-on-secondary-container font-heading text-[10px] font-bold">
              <Icon name="trending_up" size={12} />
              Ingresos netos COP
            </span>
          </div>
        </div>

        {/* KPI 2: Transacciones */}
        <div className="p-4 rounded-2xl bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="font-heading text-xs font-semibold text-on-surface-variant">
              Transacciones
            </span>
            <div className="w-8 h-8 rounded-xl bg-secondary-container/40 flex items-center justify-center text-secondary">
              <Icon name="receipt_long" size={18} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-heading text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
                {data.kpis.totalTransactions}
              </span>
              <span className="text-xs text-on-surface-variant">órdenes</span>
            </div>
            <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-heading text-[10px] font-semibold">
              Ventas completadas
            </span>
          </div>
        </div>

        {/* KPI 3: Ticket promedio */}
        <div className="p-4 rounded-2xl bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="font-heading text-xs font-semibold text-on-surface-variant">
              Ticket promedio
            </span>
            <div className="w-8 h-8 rounded-xl bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed-variant">
              <Icon name="point_of_sale" size={18} />
            </div>
          </div>
          <div>
            <span className="font-heading text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight block truncate">
              {formatCOP(data.kpis.averageTicket)}
            </span>
            <span className="inline-flex items-center gap-0.5 mt-1.5 px-2 py-0.5 rounded-full bg-surface-container-low text-on-secondary-container font-heading text-[10px] font-bold">
              Promedio por venta
            </span>
          </div>
        </div>

        {/* KPI 4: Productos vendidos */}
        <div className="p-4 rounded-2xl bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="font-heading text-xs font-semibold text-on-surface-variant">
              Uds. vendidas
            </span>
            <div className="w-8 h-8 rounded-xl bg-primary-fixed-dim/40 flex items-center justify-center text-primary">
              <Icon name="inventory" size={18} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-heading text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
                {data.kpis.totalUnitsSold}
              </span>
              <span className="text-xs text-on-surface-variant">uds.</span>
            </div>
            <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-heading text-[10px] font-semibold">
              {data.kpis.activeProductsCount} referencias activas
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 1. Top 5 Productos Más Vendidos (Horizontal Bar Chart + Ranked List) */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
                <Icon name="local_fire_department" size={18} />
              </div>
              <div>
                <h2 className="font-heading text-base font-bold text-on-surface leading-tight">
                  Productos más vendidos
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Top 5 por volumen de unidades
                </p>
              </div>
            </div>
            <span className="font-heading text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
              Top 5
            </span>
          </div>

          {topProductsChartData.length > 0 ? (
            <>
              {/* Recharts Horizontal Bar Chart */}
              <div className="w-full h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topProductsChartData}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="#f0eded"
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "#897177" }}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={130}
                      tick={{ fontSize: 11, fill: "#1b1c1c", fontWeight: 600 }}
                    />
                    <Tooltip
                      formatter={(value) => [`${value} uds`, "Unidades"]}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #ddbfc6",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="quantity" radius={[0, 6, 6, 0]} barSize={18}>
                      {topProductsChartData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={BAR_COLORS[index % BAR_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Stitch Ranked Breakdown List */}
              <div className="flex flex-col gap-3 pt-2 border-t border-outline-variant/30">
                {data.topProducts.map((item, idx) => {
                  const pct = Math.round(
                    (item.total_quantity / maxProductQty) * 100
                  );
                  return (
                    <div key={item.product_id} className="flex flex-col gap-1">
                      <div className="flex justify-between items-baseline min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0 pr-2">
                          <span
                            className={`font-heading text-xs font-bold shrink-0 ${
                              idx === 0
                                ? "text-primary"
                                : "text-on-surface-variant"
                            }`}
                          >
                            #{idx + 1}
                          </span>
                          <span className="font-heading text-xs font-semibold text-on-surface truncate">
                            {item.product_name}
                          </span>
                        </div>
                        <span className="font-heading text-xs font-bold text-on-surface shrink-0">
                          {formatCOP(item.total_revenue)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary-container transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-on-surface-variant">
                        <span>Ingresos generados</span>
                        <span className="font-semibold text-primary">
                          {item.total_quantity} uds
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-xs text-outline">
              No hay ventas registradas en este período para calcular el Top 5.
            </div>
          )}
        </div>

        {/* 2. Ventas por Hora del Día (Recharts Area/Line Chart) */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <Icon name="schedule" size={18} className="text-primary" />
                <h2 className="font-heading text-base font-bold text-on-surface">
                  Ventas por hora
                </h2>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Distribución horaria (zona America/Bogota)
              </p>
            </div>

            {peakHourEntry && peakHourEntry.total_amount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-heading text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Pico: {formatHourLabel(peakHourEntry.hour)} •{" "}
                {formatCOP(peakHourEntry.total_amount)}
              </span>
            )}
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={hourlyChartData}
                margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="posAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b5336b" stopOpacity={0.38} />
                    <stop offset="75%" stopColor="#ffd9e2" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#fcf9f8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0eded"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#564147" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#897177" }}
                  tickFormatter={(val) =>
                    val >= 1000 ? `$${Math.round(val / 1000)}k` : `$${val}`
                  }
                  width={52}
                />
                <Tooltip
                  formatter={(value) => [
                    formatCOP(Number(value ?? 0)),
                    "Ventas",
                  ]}
                  labelFormatter={(label) => `Hora: ${label}`}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #ddbfc6",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total_amount"
                  stroke="#b5336b"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#posAreaGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Ventas por Día (Bar Chart + Monthly Heatmap) */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <Icon
                  name="calendar_view_month"
                  size={18}
                  className="text-primary"
                />
                <h2 className="font-heading text-base font-bold text-on-surface">
                  Ventas por día
                </h2>
              </div>
              <p className="text-xs text-on-surface-variant capitalize">
                {monthLabel}
              </p>
            </div>

            <div className="flex items-center gap-1 text-on-surface-variant font-heading text-[10px] font-bold">
              <span>Bajo</span>
              <span className="w-2.5 h-2.5 rounded-xs bg-surface-container" />
              <span className="w-2.5 h-2.5 rounded-xs bg-primary-fixed" />
              <span className="w-2.5 h-2.5 rounded-xs bg-primary-container" />
              <span className="w-2.5 h-2.5 rounded-xs bg-primary" />
              <span>Alto</span>
            </div>
          </div>

          {/* Daily Bar Chart */}
          {dailyChartData.length > 0 && (
            <div className="w-full h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dailyChartData}
                  margin={{ top: 6, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0eded"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "#564147" }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#897177" }}
                    tickFormatter={(val) =>
                      val >= 1000 ? `$${Math.round(val / 1000)}k` : `$${val}`
                    }
                    width={48}
                  />
                  <Tooltip
                    formatter={(value) => [
                      formatCOP(Number(value ?? 0)),
                      "Total día",
                    ]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #ddbfc6",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="total_amount"
                    fill="#951753"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Calendar Heatmap Grid (Stitch Design) */}
          <div>
            <div className="grid grid-cols-7 gap-1 text-center font-heading text-[11px] text-on-surface-variant font-bold mb-1">
              <span>L</span>
              <span>M</span>
              <span>M</span>
              <span>J</span>
              <span>V</span>
              <span>S</span>
              <span>D</span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center">
              {Array.from({ length: leadingEmptyDays }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {Array.from({ length: daysInMonth }, (_, i) => {
                const dayNum = i + 1;
                const dateKey = `${calYear}-${String(calMonth + 1).padStart(
                  2,
                  "0"
                )}-${String(dayNum).padStart(2, "0")}`;
                const entry = dailyMap.get(dateKey);
                const amount = entry?.total_amount ?? 0;
                const ratio = amount > 0 ? amount / maxDailyAmount : 0;

                let cellStyle =
                  "bg-surface-container text-on-surface-variant";
                if (ratio >= 0.75) {
                  cellStyle =
                    "bg-primary text-on-primary font-bold ring-2 ring-primary-fixed/50";
                } else if (ratio >= 0.4) {
                  cellStyle = "bg-primary-container text-on-primary font-bold";
                } else if (ratio > 0) {
                  cellStyle =
                    "bg-primary-fixed text-on-primary-fixed font-semibold";
                }

                return (
                  <div
                    key={dateKey}
                    title={
                      amount > 0
                        ? `${dateKey}: ${formatCOP(amount)} (${entry?.sale_count} ventas)`
                        : `${dateKey}: Sin ventas`
                    }
                    className={`aspect-square rounded-lg flex items-center justify-center font-heading text-xs transition-colors ${cellStyle}`}
                  >
                    {dayNum}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. Rendimiento por Vendedor (Table + Progress Ranking) */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-container">
                <Icon name="military_tech" size={18} />
              </div>
              <div>
                <h2 className="font-heading text-base font-bold text-on-surface leading-tight">
                  Ventas por vendedor
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Rendimiento del equipo comercial
                </p>
              </div>
            </div>

            <span className="font-heading text-[11px] px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold">
              {data.sellerPerformance.length}{" "}
              {data.sellerPerformance.length === 1 ? "vendedor" : "vendedores"}
            </span>
          </div>

          {data.sellerPerformance.length > 0 ? (
            <div className="flex flex-col gap-4">
              {data.sellerPerformance.map((seller, idx) => {
                const initials = seller.seller_name
                  .split(" ")
                  .map((p) => p.charAt(0))
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                const sharePct =
                  Math.round(
                    (seller.total_amount / totalSellerRevenue) * 1000
                  ) / 10;

                return (
                  <div key={seller.seller_id} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-heading text-sm font-bold ${
                              idx === 0
                                ? "bg-primary-fixed text-primary"
                                : "bg-surface-container-high text-on-surface"
                            }`}
                          >
                            {initials}
                          </div>
                          <div
                            className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              idx === 0
                                ? "bg-secondary-container text-on-secondary-container"
                                : "bg-tertiary-fixed text-on-tertiary-fixed"
                            }`}
                          >
                            {idx === 0 ? (
                              <Icon name="star" size={11} fill />
                            ) : (
                              idx + 1
                            )}
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-heading text-sm font-bold text-on-surface truncate">
                              {seller.seller_name}
                            </span>
                            {idx === 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-heading text-[10px] font-bold">
                                Líder
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-on-surface-variant">
                            {seller.sale_count}{" "}
                            {seller.sale_count === 1
                              ? "venta registrada"
                              : "ventas registradas"}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`font-heading text-sm font-bold ${
                            idx === 0 ? "text-primary" : "text-on-surface"
                          }`}
                        >
                          {formatCOP(seller.total_amount)}
                        </span>
                        <p className="font-heading text-[11px] text-on-surface-variant">
                          {sharePct}% del total
                        </p>
                      </div>
                    </div>

                    <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          idx === 0
                            ? "bg-primary-container"
                            : idx === 1
                              ? "bg-surface-tint"
                              : "bg-secondary-container"
                        }`}
                        style={{ width: `${Math.min(100, sharePct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Summary Table */}
              <div className="overflow-x-auto pt-2 border-t border-outline-variant/30">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-outline font-heading uppercase text-[10px] border-b border-outline-variant/20">
                      <th className="py-2">Vendedor</th>
                      <th className="py-2 text-center">Transacciones</th>
                      <th className="py-2 text-right">Total vendido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/15">
                    {data.sellerPerformance.map((s) => (
                      <tr key={`row-${s.seller_id}`}>
                        <td className="py-2 font-medium text-on-surface">
                          {s.seller_name}
                        </td>
                        <td className="py-2 text-center text-on-surface-variant">
                          {s.sale_count}
                        </td>
                        <td className="py-2 text-right font-heading font-bold text-on-surface">
                          {formatCOP(s.total_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-outline">
              No hay ventas por vendedor registradas en este período.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

