# Tasks: Sistema de Gestión de Inventario y Ventas — Tobón Distribuidora de Belleza

## Resumen

39 tareas organizadas en 8 bloques, desde la infraestructura base hasta el despliegue. Complejidad total estimada: ~120 horas de desarrollo asistido por IA. Las tareas están ordenadas por dependencia — cada una indica qué necesita antes.

---

## Bloque 0: Preparación del proyecto

### T-01: Corregir estructura de carpetas Stitch
- **Descripción:** Renombrar `docsstitch-exports/` → `docs/stitch-exports/` (dos carpetas anidadas) en el proyecto local.
- **Depende de:** —
- **Complejidad:** S
- **Done when:** La carpeta existe como `docs/stitch-exports/` con todos los exports de Stitch dentro, y el proyecto compila sin errores.

### T-02: Instalar dependencias
- **Descripción:** Instalar paquetes de producción (`@supabase/supabase-js`, `@supabase/ssr`, `html5-qrcode`, `@react-pdf/renderer`, `recharts`, `zod`) y de desarrollo (`supabase` CLI). Verificar que `next dev` arranca sin errores.
- **Depende de:** —
- **Complejidad:** S
- **Done when:** `npm install` exitoso, `next dev` compila, `npx supabase --version` responde.

### T-03: Configurar variables de entorno
- **Descripción:** Crear `.env.local` con `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`. Agregar `.env.local` a `.gitignore`. Crear `.env.example` como referencia.
- **Depende de:** T-02
- **Complejidad:** S
- **Done when:** `.env.local` existe con las 3 variables del proyecto Supabase (`kzpqsgszrdcgsckdvq`), `.env.example` con placeholders está en el repo.

### T-04: Configurar Tailwind CSS 4 con tokens Velvet Commerce
- **Descripción:** Reemplazar `globals.css` con los tokens de diseño definidos en `design.md` §2.1 (colores, tipografía, spacing, radios, sombras) usando la directiva `@theme` de Tailwind 4. Importar fuentes Plus Jakarta Sans e Inter via `next/font/google`.
- **Depende de:** T-02
- **Complejidad:** M
- **Done when:** Las clases `bg-primary`, `text-on-surface`, `font-heading`, `font-body`, etc. funcionan correctamente. La página default de Next.js muestra los colores del brand.

### T-05: Crear estructura de carpetas del proyecto
- **Descripción:** Crear la estructura de directorios definida en `design.md` §1.3: `components/ui/`, `components/layout/`, `components/inventory/`, `components/pos/`, `components/customers/`, `components/analytics/`, `lib/supabase/`, `lib/actions/`, `lib/hooks/`, `lib/utils/`, `lib/types/`, `supabase/migrations/`.
- **Depende de:** T-01
- **Complejidad:** S
- **Done when:** Todas las carpetas existen. Archivo `lib/utils/constants.ts` tiene las categorías y roles. Archivo `lib/utils/currency.ts` tiene `formatCOP()`.

---

## Bloque 1: Supabase — Base de datos y Auth

### T-06: Crear migración SQL — tablas, enums e índices
- **Descripción:** Crear archivo `supabase/migrations/001_initial_schema.sql` con todo el SQL del `design.md` §3.2: enums, las 7 tablas, índices, secuencia de recibos, seed de categorías.
- **Depende de:** T-05
- **Complejidad:** M
- **Done when:** El SQL se ejecuta sin errores en Supabase Dashboard (SQL Editor). Todas las tablas aparecen en el esquema.

### T-07: Crear migración SQL — RLS policies
- **Descripción:** Crear `supabase/migrations/002_rls_policies.sql` con todas las políticas RLS del `design.md` §3.3, incluyendo la función `get_user_role()`.
- **Depende de:** T-06
- **Complejidad:** M
- **Done when:** RLS está habilitado en las 7 tablas. Un usuario con rol `vendor` puede leer productos pero no insertarlos. Un `admin` puede hacer ambas cosas.

