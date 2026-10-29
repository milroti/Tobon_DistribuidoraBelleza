-- ═══════════════════════════════════════════════════════════════
-- 001_initial_schema.sql
-- Tobón Distribuidora de Belleza — Schema inicial
-- ═══════════════════════════════════════════════════════════════

-- ─── ENUMS ───
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

-- ─── PROFILES (extiende auth.users) ───
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  role        user_role NOT NULL DEFAULT 'vendor',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── CATEGORIES ───
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed inicial de categorías
INSERT INTO categories (name, slug) VALUES
  ('Cabello', 'cabello'),
  ('Uñas', 'unas'),
  ('Maquillaje', 'maquillaje'),
  ('Cuidado de Piel', 'cuidado-de-piel'),
  ('Herramientas', 'herramientas');

-- ─── PRODUCTS ───
CREATE TABLE products (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  description  TEXT,
  barcode      TEXT UNIQUE,
  category_id  UUID REFERENCES categories(id),
  brand        TEXT,
  cost_price   INTEGER NOT NULL DEFAULT 0,       -- pesos colombianos (sin decimales)
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

-- ─── CUSTOMERS ───
CREATE TABLE customers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name   TEXT NOT NULL,
  last_name    TEXT NOT NULL,
  cedula       TEXT UNIQUE NOT NULL,
  phone        TEXT NOT NULL,
  email        TEXT,
  consent_at   TIMESTAMPTZ NOT NULL,             -- timestamp aceptación Ley 1581
  consent_ip   TEXT,                              -- IP al momento del consentimiento
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_cedula ON customers(cedula);

-- ─── SALES ───
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

-- ─── SALE ITEMS ───
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

-- ─── INVENTORY ADJUSTMENTS ───
CREATE TABLE inventory_adjustments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES products(id),
  adjusted_by     UUID NOT NULL REFERENCES profiles(id),
  previous_stock  INTEGER NOT NULL,
  new_stock       INTEGER NOT NULL,
  reason          TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── AUDIT LOGS (inmutable — sin UPDATE ni DELETE) ───
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
