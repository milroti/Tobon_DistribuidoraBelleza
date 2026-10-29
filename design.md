# Design: Sistema de Gestión de Inventario y Ventas — Tobón Distribuidora de Belleza

> **Fase 2 — Spec-Driven Development**
> Basado en `requirements.md` confirmado y el sistema de diseño visual **Velvet Commerce** (Google Stitch).

---

## 1. Arquitectura

### 1.1 Vista general

```
┌─────────────────────────────────────────────────────────┐
│                    Cliente (Navegador)                   │
│              Next.js 16 — App Router — PWA              │
│   ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌─────────┐  │
│   │Dashboard │ │Inventario│ │    POS    │ │Analytics│  │
│   └────┬─────┘ └────┬─────┘ └─────┬─────┘ └────┬────┘  │
│        └─────────────┴─────────────┴────────────┘       │
│                         │                                │
│              Server Actions / Route Handlers             │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTPS
┌─────────────────────────▼───────────────────────────────┐
│                     Supabase Cloud                       │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌────────────┐  │
│  │   Auth   │ │ Postgres │ │ Storage │ │  Realtime   │  │
│  │(email/pw)│ │  + RLS   │ │ (fotos) │ │(stock live) │  │
│  └──────────┘ └──────────┘ └─────────┘ └────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Next.js (App Router) | 16.4.3 |
| UI | React + Tailwind CSS 4 | React 19.3, TW 4 |
| Lenguaje | TypeScript | 5.x |
| BaaS | Supabase (Postgres, Auth, Storage, Realtime) | Cloud |
| Escaneo | html5-qrcode | ^2.3 |
| PDF | @react-pdf/renderer | ^4.x |
| Charts | Recharts | ^2.x |
| Hosting | Vercel | — |
| Bundler | Turbopack (integrado en Next.js 16) | — |

### 1.3 Estructura de carpetas (Next.js App Router)

```
tobon/
├── app/
│   ├── (auth)/                    # Grupo: páginas públicas (login)
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/               # Grupo: app autenticada
│   │   ├── layout.tsx             # Shell con sidebar/bottom-nav + auth guard
│   │   ├── page.tsx               # Dashboard inicio
│   │   ├── inventario/
│   │   │   ├── page.tsx           # Lista de productos
│   │   │   └── nuevo/page.tsx     # Formulario nuevo producto
│   │   ├── ventas/
│   │   │   ├── page.tsx           # POS — nueva venta
│   │   │   └── [id]/page.tsx      # Detalle / recibo de venta
│   │   ├── clientes/
│   │   │   ├── page.tsx           # Lista de clientes
│   │   │   └── nuevo/page.tsx     # Formulario nuevo cliente
│   │   ├── analiticas/
│   │   │   └── page.tsx           # Dashboard analíticas (admin only)
│   │   └── configuracion/
│   │       └── page.tsx           # Perfil, usuarios, ajustes
│   ├── politica-datos/page.tsx    # Pública: política de datos
│   ├── layout.tsx                 # Root layout (fonts, theme)
│   ├── globals.css                # Tailwind directives + tokens
│   └── not-found.tsx
├── components/
│   ├── ui/                        # Componentes base (Button, Input, Card, Chip, etc.)
│   ├── layout/                    # Header, BottomNav, Sidebar, Shell
│   ├── inventory/                 # ProductCard, ProductForm, BarcodeScanner
│   ├── pos/                       # CartItem, PaymentSelector, ReceiptView
│   ├── customers/                 # CustomerForm, ConsentCheckbox
│   └── analytics/                 # ChartCard, KpiCard, DateRangeFilter
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # createBrowserClient
│   │   ├── server.ts              # createServerClient (cookies)
│   │   ├── admin.ts               # createClient con service_role (solo Server Actions)
│   │   └── middleware.ts          # Refresh de sesión
│   ├── actions/                   # Server Actions por módulo
│   │   ├── inventory.ts
│   │   ├── sales.ts
│   │   ├── customers.ts
│   │   └── audit.ts
│   ├── hooks/                     # Custom hooks (useCart, useScanner, useRealtime)
│   ├── utils/
│   │   ├── currency.ts            # Formateo COP: $ 120.000
│   │   ├── validators.ts          # Zod schemas compartidos
│   │   └── constants.ts           # Categorías, roles, etc.
│   └── types/
│       └── database.ts            # Tipos generados de Supabase (supabase gen types)
├── docs/
│   └── stitch-exports/            # Pantallas de referencia (Stitch HTML + PNG)
│       ├── velvet_commerce/DESIGN.md
│       ├── dashboard_m_vil_inicio/
│       ├── punto_de_venta_m_vil_pos/
│       ├── inventario_de_productos_m_vil/
│       ├── nuevo_producto_m_vil/
│       ├── nuevo_cliente_m_vil/
│       ├── anal_ticas_m_vil_admin/
│       ├── comprobante_de_venta_m_vil/
│       └── comprobante_de_venta_whatsapp/
├── public/
│   ├── manifest.json              # PWA manifest
│   └── icons/                     # PWA icons
├── supabase/
│   └── migrations/                # SQL migrations versionadas
├── middleware.ts                   # Auth middleware (redirect no-auth → login)
├── next.config.ts
├── tailwind.config.ts             # NO se usa en TW4 — config en globals.css
├── package.json
└── AGENTS.md
```

> **Nota sobre Tailwind CSS 4:** La configuración de theme se hace vía `@theme` en `globals.css`, no en `tailwind.config.ts`. Los tokens Velvet Commerce se definen como CSS custom properties.

---

## 2. Sistema de Diseño — Velvet Commerce → Tailwind CSS 4

### 2.1 Tokens de color (CSS Custom Properties)

Extraídos del DESIGN.md de Stitch y del `tailwind.config` embebido en los HTML exportados:

```css
/* globals.css */
@import "tailwindcss";

