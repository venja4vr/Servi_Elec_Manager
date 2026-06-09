-- =====================================================================
-- Servi Elec Manager - Migración 11
-- Agrega campos categoria y activa a la tabla plantilla.
-- =====================================================================

BEGIN;

ALTER TABLE plantilla
    ADD COLUMN IF NOT EXISTS categoria VARCHAR(40),
    ADD COLUMN IF NOT EXISTS activa    BOOLEAN NOT NULL DEFAULT TRUE;

-- Asignar categorías a las plantillas del seed (por ID exacto)
UPDATE plantilla SET categoria = 'Instalaciones Eléctricas'
WHERE id_plantilla IN ('PLA-TABLERO-12P', 'PLA-CAMBIO-INTERR');

UPDATE plantilla SET categoria = 'Mantenciones Eléctricas'
WHERE id_plantilla IN ('PLA-DIAG-CORTOC', 'PLA-MANT-TABLERO');

UPDATE plantilla SET categoria = 'Servicios Industriales'
WHERE id_plantilla IN ('PLA-CONFIG-MAQ', 'PLA-SIST-TRIF');

-- Cualquier plantilla sin categoría asignada → Instalaciones Eléctricas por defecto
UPDATE plantilla
SET categoria = 'Instalaciones Eléctricas'
WHERE categoria IS NULL;

COMMIT;
