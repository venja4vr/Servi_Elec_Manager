-- =====================================================================
-- Servi Elec Manager - Migración 15
-- Agrega columnas de costos a la tabla proyecto.
-- Requiere que la migración 14 (comuna_grupo) ya esté aplicada.
-- =====================================================================

BEGIN;

ALTER TABLE proyecto
    ADD COLUMN IF NOT EXISTS dias_estimados        INTEGER       DEFAULT 1;

ALTER TABLE proyecto
    ADD COLUMN IF NOT EXISTS cantidad_trabajadores INTEGER       DEFAULT 1;

ALTER TABLE proyecto
    ADD COLUMN IF NOT EXISTS comuna_grupo_id       VARCHAR(32);

ALTER TABLE proyecto
    ADD COLUMN IF NOT EXISTS porcentaje_ganancia   NUMERIC(5,2)  DEFAULT 15.00;

ALTER TABLE proyecto
    ADD COLUMN IF NOT EXISTS precio_dia_trabajador NUMERIC(10,2) DEFAULT 60000.00;

-- FK hacia comuna_grupo (idempotente: solo se agrega si no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   information_schema.table_constraints
        WHERE  constraint_name = 'fk_proyecto_comuna_grupo'
          AND  table_name      = 'proyecto'
    ) THEN
        ALTER TABLE proyecto
            ADD CONSTRAINT fk_proyecto_comuna_grupo
            FOREIGN KEY (comuna_grupo_id)
            REFERENCES comuna_grupo (id_cg)
            ON DELETE SET NULL
            ON UPDATE CASCADE;
    END IF;
END;
$$;

COMMIT;