@theme {
  /* ─── Paleta primaria ─── */
  --color-primary: #951753;
  --color-primary-container: #b5336b;
  --color-on-primary: #ffffff;
  --color-on-primary-container: #ffdce5;
  --color-inverse-primary: #ffb0c9;
  --color-primary-fixed: #ffd9e2;
  --color-primary-fixed-dim: #ffb0c9;
  --color-on-primary-fixed: #3e001e;
  --color-on-primary-fixed-variant: #8b0b4b;

  /* ─── Paleta secundaria ─── */
  --color-secondary: #7b5804;
  --color-secondary-container: #fdcd74;
  --color-on-secondary: #ffffff;
  --color-on-secondary-container: #785601;
  --color-secondary-fixed: #ffdea6;
  --color-secondary-fixed-dim: #eec068;
  --color-on-secondary-fixed: #271900;
  --color-on-secondary-fixed-variant: #5d4200;

  /* ─── Paleta terciaria ─── */
  --color-tertiary: #554b4e;
  --color-tertiary-container: #6e6366;
  --color-on-tertiary: #ffffff;
  --color-on-tertiary-container: #efe1e4;
  --color-tertiary-fixed: #eddfe2;
  --color-tertiary-fixed-dim: #d1c3c6;
  --color-on-tertiary-fixed: #211a1c;
  --color-on-tertiary-fixed-variant: #4e4447;

  /* ─── Superficies ─── */
  --color-surface: #fcf9f8;
  --color-surface-dim: #dcd9d9;
  --color-surface-bright: #fcf9f8;
  --color-surface-container-lowest: #ffffff;
  --color-surface-container-low: #f6f3f2;
  --color-surface-container: #f0eded;
  --color-surface-container-high: #eae7e7;
  --color-surface-container-highest: #e4e2e1;
  --color-on-surface: #1b1c1c;
  --color-on-surface-variant: #564147;
  --color-inverse-surface: #303030;
  --color-inverse-on-surface: #f3f0f0;
  --color-surface-tint: #ab2b63;
  --color-surface-variant: #e4e2e1;
  --color-background: #fcf9f8;
  --color-on-background: #1b1c1c;

  /* ─── Contornos ─── */
  --color-outline: #897177;
  --color-outline-variant: #ddbfc6;

  /* ─── Error / Semánticos ─── */
  --color-error: #ba1a1a;
  --color-on-error: #ffffff;
  --color-error-container: #ffdad6;
  --color-on-error-container: #93000a;

  /* ─── Semánticos extendidos (no Material, del brand guide) ─── */
  --color-success: #10b981;
  --color-success-light: #ecfdf5;
  --color-success-text: #065f46;
  --color-warning: #f59e0b;
  --color-warning-light: #fffbeb;
  --color-warning-text: #92400e;
  --color-danger: #e11d48;
  --color-danger-light: #fff1f2;
  --color-danger-text: #be123c;

  /* ─── Tipografía ─── */
  --font-heading: "Plus Jakarta Sans", system-ui, sans-serif;
  --font-body: "Inter", system-ui, sans-serif;

  /* ─── Espaciado ─── */
  --spacing-gutter: 1.25rem;
  --spacing-gutter-mobile: 0.75rem;
  --spacing-margin: 2rem;
  --spacing-margin-mobile: 1rem;
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2.5rem;

  /* ─── Radios ─── */
  --radius-sm: 0.25rem;
  --radius-DEFAULT: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
  --radius-full: 9999px;

  /* ─── Sombras (Velvet Commerce: ambient tinted) ─── */
  --shadow-sm: 0 1px 8px rgba(0, 0, 0, 0.04);
  --shadow-card: 0 4px 20px -2px rgba(181, 51, 107, 0.05);
  --shadow-dropdown: 0 12px 32px -4px rgba(45, 45, 45, 0.08);
  --shadow-modal: 0 24px 48px -8px rgba(45, 45, 45, 0.12);
}
```

### 2.2 Escala tipográfica

Definida en utilidades Tailwind que replican los tokens Stitch:

| Token | Font | Size | Weight | Line-height | Letter-spacing |
|-------|------|------|--------|-------------|----------------|
| `display-lg` | Plus Jakarta Sans | 48px | 800 | 56px | -0.02em |
| `display-lg-mobile` | Plus Jakarta Sans | 34px | 800 | 42px | -0.01em |
| `headline-lg` | Plus Jakarta Sans | 32px | 700 | 40px | -0.02em |
| `headline-lg-mobile` | Plus Jakarta Sans | 26px | 700 | 34px | -0.01em |
| `headline-md` | Plus Jakarta Sans | 24px | 600 | 32px | -0.01em |
| `headline-sm` | Plus Jakarta Sans | 20px | 600 | 28px | — |
| `title-md` | Plus Jakarta Sans | 18px | 600 | 26px | — |
| `body-lg` | Inter | 16px | 400 | 24px | — |
| `body-md` | Inter | 14px | 400 | 20px | — |
| `body-sm` | Inter | 12px | 400 | 18px | — |
| `label-lg` | Plus Jakarta Sans | 14px | 600 | 20px | 0.01em |
| `label-md` | Plus Jakarta Sans | 12px | 600 | 16px | 0.02em |
| `label-sm` | Plus Jakarta Sans | 11px | 700 | 14px | 0.04em |

### 2.3 Iconografía

Material Symbols Outlined (Google Fonts), cargados via link de Google Fonts. Se usarán como componente `<Icon name="..." />` que renderiza `<span className="material-symbols-outlined">`.

### 2.4 Formato monetario (COP)

```typescript
// lib/utils/currency.ts
export function formatCOP(amount: number): string {
  return `$ ${amount.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
// Resultado: $ 120.000 (punto como separador de miles, sin decimales)
```

---

## 3. Modelo de datos (Supabase / PostgreSQL)

### 3.1 Diagrama Entidad-Relación

```
┌─────────────┐       ┌──────────────┐       ┌──────────────┐
│   profiles   │       │   products   │       │  categories  │
│─────────────│       │──────────────│       │──────────────│
│ id (FK auth)│       │ id           │       │ id           │
│ full_name   │       │ name         │──────▶│ name         │
│ role        │       │ barcode      │       │ slug         │
│ is_active   │       │ category_id  │       └──────────────┘
└──────┬──────┘       │ brand        │
       │              │ description  │       ┌──────────────┐
       │              │ cost_price   │       │  customers   │
       │              │ sale_price   │       │──────────────│
       │              │ stock        │       │ id           │
       │              │ min_stock    │       │ first_name   │
       │              │ photo_url    │       │ last_name    │
       │              │ is_active    │       │ cedula       │
       │              └──────┬───────┘       │ phone        │
       │                     │               │ email        │
       │   ┌─────────────────┼───────────┐   │ consent_at   │
       │   │                 │           │   │ consent_ip   │
       ▼   ▼                 ▼           │   └──────┬───────┘
┌──────────────┐     ┌──────────────┐    │          │
│    sales     │     │  sale_items  │    │          │
│──────────────│     │──────────────│    │          │
│ id           │────▶│ id           │    │          │
│ receipt_num  │     │ sale_id      │    │          │
│ seller_id   ─┼─┐   │ product_id   │────┘          │
│ customer_id ─┼─┼───│ product_name │               │
│ payment_meth │ │   │ quantity     │               │
│ subtotal     │ │   │ unit_price   │               │
│ total        │ │   │ line_total   │               │
│ status       │ │   └──────────────┘               │
│ voided_by    │ │                                   │
│ voided_at    │ │                                   │
│ created_at   │ │                                   │
└──────────────┘ │   ┌───────────────────┐           │
                 │   │   audit_logs      │           │
                 │   │───────────────────│           │
                 │   │ id                │           │
                 └──▶│ user_id           │           │
                     │ action            │           │
                     │ entity_type       │           │
                     │ entity_id         │           │
                     │ old_data (jsonb)  │           │
                     │ new_data (jsonb)  │           │
                     │ ip_address        │           │
                     │ created_at        │           │
                     └───────────────────┘

┌─────────────────────┐
│ inventory_adjustments│
│─────────────────────│
│ id                   │
│ product_id           │
│ adjusted_by          │
│ previous_stock       │
│ new_stock            │
│ reason               │
│ created_at           │
└─────────────────────┘
```

### 3.2 Definición de tablas (SQL)

```sql
-- ═══════════════════════════════════════════
-- ENUMS
-- ═══════════════════════════════════════════
CREATE TYPE user_role AS ENUM ('admin', 'vendor');
CREATE TYPE payment_method AS ENUM ('cash', 'transfer', 'card');
CREATE TYPE sale_status AS ENUM ('completed', 'voided');
CREATE TYPE audit_action AS ENUM (
  'product_created', 'product_updated', 'product_deactivated',
  'stock_adjusted',
  'sale_completed', 'sale_voided',
  'customer_created', 'customer_updated', 'customer_deleted',
  'price_changed',
  'user_login', 'user_logout'
);

-- ═══════════════════════════════════════════
-- PROFILES (extiende auth.users)
-- ═══════════════════════════════════════════
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  role        user_role NOT NULL DEFAULT 'vendor',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════
-- CATEGORIES
-- ═══════════════════════════════════════════
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed inicial
INSERT INTO categories (name, slug) VALUES
  ('Cabello', 'cabello'),
  ('Uñas', 'unas'),
  ('Maquillaje', 'maquillaje'),
  ('Cuidado de Piel', 'cuidado-de-piel'),
  ('Herramientas', 'herramientas');

-- ═══════════════════════════════════════════
-- PRODUCTS
-- ═══════════════════════════════════════════
CREATE TABLE products (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  description  TEXT,
  barcode      TEXT UNIQUE,
  category_id  UUID REFERENCES categories(id),
  brand        TEXT,
  cost_price   INTEGER NOT NULL DEFAULT 0,       -- en pesos colombianos (sin decimales)
  sale_price   INTEGER NOT NULL DEFAULT 0,
  stock        INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  min_stock    INTEGER NOT NULL DEFAULT 5,
  photo_url    TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;

-- ═══════════════════════════════════════════
-- CUSTOMERS
-- ═══════════════════════════════════════════
CREATE TABLE customers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name   TEXT NOT NULL,
  last_name    TEXT NOT NULL,
  cedula       TEXT UNIQUE NOT NULL,
  phone        TEXT NOT NULL,
  email        TEXT,
  consent_at   TIMESTAMPTZ NOT NULL,             -- timestamp de aceptación Ley 1581
  consent_ip   TEXT,                              -- IP al momento del consentimiento
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_cedula ON customers(cedula);

-- ═══════════════════════════════════════════
-- SALES
-- ═══════════════════════════════════════════
CREATE TABLE sales (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number  INTEGER NOT NULL UNIQUE,         -- consecutivo autogenerado
  seller_id       UUID NOT NULL REFERENCES profiles(id),
  customer_id     UUID REFERENCES customers(id),
  payment_method  payment_method NOT NULL DEFAULT 'cash',
  subtotal        INTEGER NOT NULL,
  total           INTEGER NOT NULL,
  status          sale_status NOT NULL DEFAULT 'completed',
  voided_by       UUID REFERENCES profiles(id),
  voided_at       TIMESTAMPTZ,
  void_reason     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_seller ON sales(seller_id);
CREATE INDEX idx_sales_created ON sales(created_at DESC);
CREATE INDEX idx_sales_status ON sales(status);

-- Secuencia para número de recibo
CREATE SEQUENCE receipt_number_seq START WITH 1 INCREMENT BY 1;

-- ═══════════════════════════════════════════
-- SALE ITEMS
-- ═══════════════════════════════════════════
CREATE TABLE sale_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id       UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES products(id),
  product_name  TEXT NOT NULL,                    -- snapshot: nombre al momento de venta
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  unit_price    INTEGER NOT NULL,                 -- snapshot: precio al momento de venta
  line_total    INTEGER NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);

-- ═══════════════════════════════════════════
-- INVENTORY ADJUSTMENTS
-- ═══════════════════════════════════════════
CREATE TABLE inventory_adjustments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES products(id),
  adjusted_by     UUID NOT NULL REFERENCES profiles(id),
  previous_stock  INTEGER NOT NULL,
  new_stock       INTEGER NOT NULL,
  reason          TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════
-- AUDIT LOGS (inmutable — sin UPDATE ni DELETE permitidos)
-- ═══════════════════════════════════════════
CREATE TABLE audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES profiles(id),
  action       audit_action NOT NULL,
  entity_type  TEXT NOT NULL,                     -- 'product', 'sale', 'customer', etc.
  entity_id    UUID,
  old_data     JSONB,
  new_data     JSONB,
  ip_address   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
```

### 3.3 Row Level Security (RLS)

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ─── Helper function ───
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── PROFILES ───
-- Todos pueden leer perfiles (para mostrar nombre del vendedor)
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
-- Solo admin puede insertar/actualizar perfiles
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (
  id = auth.uid() OR get_user_role() = 'admin'
);

-- ─── CATEGORIES ───
-- Lectura: todos. Escritura: solo admin.
CREATE POLICY "categories_select" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_modify" ON categories FOR ALL USING (get_user_role() = 'admin');

-- ─── PRODUCTS ───
-- Lectura: todos (vendor necesita ver productos para vender)
CREATE POLICY "products_select" ON products FOR SELECT USING (true);
-- Escritura: solo admin
CREATE POLICY "products_insert" ON products FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "products_update" ON products FOR UPDATE USING (get_user_role() = 'admin');
-- NOTA: stock se descuenta vía Server Action con service_role, no vía RLS del vendor

-- ─── CUSTOMERS ───
-- Lectura: todos (vendor puede asociar cliente a venta)
CREATE POLICY "customers_select" ON customers FOR SELECT USING (true);
-- Escritura: todos (vendor puede registrar clientes en POS)
CREATE POLICY "customers_insert" ON customers FOR INSERT WITH CHECK (true);
-- Actualización/eliminación: solo admin
CREATE POLICY "customers_update" ON customers FOR UPDATE USING (get_user_role() = 'admin');
CREATE POLICY "customers_delete" ON customers FOR DELETE USING (get_user_role() = 'admin');

-- ─── SALES ───
-- Lectura: admin ve todo, vendor ve solo las suyas
CREATE POLICY "sales_select" ON sales FOR SELECT USING (
  get_user_role() = 'admin' OR seller_id = auth.uid()
);
-- Inserción: cualquier usuario autenticado (vender)
CREATE POLICY "sales_insert" ON sales FOR INSERT WITH CHECK (seller_id = auth.uid());
-- Actualización (anulación): solo admin
CREATE POLICY "sales_update" ON sales FOR UPDATE USING (get_user_role() = 'admin');

-- ─── SALE ITEMS ───
-- Lectura: igual que sales (a través de join, pero necesita política propia)
CREATE POLICY "sale_items_select" ON sale_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM sales WHERE sales.id = sale_items.sale_id
    AND (get_user_role() = 'admin' OR sales.seller_id = auth.uid())
  )
);
CREATE POLICY "sale_items_insert" ON sale_items FOR INSERT WITH CHECK (true);

