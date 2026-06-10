-- =====================================================================
-- Servi Elec Manager - Migración 16
-- Agrega la columna dias_default a la tabla plantilla.
-- Permite que una plantilla sugiera una duración estimada en días,
-- que se usa como valor inicial al crear un proyecto desde el bot.
-- =====================================================================

BEGIN;

ALTER TABLE plantilla
    ADD COLUMN IF NOT EXISTS dias_default INTEGER DEFAULT 1;

COMMIT;
