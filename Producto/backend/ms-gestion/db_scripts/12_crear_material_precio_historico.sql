--Nos saltamos el 11 por error---
-- =====================================================================
-- Servi Elec Manager - Migración 12
-- Crea la tabla de histórico de precios Sodimac/manual por material.
-- =====================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS material_precio_historico (
    id_pmh      VARCHAR(32)   PRIMARY KEY,
    material_id VARCHAR(20)   NOT NULL,
    precio      NUMERIC(12,2) NOT NULL,
    fuente      VARCHAR(20)   NOT NULL
                CHECK (fuente IN ('sodimac', 'manual')),
    fecha       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pmh_material
        FOREIGN KEY (material_id)
        REFERENCES material (id_material)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pmh_material_fecha
    ON material_precio_historico (material_id, fecha DESC);

COMMIT;