-- ─── INVENTORY ADJUSTMENTS ───
-- Solo admin
CREATE POLICY "inv_adj_select" ON inventory_adjustments FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "inv_adj_insert" ON inventory_adjustments FOR INSERT WITH CHECK (get_user_role() = 'admin');

-- ─── AUDIT LOGS ───
-- Solo admin lee. Inserción vía service_role desde Server Actions (no via cliente).
CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT USING (get_user_role() = 'admin');
-- Sin política de INSERT para el cliente: se inserta con service_role en el server.
```

### 3.4 Storage Buckets

```sql
-- Bucket para fotos de productos
INSERT INTO storage.buckets (id, name, public) VALUES ('product-photos', 'product-photos', true);

-- Política: admin puede subir/borrar, todos pueden ver (público)
CREATE POLICY "product_photos_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-photos' AND get_user_role() = 'admin');
CREATE POLICY "product_photos_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'product-photos');
CREATE POLICY "product_photos_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'product-photos' AND get_user_role() = 'admin');
```

---

## 4. Contratos / Interfaces (Server Actions)

Todas las operaciones de escritura se ejecutan como **Next.js Server Actions** con `"use server"`. Las Server Actions usan el cliente Supabase con `service_role` para operaciones que requieren bypass de RLS (descuento de stock, audit logs), y el cliente autenticado del usuario para las demás.

### 4.1 Inventario

#### `createProduct(data: ProductInput): Promise<ActionResult<Product>>`

```typescript
// lib/actions/inventory.ts
"use server";

