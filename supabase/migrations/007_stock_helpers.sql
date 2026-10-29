-- Atomic relative stock increment/decrement.
-- Using a relative UPDATE (stock = stock + p_delta) prevents the TOCTOU race
-- in voidSale and the absolute-overwrite race in completeSale rollback paths.
-- p_delta is positive to restore stock (void/rollback), negative to decrement.

CREATE OR REPLACE FUNCTION increment_stock(p_product_id UUID, p_delta INTEGER)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE products
  SET stock       = stock + p_delta,
      updated_at  = now()
  WHERE id = p_product_id;
$$;
