-- ═══════════════════════════════════════════════════════════════
-- 005_analytics_functions.sql
-- Funciones SQL para el módulo de analíticas (solo admin)
-- ═══════════════════════════════════════════════════════════════

-- ─── Productos más vendidos en un período ───
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

-- ─── Ventas por hora del día ───
CREATE OR REPLACE FUNCTION sales_by_hour(
  p_from TIMESTAMPTZ,
  p_to TIMESTAMPTZ
)
RETURNS TABLE (
  hour INTEGER,
  sale_count BIGINT,
  total_amount BIGINT
) AS $$
  SELECT
    EXTRACT(HOUR FROM s.created_at AT TIME ZONE 'America/Bogota')::INTEGER AS hour,
    COUNT(*) AS sale_count,
    SUM(s.total) AS total_amount
  FROM sales s
  WHERE s.status = 'completed'
    AND s.created_at BETWEEN p_from AND p_to
  GROUP BY hour
  ORDER BY hour;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ─── Ventas por día del mes ───
CREATE OR REPLACE FUNCTION sales_by_day(
  p_from TIMESTAMPTZ,
  p_to TIMESTAMPTZ
)
RETURNS TABLE (
  sale_date DATE,
  sale_count BIGINT,
  total_amount BIGINT
) AS $$
  SELECT
    (s.created_at AT TIME ZONE 'America/Bogota')::DATE AS sale_date,
    COUNT(*) AS sale_count,
    SUM(s.total) AS total_amount
  FROM sales s
  WHERE s.status = 'completed'
    AND s.created_at BETWEEN p_from AND p_to
  GROUP BY sale_date
  ORDER BY sale_date;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ─── Rendimiento por vendedor ───
CREATE OR REPLACE FUNCTION seller_performance(
  p_from TIMESTAMPTZ,
  p_to TIMESTAMPTZ
)
RETURNS TABLE (
  seller_id UUID,
  seller_name TEXT,
  sale_count BIGINT,
  total_amount BIGINT
) AS $$
  SELECT
    s.seller_id,
    p.full_name AS seller_name,
    COUNT(*) AS sale_count,
    SUM(s.total) AS total_amount
  FROM sales s
  JOIN profiles p ON p.id = s.seller_id
  WHERE s.status = 'completed'
    AND s.created_at BETWEEN p_from AND p_to
  GROUP BY s.seller_id, p.full_name
  ORDER BY total_amount DESC;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ─── Ticket promedio en un período ───
CREATE OR REPLACE FUNCTION average_ticket(
  p_from TIMESTAMPTZ,
  p_to TIMESTAMPTZ
)
RETURNS TABLE (
  avg_ticket NUMERIC,
  total_sales BIGINT,
  total_revenue BIGINT
) AS $$
  SELECT
    ROUND(AVG(s.total)) AS avg_ticket,
    COUNT(*) AS total_sales,
    SUM(s.total) AS total_revenue
  FROM sales s
  WHERE s.status = 'completed'
    AND s.created_at BETWEEN p_from AND p_to;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
