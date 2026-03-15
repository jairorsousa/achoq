-- =========================================================
-- Bucket para imagens de eventos em destaque
-- =========================================================
-- Execute este script no SQL Editor do Supabase.
-- Alternativa: crie o bucket manualmente em Storage > New Bucket.

-- 1) Criar bucket publico
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2) Politica de leitura publica (qualquer um pode ver as imagens)
CREATE POLICY "Public read event images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'event-images');

-- 3) Politica de upload/update apenas para admins autenticados
CREATE POLICY "Admin upload event images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'event-images'
    AND auth.role() = 'authenticated'
    AND public.is_admin()
  );

CREATE POLICY "Admin update event images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'event-images'
    AND auth.role() = 'authenticated'
    AND public.is_admin()
  );

CREATE POLICY "Admin delete event images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'event-images'
    AND auth.role() = 'authenticated'
    AND public.is_admin()
  );
