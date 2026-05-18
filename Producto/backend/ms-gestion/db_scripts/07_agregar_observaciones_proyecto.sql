-- 07_agregar_observaciones_proyecto.sql
-- Migración: agregar campo observaciones a proyecto
-- Fecha: 17-05-2026
-- Justificación: el bot de WhatsApp pregunta al cliente "¿Alguna observación adicional?"
-- pero esa información se perdía. Ahora se guarda y muestra en el detalle del proyecto.

ALTER TABLE proyecto
ADD COLUMN observaciones VARCHAR(500);

-- Verificar
SELECT id_proyecto, nombre_proyecto, observaciones FROM proyecto LIMIT 5;