interface ProductInput {
  name: string;
  description?: string;
  barcode?: string;
  category_id: string;
  brand?: string;
  cost_price: number;    // enteros (COP sin decimales)
  sale_price: number;
  stock: number;
  min_stock?: number;    // default: 5
  photo?: File;          // se sube a Storage
}

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

- Valida unicidad de barcode.
- Sube foto a `product-photos/{product_id}.{ext}`.
- Registra audit log `product_created`.
- **Requiere rol:** admin.

#### `updateProduct(id: string, data: Partial<ProductInput>): Promise<ActionResult<Product>>`

- Si cambia `sale_price` o `cost_price`, registra audit log `price_changed` con `old_data` y `new_data`.
- **Requiere rol:** admin.

#### `adjustStock(productId: string, newStock: number, reason: string): Promise<ActionResult>`

- Inserta en `inventory_adjustments`.
- Actualiza `products.stock`.
- Registra audit log `stock_adjusted`.
- **Requiere rol:** admin.

#### `deactivateProduct(id: string): Promise<ActionResult>`

- Soft delete: `is_active = false`.
- Registra audit log `product_deactivated`.
- **Requiere rol:** admin.

### 4.2 Punto de Venta

#### `completeSale(data: SaleInput): Promise<ActionResult<Sale & { receipt_number: number }>>`