### T-08: Crear migración SQL — Storage bucket + policies
- **Descripción:** Crear `supabase/migrations/003_storage.sql` con el bucket `product-photos` y sus políticas (design.md §3.4).
- **Depende de:** T-06
- **Complejidad:** S
- **Done when:** El bucket existe en Supabase Storage. Un admin puede subir imágenes. Las URLs públicas funcionan.

### T-09: Crear trigger de creación de perfil
- **Descripción:** Crear `supabase/migrations/004_auth_trigger.sql` con el trigger `handle_new_user` que crea un `profile` cuando se registra un usuario en Auth (design.md §5.1).
- **Depende de:** T-06
- **Complejidad:** S
- **Done when:** Al crear un usuario en Supabase Auth, aparece automáticamente un registro en `profiles` con rol `vendor`.

### T-10: Crear funciones SQL de analíticas
- **Descripción:** Crear `supabase/migrations/005_analytics_functions.sql` con las funciones `top_products()`, `sales_by_hour()`, `sales_by_day()`, `seller_performance()` (design.md §4.4).
- **Depende de:** T-06
- **Complejidad:** M
- **Done when:** Las funciones se pueden llamar desde el SQL Editor con parámetros de fecha y devuelven datos correctos.

### T-11: Generar tipos TypeScript desde Supabase
- **Descripción:** Ejecutar `npx supabase gen types typescript --project-id kzpqsgszrdcgsckdvq > lib/types/database.ts`. Crear tipos derivados (`Product`, `Sale`, `Customer`, etc.) en el mismo archivo o en archivos separados.
- **Depende de:** T-06, T-07
- **Complejidad:** S
- **Done when:** `lib/types/database.ts` existe con tipos actualizados que reflejan todas las tablas.

### T-12: Crear usuarios iniciales de prueba
- **Descripción:** Desde Supabase Dashboard (Auth), crear 2 usuarios: un admin (ej: admin@tobon.com) y un vendor (ej: vendedor@tobon.com). Verificar que el trigger crea los perfiles correctamente. Actualizar manualmente el rol del admin a `admin` en la tabla `profiles`.
- **Depende de:** T-09
- **Complejidad:** S
- **Done when:** Ambos usuarios existen en Auth y en `profiles` con roles correctos.

---

## Bloque 2: Infraestructura Next.js — Auth, Layout, Navegación

