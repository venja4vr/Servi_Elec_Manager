-- =====================================================================
-- Servi Elec Manager - Migración 10
-- Agrega columnas de precio Sodimac a la tabla material.
-- =====================================================================

BEGIN;

ALTER TABLE material
    ADD COLUMN IF NOT EXISTS precio_sodimac_actual      NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS precio_sodimac_actualizado TIMESTAMP;

COMMIT;