```typescript
interface SaleInput {
  items: Array<{
    product_id: string;
    quantity: number;
  }>;
  customer_id?: string;
  payment_method: 'cash' | 'transfer' | 'card';
}
```

**Lógica (transaccional):**
1. Obtener siguiente `receipt_number` de la secuencia.
2. Para cada ítem: verificar stock ≥ cantidad. Si alguno falla → rollback con error.
3. Calcular subtotal y total (sin IVA en v1 — son comprobantes internos, no facturas).
4. Insertar `sales` + `sale_items` (con snapshot de `product_name` y `unit_price`).
5. Descontar stock de cada producto.
6. Registrar audit log `sale_completed`.
7. Retornar la venta con número de recibo.

- **Requiere:** usuario autenticado (admin o vendor).
- **Usa `service_role`** para descuento atómico de stock y audit log.

#### `voidSale(saleId: string, reason: string): Promise<ActionResult>`

- Cambia `status` a `voided`, guarda `voided_by`, `voided_at`, `void_reason`.
- Restaura stock de cada ítem.
- Registra audit log `sale_voided`.
- **Requiere rol:** admin.

### 4.3 Clientes

#### `createCustomer(data: CustomerInput): Promise<ActionResult<Customer>>`

```typescript
interface CustomerInput {
  first_name: string;
  last_name: string;
  cedula: string;
  phone: string;
  email?: string;
  consent_accepted: true;  // obligatorio, debe ser true
}
```

- Valida unicidad de `cedula`.
- `consent_at` = `now()`, `consent_ip` = IP del request.
- Registra audit log `customer_created`.
- **Requiere:** usuario autenticado.

#### `updateCustomer(id: string, data: Partial<CustomerInput>): Promise<ActionResult>`
- **Requiere rol:** admin (derecho de rectificación solicitado por titular).

