-- Migración corregida: soporte para materiales externos nuevos
BEGIN;

-- 1. Agregar columna id_pm
ALTER TABLE proyecto_material ADD COLUMN id_pm VARCHAR(32);

-- 2. Poblar id_pm en filas existentes
UPDATE proyecto_material
   SET id_pm = md5(proyecto_id || material_id || clock_timestamp()::text);

-- 3. Eliminar la PK vieja PRIMERO (antes era el problema)
ALTER TABLE proyecto_material DROP CONSTRAINT proyecto_material_pkey;

-- 4. AHORA SÍ quitar NOT NULL de material_id
ALTER TABLE proyecto_material ALTER COLUMN material_id DROP NOT NULL;

-- 5. Establecer id_pm como nueva PK
ALTER TABLE proyecto_material ALTER COLUMN id_pm SET NOT NULL;
ALTER TABLE proyecto_material ADD PRIMARY KEY (id_pm);

-- 6. Índice único para evitar duplicar materiales del inventario
CREATE UNIQUE INDEX uix_pm_proyecto_material
    ON proyecto_material(proyecto_id, material_id)
    WHERE material_id IS NOT NULL;

-- 7. Columnas para materiales externos nuevos
ALTER TABLE proyecto_material ADD COLUMN nombre_material_externo VARCHAR(200);
ALTER TABLE proyecto_material ADD COLUMN precio_unitario_externo DECIMAL(12,2);

COMMIT;