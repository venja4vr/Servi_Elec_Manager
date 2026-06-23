-- 08_agregar_externo_proyecto_material.sql
-- Migración: agregar columna externo a proyecto_material
-- Fecha: 08-06-2026
-- Justificación: permite marcar materiales como "externos" (provistos por el cliente
-- o no descontables del inventario de Servi Elec). El flag externo=true indica que
-- el material nunca debe afectar el stock interno, ni al iniciar el proyecto ni al
-- agregarlo manualmente durante la ejecución.

ALTER TABLE proyecto_material
ADD COLUMN externo BOOLEAN NOT NULL DEFAULT false;

-- Verificar
SELECT proyecto_id, material_id, cantidad_planeada, externo
FROM proyecto_material
LIMIT 5;