#### `deleteCustomer(id: string): Promise<ActionResult>`
- Soft delete (`is_active = false`) o hard delete según solicitud del titular.
- Registra audit log `customer_deleted`.
- **Requiere rol:** admin.

### 4.4 Analíticas (lectura — solo admin)

Estas son consultas de lectura. Se ejecutan desde Server Components o Route Handlers con el cliente autenticado del admin (RLS filtra para admin en `sales`).

```typescript
// Tipos de respuesta para analytics
interface TopProduct {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

interface SalesByHour {
  hour: number;       // 0-23
  sale_count: number;
  total_amount: number;
}

interface SalesByDay {
  date: string;        // YYYY-MM-DD
  sale_count: number;
  total_amount: number;
}

interface SellerPerformance {
  seller_id: string;
  seller_name: string;
  sale_count: number;
  total_amount: number;
}
```

Se implementarán como funciones PostgreSQL o vistas para optimizar:

```sql
-- Ejemplo: Productos más vendidos en un período
CREATE OR REPLACE FUNCTION top_products(
  p_from TIMESTAMPTZ,
  p_to TIMESTAMPTZ,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  total_quantity BIGINT,
  total_revenue BIGINT
) AS $$
  SELECT
    si.product_id,
    si.product_name,
    SUM(si.quantity) AS total_quantity,
    SUM(si.line_total) AS total_revenue
  FROM sale_items si
  JOIN sales s ON s.id = si.sale_id
  WHERE s.status = 'completed'
    AND s.created_at BETWEEN p_from AND p_to
  GROUP BY si.product_id, si.product_name
  ORDER BY total_quantity DESC
  LIMIT p_limit;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

---

## 5. Autenticación y Middleware

### 5.1 Flujo de Auth

1. Login via email/contraseña (Supabase Auth).
2. Al crear un usuario en Supabase Auth, un trigger PostgreSQL inserta un registro en `profiles` con el rol asignado.
3. El middleware de Next.js intercepta cada request:
   - Si no hay sesión → redirect a `/login`.
   - Si hay sesión → refresca el token y continúa.
4. Los layouts de grupo `(dashboard)` verifican adicionalmente el rol para páginas admin-only.

```sql
-- Trigger: crear profile al registrar usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'vendor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 5.2 Middleware (Next.js)

```typescript
// middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/login", "/politica-datos"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas: no requieren auth
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // Crear cliente Supabase con cookies del request
  const supabase = createServerClient(/* env vars */, {
    cookies: { /* cookie adapter */ },
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Rutas admin-only
  if (pathname.startsWith("/analiticas") || pathname.startsWith("/configuracion")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)"],
};
```

---

## 6. Componentes UI principales (mapeo Stitch → React)

Cada pantalla de Stitch se traduce a un componente React + Tailwind. Los HTML exportados sirven como **referencia visual pixel-perfect**, no se usan directamente en producción.

| Pantalla Stitch | Ruta Next.js | Componentes principales |
|----------------|-------------|------------------------|
| `dashboard_m_vil_inicio` | `/(dashboard)/page.tsx` | `DailySummaryCarousel`, `LowStockAlert`, `QuickActions` |
| `inventario_de_productos_m_vil` | `/(dashboard)/inventario/page.tsx` | `SearchBar`, `CategoryChips`, `ProductCard`, `BarcodeScanner` |
| `nuevo_producto_m_vil` | `/(dashboard)/inventario/nuevo/page.tsx` | `ProductForm`, `PhotoUpload`, `BarcodeScanButton` |
| `punto_de_venta_m_vil_pos` | `/(dashboard)/ventas/page.tsx` | `ScanArea`, `Cart`, `CartItem`, `PaymentSelector`, `CustomerPicker` |
| `comprobante_de_venta_m_vil` | `/(dashboard)/ventas/[id]/page.tsx` | `ReceiptCard`, `ShareButtons` |
| `comprobante_de_venta_whatsapp` | (generación de imagen/PDF) | `ReceiptTemplate` |
| `nuevo_cliente_m_vil` | `/(dashboard)/clientes/nuevo/page.tsx` | `CustomerForm`, `ConsentSection` |
| `anal_ticas_m_vil_admin` | `/(dashboard)/analiticas/page.tsx` | `KpiCards`, `TopProductsChart`, `SalesByHourChart`, `SalesByDayChart` |
| `dashboard_inicio` (desktop) | `/(dashboard)/page.tsx` | Mismos componentes, layout sidebar |
| `punto_de_venta_pos` (desktop) | `/(dashboard)/ventas/page.tsx` | Layout split (scanner izq, cart der) |
| `inventario_de_productos` (desktop) | `/(dashboard)/inventario/page.tsx` | Grid de 3-4 columnas |

### 6.1 Componentes base (`components/ui/`)

```
Button          — primary, secondary, gold-accent, ghost, danger
Input           — text, number, search, con ícono y label
Card            — surface-container-lowest, sombra card, rounded-xl
Chip            — active/inactive, pill shape, horizontal scroll container
Badge           — stock status (success/warning/danger)
BottomNav       — 4 tabs fijos (Inicio, Inventario, Ventas, Más)
Header          — logo "T" + brand name + notificaciones + avatar
Modal           — backdrop blur + overlay
Drawer          — bottom sheet (mobile) / side panel (desktop)
Icon            — wrapper de Material Symbols Outlined
Spinner/Skeleton — loading states
```

