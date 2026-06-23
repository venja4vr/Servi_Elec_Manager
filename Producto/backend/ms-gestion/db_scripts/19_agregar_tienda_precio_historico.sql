-- Migración 19: agrega columna tienda a material_precio_historico
-- Idempotente: usa IF NOT EXISTS para no romper si ya existe.
-- DEFAULT 'Sodimac' preserva todos los registros históricos existentes.

BEGIN;

ALTER TABLE material_precio_historico
    ADD COLUMN IF NOT EXISTS tienda VARCHAR(20) DEFAULT 'Sodimac';

COMMIT;