### T-13: Configurar clientes Supabase (browser, server, admin)
- **Descripción:** Crear `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server con cookies), `lib/supabase/admin.ts` (service_role para Server Actions). Seguir la guía de `@supabase/ssr` para Next.js App Router.
- **Depende de:** T-03, T-11
- **Complejidad:** M
- **Done when:** Se puede importar cada cliente y ejecutar una query simple (ej: `supabase.from('categories').select('*')`) desde un Server Component y desde un Client Component.

### T-14: Crear middleware de autenticación
- **Descripción:** Implementar `middleware.ts` según design.md §5.2: refresh de sesión, redirect a `/login` si no autenticado, bloqueo de rutas admin-only para vendors.
- **Depende de:** T-13
- **Complejidad:** M
- **Done when:** Un usuario no autenticado es redirigido a `/login`. Un vendor es redirigido al dashboard si intenta acceder a `/analiticas`. Un admin accede sin problema.

### T-15: Crear página de login
- **Descripción:** Crear `app/(auth)/login/page.tsx` y `app/(auth)/layout.tsx`. Formulario de email + contraseña con el estilo Velvet Commerce (logo "T", colores del brand). Usar Supabase Auth `signInWithPassword`. Mostrar errores de validación.
- **Depende de:** T-04, T-13
- **Complejidad:** M
- **Done when:** Un usuario puede loguearse con email/contraseña y es redirigido al dashboard. Credenciales incorrectas muestran error.

### T-16: Crear layout principal (Shell) con navegación
- **Descripción:** Crear `app/(dashboard)/layout.tsx` con el shell de la app: Header (logo "T" + "Tobón" + avatar + notificaciones) y BottomNav (4 tabs: Inicio, Inventario, Ventas, Más). El layout debe ser responsive: bottom-nav en mobile, sidebar en desktop. Crear `components/layout/Header.tsx`, `components/layout/BottomNav.tsx`, `components/layout/Sidebar.tsx`. Incluir auth guard (redirect si no logueado) y contexto del usuario (nombre, rol).
- **Depende de:** T-04, T-14, T-15
- **Complejidad:** L
- **Done when:** El shell se muestra correctamente en mobile y desktop. La navegación funciona entre las secciones. El nombre del usuario aparece. El tab activo se resalta en primary.

---

## Bloque 3: Componentes UI base

### T-17: Crear componentes UI base
- **Descripción:** Crear `components/ui/` con: `Button` (variantes: primary, secondary, gold, ghost, danger, disabled), `Input` (con label, error, ícono), `Card`, `Badge` (success/warning/danger), `Chip` (active/inactive, pill), `Modal`, `Drawer` (bottom sheet mobile), `Icon` (Material Symbols wrapper), `Spinner`, `Skeleton`. Todos deben usar los tokens Velvet Commerce.
- **Depende de:** T-04
- **Complejidad:** L
- **Done when:** Cada componente renderiza correctamente con props documentados. Se puede verificar visualmente que coinciden con el estilo de las pantallas Stitch.

---

## Bloque 4: Módulo de Inventario

### T-18: Server Action — createProduct
- **Descripción:** Implementar `lib/actions/inventory.ts` → `createProduct()` según design.md §4.1. Incluye: validación con Zod, subida de foto a Storage, verificación de unicidad de barcode, inserción en `products`, audit log.
- **Depende de:** T-13, T-11, T-08
- **Complejidad:** L
- **Done when:** Se puede crear un producto desde una Server Action, la foto aparece en Storage, el audit log se registra.

### T-19: Server Action — updateProduct, deactivateProduct
- **Descripción:** Implementar `updateProduct()` y `deactivateProduct()` en `lib/actions/inventory.ts`. Si cambia el precio → audit log `price_changed` con old/new data.
- **Depende de:** T-18
- **Complejidad:** M
- **Done when:** Un producto se puede actualizar y desactivar. Los cambios de precio quedan en audit_logs con datos anteriores y nuevos.

### T-20: Server Action — adjustStock
- **Descripción:** Implementar `adjustStock()`: actualiza stock, inserta en `inventory_adjustments`, registra audit log.
- **Depende de:** T-18
- **Complejidad:** M
- **Done when:** Un ajuste manual cambia el stock y queda registrado en `inventory_adjustments` con motivo.

### T-21: Componente BarcodeScanner
- **Descripción:** Crear `components/inventory/BarcodeScanner.tsx` usando `html5-qrcode`. Soportar formatos EAN-13, EAN-8, UPC-A, UPC-E, CODE-128. Callback `onScan(barcode: string)`. Detección de cámara disponible con fallback a input manual.
- **Depende de:** T-02
- **Complejidad:** L
- **Done when:** En un celular con cámara, el componente abre la cámara trasera, detecta un código de barras y llama al callback. Sin cámara, muestra input manual.

### T-22: Página de lista de inventario
- **Descripción:** Crear `app/(dashboard)/inventario/page.tsx`. Implementar: barra de búsqueda (por nombre, marca o barcode), chips de categoría (scroll horizontal), lista de productos como `ProductCard` (foto, nombre, marca, precio, indicador de stock con colores semáforo), FAB "+" para nuevo producto. Paginación o scroll infinito. Referencia visual: `inventario_de_productos_m_vil/`.
- **Depende de:** T-16, T-17, T-13
- **Complejidad:** L
- **Done when:** La página muestra productos de Supabase, el filtro por categoría funciona, la búsqueda filtra en tiempo real, los indicadores de stock muestran colores correctos (verde >10, naranja 5-10, rojo <5).

### T-23: Página de nuevo/editar producto
- **Descripción:** Crear `app/(dashboard)/inventario/nuevo/page.tsx` con el formulario completo: foto (cámara o galería), barcode (scan o manual), nombre, marca, categoría (dropdown), descripción, precio compra, precio venta, stock, stock mínimo. Validación con Zod. Conectar con `createProduct` Server Action. Referencia visual: `nuevo_producto_m_vil/`.
- **Depende de:** T-18, T-21, T-22
- **Complejidad:** L
- **Done when:** Se puede crear un producto completo desde el formulario. La foto se sube. El barcode se escanea o ingresa manualmente. Validaciones funcionan. El producto aparece en la lista.

---

## Bloque 5: Módulo de Punto de Venta (POS)

### T-24: Server Action — completeSale
- **Descripción:** Implementar `lib/actions/sales.ts` → `completeSale()` según design.md §4.2. Lógica transaccional: obtener receipt_number, verificar stock de cada ítem, calcular totales, insertar sale + sale_items (con snapshots), descontar stock atómicamente, audit log.
- **Depende de:** T-13, T-11
- **Complejidad:** L
- **Done when:** Una venta se completa, el stock se descuenta, el receipt_number es consecutivo, los sale_items tienen snapshots de nombre y precio.

### T-25: Server Action — voidSale
- **Descripción:** Implementar `voidSale()`: cambiar status a voided, restaurar stock, registrar audit log. Solo admin.
- **Depende de:** T-24
- **Complejidad:** M
- **Done when:** Una venta se puede anular, el stock se restaura, el audit log registra la anulación con motivo.

### T-26: Hook useCart
- **Descripción:** Crear `lib/hooks/useCart.ts`: estado del carrito (items, cantidades, totales), funciones `addItem`, `removeItem`, `updateQuantity`, `clearCart`. Calcular subtotal y total en tiempo real.
- **Depende de:** T-11
- **Complejidad:** M
- **Done when:** El hook gestiona el estado del carrito correctamente. Agregar/quitar/actualizar ítems recalcula totales.

### T-27: Página del POS (punto de venta)
- **Descripción:** Crear `app/(dashboard)/ventas/page.tsx`. Implementar: botón de escaneo prominente, búsqueda manual de productos, carrito con ítems (nombre, precio, cantidad +/-, eliminar), selector de método de pago (chips: Efectivo, Nequi/Transferencia, Tarjeta), campo de cliente opcional (buscar o agregar nuevo), total en grande, botón "Confirmar venta". Referencia visual: `punto_de_venta_m_vil_pos/`.
- **Depende de:** T-16, T-17, T-21, T-24, T-26
- **Complejidad:** L
- **Done when:** Se puede escanear un producto, aparece en el carrito, ajustar cantidades, seleccionar pago, confirmar venta. El stock se descuenta. Se genera recibo.

### T-28: Página de recibo / detalle de venta
- **Descripción:** Crear `app/(dashboard)/ventas/[id]/page.tsx`. Mostrar recibo con diseño Stitch: checkmark verde, datos del negocio, número de recibo, fecha/hora, vendedor, items, total, método de pago, cliente. Botones: "Compartir por WhatsApp" y "Descargar PDF". Referencia visual: `comprobante_de_venta_m_vil/`.
- **Depende de:** T-24, T-17
- **Complejidad:** M
- **Done when:** El recibo se muestra correctamente con todos los datos de la venta.

### T-29: Compartir recibo por WhatsApp
- **Descripción:** Implementar botón que genera texto formateado del recibo (design.md §8.2) y abre `https://wa.me/?text={encoded}`.
- **Depende de:** T-28
- **Complejidad:** S
- **Done when:** Al tocar el botón, se abre WhatsApp con el texto del recibo pre-cargado.