---

## 7. Escaneo de código de barras

### 7.1 Librería seleccionada: `html5-qrcode`

```typescript
// components/inventory/BarcodeScanner.tsx
// Usa Html5QrcodeScanner con config:
const config = {
  fps: 10,
  qrbox: { width: 250, height: 150 },
  aspectRatio: 1.777,
  formatsToSupport: [
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E,
    Html5QrcodeSupportedFormats.CODE_128,
  ],
};
```

### 7.2 Flujo de uso

1. Usuario toca botón "Escanear" → se abre cámara trasera.
2. Librería detecta código → callback `onScanSuccess(barcode)`.
3. En POS: busca producto por barcode → agrega al carrito.
4. En Inventario (nuevo producto): llena el campo barcode del formulario.
5. Si no se puede escanear → input manual como fallback.

---

## 8. Generación de recibos

### 8.1 Recibo en pantalla

Componente `ReceiptCard` que muestra la información de venta con el diseño de Stitch (checkmark verde, tarjeta con líneas punteadas, items, totales).

### 8.2 Compartir por WhatsApp

Generar un texto formateado y abrir `https://wa.me/?text={encoded_receipt}`:

```
✅ *Tobón Distribuidora de Belleza*
Recibo #00047
28 Oct 2026 — 2:30 PM
Vendedora: María López
─────────────
Shampoo Keratina 500ml x2 — $50.000
Esmalte Rojo #23 x1 — $12.000
─────────────
*Total: $62.000*
Pago: Efectivo
Cliente: Ana Gómez — CC 1.023.456.789
```

### 8.3 Descargar PDF

Usando `@react-pdf/renderer` para generar un PDF del recibo con el mismo diseño que la pantalla.

---

## 9. Decisiones de diseño (ADRs)

### ADR-001: Precios como enteros (INTEGER) en vez de DECIMAL

- **Contexto:** Los precios en pesos colombianos no usan centavos en el negocio minorista de belleza.
- **Opciones:** `DECIMAL(12,2)` vs `INTEGER`.
- **Decisión:** `INTEGER` (pesos sin decimales).
- **Justificación:** Elimina errores de punto flotante, simplifica cálculos, coincide con la práctica real del negocio. El DESIGN.md de Stitch confirma: "wholesale ordering standardizes on rounded integer representations without cents."

### ADR-002: Snapshot de datos en sale_items

- **Contexto:** Si se cambia el precio o nombre de un producto después de una venta, el recibo histórico debe mostrar los datos del momento de la venta.
- **Opciones:** (A) Solo FK al producto. (B) FK + snapshot de nombre y precio.
- **Decisión:** Opción B — `product_name` y `unit_price` se copian a `sale_items`.
- **Justificación:** Trazabilidad y auditoría. El dueño necesita que los recibos históricos sean exactos. Trade-off: duplicación aceptable.

### ADR-003: Server Actions con service_role para operaciones críticas

- **Contexto:** El descuento de stock y la inserción de audit logs requieren permisos que el usuario (vendor) no tiene vía RLS.
- **Opciones:** (A) Dar permisos de UPDATE al vendor en products. (B) Usar `service_role` en Server Actions del server.
- **Decisión:** Opción B — Server Actions usan `service_role` para stock y audit.
- **Justificación:** Mantiene RLS restrictivo. El vendor no puede manipular stock directamente. Toda mutación pasa por lógica validada en el server. **Riesgo mitigado:** el `service_role` key nunca se expone al cliente; solo existe en variables de entorno del server.

### ADR-004: Tailwind CSS 4 con @theme en vez de tailwind.config.ts

- **Contexto:** Next.js 16 + Tailwind 4 usan un loader de Turbopack. La configuración tradicional vía `tailwind.config.ts` no aplica de la misma forma.
- **Decisión:** Todos los tokens de diseño se definen como `@theme` dentro de `globals.css` usando CSS custom properties.
- **Justificación:** Es el approach nativo de Tailwind 4. Los HTML de Stitch usan un `tailwind.config` embebido en `<script>`, pero eso es solo para el prototipo; en producción se migran a `@theme`.

### ADR-005: html5-qrcode sobre zxing-js/browser

- **Contexto:** Se necesita escaneo de código de barras desde navegador móvil.
- **Opciones:** `html5-qrcode` vs `@aspect-software/zxing-js/browser`.
- **Decisión:** `html5-qrcode`.
- **Justificación:** API más simple, mejor documentación, incluye UI de cámara lista para usar, soporte activo. zxing-js ofrece más formatos pero requiere más código custom para la UI de la cámara.

### ADR-006: Secuencia PostgreSQL para número de recibo

- **Contexto:** Los recibos necesitan un consecutivo numérico (no UUID).
- **Opciones:** (A) Columna SERIAL. (B) Secuencia explícita. (C) Calcular MAX+1.
- **Decisión:** Secuencia explícita `receipt_number_seq`.
- **Justificación:** Garantiza unicidad en concurrencia sin locks de tabla. Se obtiene con `nextval('receipt_number_seq')` dentro de la transacción de venta.

