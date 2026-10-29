-- ═══════════════════════════════════════════════════════════════
-- 003_storage.sql
-- Bucket para fotos de productos
-- ═══════════════════════════════════════════════════════════════

-- Crear bucket público para fotos de productos
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-photos', 'product-photos', true);

-- Admin puede subir fotos
CREATE POLICY "product_photos_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-photos' AND get_user_role() = 'admin');

-- Todos pueden ver (bucket público)
CREATE POLICY "product_photos_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'product-photos');

-- Admin puede borrar fotos
CREATE POLICY "product_photos_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'product-photos' AND get_user_role() = 'admin');

-- Admin puede actualizar fotos (reemplazar)
CREATE POLICY "product_photos_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-photos' AND get_user_role() = 'admin');
