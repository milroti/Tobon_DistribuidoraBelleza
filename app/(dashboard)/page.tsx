import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/Icon";
import { formatCOP } from "@/lib/utils/currency";
import type { Product, Sale, UserRole } from "@/lib/types/database";

interface SaleWithItemQuantities extends Sale {
  sale_items?: { quantity: number }[];
}

export default async function DashboardHomePage() {
  const supabase = await createClient();

  const now = new Date();
  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  ).toISOString();
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  ).toISOString();

  const [
    {
      data: { user },
    },
    todaySalesRes,
    productsRes,
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("sales")
      .select("*, sale_items(quantity)")
      .eq("status", "completed")
      .gte("created_at", startOfDay)
      .lte("created_at", endOfDay)
      .order("created_at", { ascending: false }) as unknown as Promise<{
      data: SaleWithItemQuantities[] | null;
    }>,
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("stock", { ascending: true }) as unknown as Promise<{
      data: Product[] | null;
    }>,
  ]);

  let fullName = user?.email?.split("@")[0] ?? "Usuario";
  let userRole: UserRole = "vendor";

  if (user) {
    const { data: profile } = (await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single()) as { data: { full_name: string; role: string } | null };

    if (profile?.full_name) {
      fullName = profile.full_name;
    }
    if (profile?.role === "admin") {
      userRole = "admin";
    }
  }

  const firstName = fullName.split(" ")[0];
  const formattedDate = now.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Calculate today's KPIs
  const todaySales = todaySalesRes.data ?? [];
  const todayOrders = todaySales.length;
  const todayRevenue = todaySales.reduce(
    (sum, s) => sum + Number(s.total ?? 0),
    0
  );
  const todayUnitsSold = todaySales.reduce((sum, s) => {
    const itemsQty = (s.sale_items ?? []).reduce(
      (acc, item) => acc + Number(item.quantity ?? 0),
      0
    );
    return sum + itemsQty;
  }, 0);
  const todayAvgTicket =
    todayOrders > 0 ? Math.round(todayRevenue / todayOrders) : 0;

  // Filter low-stock products (stock < min_stock)
  const allProducts = productsRes.data ?? [];
  const lowStockProducts = allProducts.filter(
    (p) => p.stock < p.min_stock
  );

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Saludo & Contexto de Sede */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-heading text-[11px] font-bold shadow-xs">
            <Icon name="location_on" size={14} className="text-primary" />
            <span>Tobón • Distribuidora de Belleza</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success-light text-success-text font-heading text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span>Sincronizado</span>
          </div>
        </div>

        <div className="mt-1 flex items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              ¡Hola, {firstName}! ✨
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant capitalize mt-0.5">
              {formattedDate} • Turno activo
            </p>
          </div>

          {userRole === "admin" && (
            <Link
              href="/analiticas"
              aria-label="Ver analíticas"
              title="Ver analíticas"
              className="w-11 h-11 rounded-xl bg-surface-container-lowest border border-outline-variant/40 flex items-center justify-center text-primary shadow-xs hover:bg-primary-fixed/30 active:scale-95 transition-all shrink-0"
            >
              <Icon name="bar_chart" size={22} />
            </Link>
          )}
        </div>
      </section>

      {/* Resumen del Día: Carrusel Horizontal en Mobile / Grid en Desktop */}
      <section className="w-full">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <Icon name="query_stats" size={18} className="text-primary" />
            <h2 className="font-heading text-base font-bold text-on-surface">
              Resumen del Día
            </h2>
          </div>
          <span className="font-heading text-[11px] font-bold text-primary tracking-wide uppercase">
            Tiempo Real
          </span>
        </div>

        <div className="flex md:grid md:grid-cols-3 overflow-x-auto snap-x snap-mandatory gap-3 pb-2 pt-0.5 no-scrollbar">
          {/* Tarjeta 1: Ventas de hoy */}
          <div className="snap-start shrink-0 w-[260px] md:w-auto p-4 rounded-2xl bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-heading text-xs font-semibold text-on-surface-variant">
                Ventas de hoy
              </span>
              <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-primary shadow-xs">
                <Icon name="payments" size={18} />
              </div>
            </div>
            <div className="my-2.5">
              <p className="font-heading text-2xl font-extrabold text-on-surface tracking-tight">
                {formatCOP(todayRevenue)}{" "}
                <span className="font-heading text-[11px] text-on-surface-variant font-normal">
                  COP
                </span>
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-success-light text-success-text font-heading text-[11px] font-bold">
                <Icon name="trending_up" size={12} />
                Activo
              </span>
              <span className="text-xs text-on-surface-variant">
                Jornada de hoy
              </span>
            </div>
          </div>

          {/* Tarjeta 2: Productos vendidos */}
          <div className="snap-start shrink-0 w-[240px] md:w-auto p-4 rounded-2xl bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-heading text-xs font-semibold text-on-surface-variant">
                Productos vendidos
              </span>
              <div className="w-8 h-8 rounded-lg bg-secondary-fixed flex items-center justify-center text-secondary shadow-xs">
                <Icon name="shopping_bag" size={18} />
              </div>
            </div>
            <div className="my-2.5">
              <p className="font-heading text-2xl font-extrabold text-on-surface tracking-tight">
                {todayUnitsSold}{" "}
                <span className="font-heading text-sm text-on-surface-variant font-normal">
                  uds
                </span>
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-on-surface-variant">
              <Icon name="receipt" size={15} className="text-secondary" />
              <span>
                En {todayOrders} {todayOrders === 1 ? "orden" : "órdenes"} hoy
              </span>
            </div>
          </div>

          {/* Tarjeta 3: Ticket promedio */}
          <div className="snap-start shrink-0 w-[250px] md:w-auto p-4 rounded-2xl bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-heading text-xs font-semibold text-on-surface-variant">
                Ticket promedio
              </span>
              <div className="w-8 h-8 rounded-lg bg-primary-fixed-dim/40 flex items-center justify-center text-primary-container shadow-xs">
                <Icon name="loyalty" size={18} />
              </div>
            </div>
            <div className="my-2.5">
              <p className="font-heading text-2xl font-extrabold text-on-surface tracking-tight">
                {formatCOP(todayAvgTicket)}{" "}
                <span className="font-heading text-[11px] text-on-surface-variant font-normal">
                  COP
                </span>
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-primary-container" />
              <span>Promedio por transacción</span>
            </div>
          </div>
        </div>
      </section>

      {/* Acciones Rápidas (Grid 2x2 en mobile, 4 cols en lg) */}
      <section>
        <div className="flex items-center gap-1.5 mb-2.5">
          <Icon name="bolt" size={18} className="text-primary" />
          <h2 className="font-heading text-base font-bold text-on-surface">
            Acciones Rápidas
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Acción 1: Nueva Venta (Hero Action) */}
          <Link
            href="/ventas"
            className="flex flex-col justify-between p-4 h-32 rounded-2xl bg-primary text-on-primary shadow-md hover:bg-primary-container active:scale-[0.98] transition-all text-left"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-10 h-10 rounded-xl bg-on-primary/15 flex items-center justify-center text-on-primary">
                <Icon name="point_of_sale" size={24} />
              </div>
              <Icon
                name="arrow_forward"
                size={18}
                className="text-on-primary/70"
              />
            </div>
            <div>
              <span className="font-heading text-base font-bold leading-tight block text-on-primary">
                Nueva venta
              </span>
              <span className="text-xs text-on-primary/80 mt-0.5 block">
                POS Mostrador
              </span>
            </div>
          </Link>

          {/* Acción 2: Agregar Producto */}
          <Link
            href="/inventario/nuevo"
            className="flex flex-col justify-between p-4 h-32 rounded-2xl bg-surface-container-lowest text-on-surface shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-outline-variant/30 hover:border-primary/40 active:scale-[0.98] transition-all text-left"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
                <Icon name="add_circle" size={24} />
              </div>
              <Icon
                name="add"
                size={18}
                className="text-on-surface-variant"
              />
            </div>
            <div>
              <span className="font-heading text-base font-bold leading-tight block text-on-surface">
                Agregar prod.
              </span>
              <span className="text-xs text-on-surface-variant mt-0.5 block">
                Catálogo & Stock
              </span>
            </div>
          </Link>

          {/* Acción 3: Escanear Código */}
          <Link
            href="/ventas"
            className="flex flex-col justify-between p-4 h-32 rounded-2xl bg-surface-container-lowest text-on-surface shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-outline-variant/30 hover:border-primary/40 active:scale-[0.98] transition-all text-left"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-on-secondary-container">
                <Icon name="barcode_scanner" size={24} />
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-heading text-[10px] font-bold">
                Cámara
              </span>
            </div>
            <div>
              <span className="font-heading text-base font-bold leading-tight block text-on-surface">
                Escanear código
              </span>
              <span className="text-xs text-on-surface-variant mt-0.5 block">
                Barras o SKU
              </span>
            </div>
          </Link>

          {/* Acción 4: Clientes */}
          <Link
            href="/clientes"
            className="flex flex-col justify-between p-4 h-32 rounded-2xl bg-surface-container-lowest text-on-surface shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-outline-variant/30 hover:border-primary/40 active:scale-[0.98] transition-all text-left"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                <Icon name="storefront" size={24} />
              </div>
              <Icon
                name="group"
                size={18}
                className="text-on-surface-variant"
              />
            </div>
            <div>
              <span className="font-heading text-base font-bold leading-tight block text-on-surface">
                Clientes
              </span>
              <span className="text-xs text-on-surface-variant mt-0.5 block">
                Directorio & Alta
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* Banner de Estado de Caja POS */}
      <section>
        <div className="p-4 rounded-2xl bg-gradient-to-r from-surface-container-high to-surface-container-lowest shadow-xs border border-outline-variant/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-success-light text-success-text flex items-center justify-center shrink-0">
              <Icon name="lock_open" size={22} />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success" />
                <span className="font-heading text-sm font-bold text-on-surface truncate">
                  Caja POS Activa
                </span>
              </div>
              <span className="text-xs text-on-surface-variant truncate">
                {todayOrders}{" "}
                {todayOrders === 1
                  ? "transacción registrada hoy"
                  : "transacciones registradas hoy"}{" "}
                • Total: {formatCOP(todayRevenue)}
              </span>
            </div>
          </div>

          <Link
            href="/ventas"
            className="px-3.5 py-2 rounded-xl bg-surface-container-lowest text-primary font-heading text-xs font-bold shadow-xs border border-outline-variant/30 hover:bg-primary-fixed/40 transition-colors shrink-0"
          >
            Ir a Caja
          </Link>
        </div>
      </section>

      {/* Alertas de Stock Bajo (stock < min_stock) */}
      <section>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-base font-bold text-on-surface">
              Alertas de Stock Bajo
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full font-heading text-[11px] font-bold ${
                lowStockProducts.length > 0
                  ? "bg-error-container text-on-error-container"
                  : "bg-success-light text-success-text"
              }`}
            >
              {lowStockProducts.length}{" "}
              {lowStockProducts.length === 1 ? "urgente" : "urgentes"}
            </span>
          </div>

          <Link
            href="/inventario"
            className="font-heading text-xs text-primary font-bold flex items-center gap-0.5 hover:underline"
          >
            <span>Ver todo</span>
            <Icon name="chevron_right" size={16} />
          </Link>
        </div>

        {lowStockProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lowStockProducts.slice(0, 8).map((product) => (
              <div
                key={product.id}
                className="p-3 rounded-2xl bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex items-center gap-3"
              >
                <div className="w-15 h-15 rounded-xl bg-surface-container overflow-hidden shrink-0 relative flex items-center justify-center">
                  {product.photo_url ? (
                    <Image
                      src={product.photo_url}
                      alt={product.name}
                      fill
                      sizes="60px"
                      className="object-cover"
                    />
                  ) : (
                    <Icon
                      name="inventory_2"
                      size={24}
                      className="text-on-surface-variant/40"
                    />
                  )}
                </div>

                <div className="flex flex-col flex-1 min-w-0">
                  <h3 className="font-heading text-sm font-bold text-on-surface truncate">
                    {product.name}
                  </h3>
                  <span className="text-xs text-on-surface-variant truncate">
                    {product.barcode
                      ? `SKU: ${product.barcode}`
                      : product.brand ?? "Sin código"}
                  </span>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-error-container text-on-error-container font-heading text-[11px] font-bold">
                      <Icon name="warning" size={12} />
                      {product.stock === 0
                        ? "Agotado (0 uds)"
                        : `Quedan ${product.stock} uds`}
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      Mín: {product.min_stock}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/inventario/${product.id}`}
                  className="px-3 py-2 rounded-xl bg-primary text-on-primary font-heading text-xs font-bold shadow-xs hover:bg-primary-container active:scale-95 transition-all shrink-0 flex items-center gap-1"
                >
                  <Icon name="local_shipping" size={15} />
                  <span>Ver</span>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-success-light text-success-text flex items-center justify-center shrink-0">
              <Icon name="check_circle" size={22} />
            </div>
            <div>
              <p className="font-heading text-sm font-bold text-on-surface">
                Inventario saludable
              </p>
              <p className="text-xs text-on-surface-variant">
                Todos los productos activos se encuentran por encima de su stock
                mínimo configurado.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

