-- =====================================================================
-- Servi Elec Manager - Migración 13
-- Agrega la columna unidad_compra a la tabla material.
-- Valores posibles: unidad, metro, rollo, kilo, litro.
-- =====================================================================

BEGIN;

ALTER TABLE material
    ADD COLUMN IF NOT EXISTS unidad_compra VARCHAR(20) NOT NULL DEFAULT 'unidad';

COMMIT;