### T-30: Descargar recibo como PDF
- **Descripción:** Crear `components/pos/ReceiptPDF.tsx` usando `@react-pdf/renderer`. Generar PDF con el mismo diseño del recibo en pantalla. Botón de descarga.
- **Depende de:** T-28
- **Complejidad:** M
- **Done when:** Se descarga un PDF legible con todos los datos del recibo, logo y formato limpio.

---

## Bloque 6: Módulo de Clientes

### T-31: Server Actions — createCustomer, updateCustomer, deleteCustomer
- **Descripción:** Implementar `lib/actions/customers.ts` con las 3 acciones según design.md §4.3. `createCustomer` registra `consent_at` y `consent_ip`. Validar unicidad de cédula.
- **Depende de:** T-13, T-11
- **Complejidad:** M
- **Done when:** Se puede crear, actualizar y eliminar (soft delete) un cliente. El consentimiento queda registrado con timestamp e IP. Cédula duplicada muestra error.

### T-32: Página de registro de cliente
- **Descripción:** Crear `app/(dashboard)/clientes/nuevo/page.tsx`. Formulario: nombre, apellido, cédula (con ícono), teléfono (+57), email (opcional). Sección de consentimiento: card blush con checkbox + texto de autorización + enlace a política completa. Botón deshabilitado hasta aceptar. Referencia visual: `nuevo_cliente_m_vil/`.
- **Depende de:** T-31, T-17
- **Complejidad:** M
- **Done when:** Se puede registrar un cliente con consentimiento. El botón se habilita solo con checkbox marcado. El enlace a la política funciona.