### ADR-007: No IVA en v1

- **Contexto:** Los comprobantes son internos, no facturas DIAN. El negocio es régimen simplificado.
- **Decisión:** No se calcula ni muestra IVA. `subtotal = total`.
- **Justificación:** Está fuera de alcance (facturación DIAN). Se puede agregar en v2. La tabla `sales` tiene campo `subtotal` separado de `total` para facilitar la extensión futura.

---

## 10. Política de Datos Personales — Ley 1581 de 2012

### 10.1 Página pública: `/politica-datos`

Contendrá la política completa según los requisitos legales:

1. **Identificación del responsable:**
   - Razón social: Tobón Distribuidora de Belleza
   - NIT: [por confirmar con la dueña]
   - Dirección: [por confirmar]
   - Correo de contacto para datos: [por confirmar, ej: datos@tobon.com]

2. **Finalidades del tratamiento:**
   - Registro de compras para generar recibos.
   - Comunicación sobre productos y servicios (futuro programa de fidelización).
   - Mejora del servicio basada en historial de compras.

3. **Derechos de los titulares (Art. 8, Ley 1581):**
   - Acceder a sus datos personales.
   - Conocer, actualizar y rectificar sus datos.
   - Solicitar prueba de la autorización otorgada.
   - Solicitar la supresión de datos (cuando no exista deber legal de conservarlos).
   - Revocar la autorización.
   - Presentar quejas ante la SIC.

4. **Procedimiento para consultas y reclamos:**
   - Consultas: respuesta en máximo **10 días hábiles** (prorrogables 5 más).
   - Reclamos: respuesta en máximo **15 días hábiles** (prorrogables 8 más).
   - Canal: correo electrónico designado.

5. **Carácter facultativo:** Indicar que el suministro de datos sensibles es facultativo.

6. **Vigencia:** Fecha de última actualización.

### 10.2 Consentimiento en registro de cliente

El formulario de registro incluye:
- Checkbox obligatorio con texto: *"Autorizo a Tobón Distribuidora de Belleza para el tratamiento de mis datos personales conforme a la Ley 1581 de 2012."*
- Enlace "Ver política completa" que abre `/politica-datos`.
- El botón "Registrar cliente" se deshabilita hasta que el checkbox esté marcado.
- Se almacena: `consent_at` (timestamp), `consent_ip` (IP del request).

---

## 11. Dependencias del proyecto

### 11.1 Nuevas dependencias a instalar

```bash
# Producción
npm install @supabase/supabase-js @supabase/ssr html5-qrcode @react-pdf/renderer recharts zod

# Desarrollo
npm install -D supabase
```

| Paquete | Propósito | Versión mínima |
|---------|-----------|---------------|
| `@supabase/supabase-js` | Cliente Supabase (browser + server) | ^2.x |
| `@supabase/ssr` | Helpers SSR para cookies/auth en Next.js | ^0.5.x |
| `html5-qrcode` | Escaneo de barcode/QR desde cámara | ^2.3 |
| `@react-pdf/renderer` | Generación de PDF de recibos | ^4.x |
| `recharts` | Gráficos para analíticas | ^2.x |
| `zod` | Validación de schemas (forms + Server Actions) | ^3.x |
| `supabase` (CLI, dev) | Migraciones, tipos, local dev | ^2.x |

### 11.2 Variables de entorno

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://kzpqsgszrdcgsckdvq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>   # solo server-side, NUNCA en cliente
```

---

## 12. Riesgos y trade-offs

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| **Service role key expuesta** | Acceso total a la BD | Solo en Server Actions (server-side). Nunca en `NEXT_PUBLIC_*`. Variables de entorno de Vercel. |
| **Concurrencia en stock** | Sobre-venta si dos vendedores venden el último ítem | Descuento atómico con `UPDATE ... SET stock = stock - $qty WHERE stock >= $qty RETURNING stock`. Si retorna 0 rows → rollback. |
| **Cámara no disponible** | No se puede escanear en navegadores antiguos | Fallback a input manual siempre visible. Detección de `navigator.mediaDevices` antes de mostrar botón de escaneo. |
| **Rendimiento analíticas** | Queries lentas con muchos datos | Funciones SQL optimizadas con índices. Para v1 el volumen es bajo (~100 ventas/día max). Si crece, considerar vistas materializadas. |
| **Offline** | Pérdida de ventas sin internet | Fuera de alcance v1. Se muestra indicador de conexión. Se puede evaluar PWA con cache en v2. |
| **Datos personales** | Multa SIC por incumplimiento Ley 1581 | Consentimiento obligatorio con timestamp. Página de política pública. Mecanismos de ARCO implementados. Datos del responsable pendientes de confirmar. |

---

## 13. Notas pendientes (requieren confirmación del usuario)

Los siguientes datos son necesarios para completar la página de política de datos y no bloquean el desarrollo:

1. **NIT** de Tobón Distribuidora de Belleza.
2. **Dirección** de la sede.
3. **Correo de contacto** para temas de protección de datos.
4. **Número de vendedores** previstos (afecta si se necesita multi-sesión simultánea).

Estos campos se dejarán como placeholders `[POR CONFIRMAR]` en el código y se reemplazan antes del despliegue.
