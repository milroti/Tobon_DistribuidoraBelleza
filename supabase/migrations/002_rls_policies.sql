-- ═══════════════════════════════════════════════════════════════
-- 002_rls_policies.sql
-- Row Level Security para todas las tablas
-- ═══════════════════════════════════════════════════════════════

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ─── Helper: obtener rol del usuario autenticado ───
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ═══════════════════════════════════════════
-- PROFILES
-- ═══════════════════════════════════════════
-- Lectura: todos (para mostrar nombre del vendedor)
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
-- Inserción: solo admin (el trigger se encarga del registro automático)
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (get_user_role() = 'admin');
-- Actualización: el propio usuario o admin
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (
  id = auth.uid() OR get_user_role() = 'admin'
);

-- ═══════════════════════════════════════════
-- CATEGORIES
-- ═══════════════════════════════════════════
CREATE POLICY "categories_select" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_modify" ON categories FOR ALL USING (get_user_role() = 'admin');

-- ═══════════════════════════════════════════
-- PRODUCTS
-- ═══════════════════════════════════════════
CREATE POLICY "products_select" ON products FOR SELECT USING (true);
CREATE POLICY "products_insert" ON products FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "products_update" ON products FOR UPDATE USING (get_user_role() = 'admin');
-- Stock se descuenta vía Server Action con service_role (bypass RLS)

-- ═══════════════════════════════════════════
-- CUSTOMERS
-- ═══════════════════════════════════════════
CREATE POLICY "customers_select" ON customers FOR SELECT USING (true);
-- Vendor puede registrar clientes en POS
CREATE POLICY "customers_insert" ON customers FOR INSERT WITH CHECK (true);
-- Actualización/eliminación: solo admin
CREATE POLICY "customers_update" ON customers FOR UPDATE USING (get_user_role() = 'admin');
CREATE POLICY "customers_delete" ON customers FOR DELETE USING (get_user_role() = 'admin');

-- ═══════════════════════════════════════════
-- SALES
-- ═══════════════════════════════════════════
-- Admin ve todo, vendor solo las suyas
CREATE POLICY "sales_select" ON sales FOR SELECT USING (
  get_user_role() = 'admin' OR seller_id = auth.uid()
);
-- Inserción: cualquier autenticado (el seller_id debe ser el propio)
CREATE POLICY "sales_insert" ON sales FOR INSERT WITH CHECK (seller_id = auth.uid());
-- Anulación: solo admin
CREATE POLICY "sales_update" ON sales FOR UPDATE USING (get_user_role() = 'admin');

-- ═══════════════════════════════════════════
-- SALE ITEMS
-- ═══════════════════════════════════════════
CREATE POLICY "sale_items_select" ON sale_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM sales WHERE sales.id = sale_items.sale_id
    AND (get_user_role() = 'admin' OR sales.seller_id = auth.uid())
  )
);
CREATE POLICY "sale_items_insert" ON sale_items FOR INSERT WITH CHECK (true);

-- ═══════════════════════════════════════════
-- INVENTORY ADJUSTMENTS
-- ═══════════════════════════════════════════
CREATE POLICY "inv_adj_select" ON inventory_adjustments FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "inv_adj_insert" ON inventory_adjustments FOR INSERT WITH CHECK (get_user_role() = 'admin');

-- ═══════════════════════════════════════════
-- AUDIT LOGS
-- ═══════════════════════════════════════════
-- Solo admin lee. Inserción vía service_role (Server Actions).
CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT USING (get_user_role() = 'admin');