### T-33: Página de lista de clientes
- **Descripción:** Crear `app/(dashboard)/clientes/page.tsx`. Lista con búsqueda por nombre o cédula. Cada cliente muestra nombre, cédula, teléfono. Tap para ver detalle/editar.
- **Depende de:** T-31, T-16, T-17
- **Complejidad:** M
- **Done when:** La lista muestra clientes de Supabase, la búsqueda funciona, se puede navegar al detalle.

### T-34: Página pública de política de datos
- **Descripción:** Crear `app/politica-datos/page.tsx` con la política completa según design.md §10.1. Página pública (no requiere auth). Campos pendientes como placeholders `[POR CONFIRMAR]`.
- **Depende de:** T-04
- **Complejidad:** M
- **Done when:** La página es accesible sin login en `/politica-datos`. Contiene todas las secciones requeridas por Ley 1581/2012.

---

## Bloque 7: Módulo de Analíticas (admin only)

### T-35: Página de analíticas
- **Descripción:** Crear `app/(dashboard)/analiticas/page.tsx`. Solo admin (middleware ya lo bloquea para vendors). Implementar: selector de período (chips: Hoy, Esta semana, Este mes, Personalizado), KPI cards (ventas totales, transacciones, ticket promedio, productos vendidos), gráfico de barras horizontales (top 5 productos), gráfico de línea (ventas por hora), gráfico de barras/heatmap (ventas por día), tabla de ventas por vendedor. Usar `recharts`. Referencia visual: `anal_ticas_m_vil_admin/`.
- **Depende de:** T-10, T-16, T-17, T-13
- **Complejidad:** L
- **Done when:** La página muestra datos reales de Supabase. Los gráficos renderizan correctamente. El filtro por período actualiza todos los gráficos. Solo admin puede acceder.

---

## Bloque 8: Dashboard, PWA y Deploy

### T-36: Página de Dashboard (inicio)
- **Descripción:** Crear `app/(dashboard)/page.tsx`. Implementar: saludo con nombre del usuario + fecha, carrusel horizontal con KPIs del día (ventas hoy, productos vendidos, ticket promedio), alertas de stock bajo (productos con stock < min_stock), grid de acciones rápidas (Nueva venta, Agregar producto, Escanear código, Clientes). Referencia visual: `dashboard_m_vil_inicio/`.
- **Depende de:** T-16, T-17, T-13
- **Complejidad:** L
- **Done when:** El dashboard muestra datos reales. Las alertas de stock bajo listan productos correctos. Las acciones rápidas navegan a las secciones correspondientes.

