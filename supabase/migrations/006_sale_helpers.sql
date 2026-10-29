-- Helper: get next receipt number from sequence (called via admin.rpc)
CREATE OR REPLACE FUNCTION get_next_receipt_number()
RETURNS INTEGER
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT nextval('receipt_number_seq')::integer;
$$;