### T-37: Configurar PWA (manifest + service worker básico)
- **Descripción:** Crear `public/manifest.json` con nombre, iconos y colores del brand. Configurar `next.config.ts` con metadata para PWA. Agregar meta tags de PWA al root layout. Service worker básico para cache de assets estáticos.
- **Depende de:** T-04
- **Complejidad:** M
- **Done when:** En Chrome mobile, la opción "Agregar a pantalla de inicio" funciona. La app se abre como PWA con el ícono y splash screen correctos.

### T-38: Desplegar en Vercel
- **Descripción:** Conectar el repo de Git con Vercel. Configurar variables de entorno en Vercel (las 3 de Supabase). Verificar que el build pasa. Configurar dominio (opcional). Verificar que todo funciona en producción.
- **Depende de:** Todas las anteriores
- **Complejidad:** M
- **Done when:** La app está live en una URL de Vercel. Login, inventario, POS, clientes y analíticas funcionan en producción.

### T-39: Auditoría de seguridad con Cloudflare Security Audit Skill
- **Descripción:** Instalar y ejecutar la skill de auditoría de seguridad (`npx skills add https://github.com/cloudflare/security-audit-skill --skill security-audit`). Ejecutar las 6 fases de auditoría sobre el código. Corregir hallazgos críticos y altos antes del despliegue público.
- **Depende de:** T-38
- **Complejidad:** L
- **Done when:** La auditoría se ejecutó completa. Los hallazgos críticos y altos están resueltos. El reporte de auditoría está documentado.

---

## Resumen visual de dependencias

```
T-01 ──► T-05 ──► T-06 ──► T-07 ──► T-11 ──► T-13 ──► T-14 ──► T-15 ──► T-16
T-02 ──► T-03 ─┘   │         │                   │                          │
  │      T-04 ──────┼─────────┼───────────────────┼──────────────────────────┤
  │               T-08      T-09    T-10          │                          │
  │                 │         │       │            │                          │
  │      ┌──────────┘         │       │            │                          │
  │      ▼                    ▼       │            │                          │
  │    T-18 ──► T-19        T-12     │            │         T-17 ◄───────── T-04
  │      │      T-20                  │            │           │
  │      ▼                            │            │           │
  ├──► T-21                           │            │           │
  │      │                            │            │           │
  │      ▼                            │            │           │
  │    T-22 ──► T-23                  │            │           │
  │                                   │            │           │
  │    T-24 ──► T-25                  │            │           │
  │      │                            │            │           │
  │    T-26 ──► T-27 ──► T-28 ──► T-29           │           │
  │                        │                       │           │
  │                      T-30                      │           │
  │                                                │           │
  │    T-31 ──► T-32                               │           │
  │      │      T-33                               │           │
  │    T-34                                        │           │
  │                                   T-35 ◄───────┤           │
  │                                                │           │
  │    T-36 ◄──────────────────────────────────────┘───────────┘
  │    T-37
  │      │
  │    T-38 ──► T-39
  └──────┘
```

## Orden de ejecución sugerido (camino crítico)

| Fase | Tareas | Foco |
|------|--------|------|
| **Sprint 0** | T-01 → T-05 | Setup del proyecto |
| **Sprint 1** | T-06 → T-12 | Base de datos completa |
| **Sprint 2** | T-13 → T-17 | Auth + layout + componentes UI |
| **Sprint 3** | T-18 → T-23 | Inventario completo |
| **Sprint 4** | T-24 → T-30 | POS completo |
| **Sprint 5** | T-31 → T-34 | Clientes + política de datos |
| **Sprint 6** | T-35 → T-36 | Analíticas + dashboard |
| **Sprint 7** | T-37 → T-39 | PWA + deploy + auditoría |
