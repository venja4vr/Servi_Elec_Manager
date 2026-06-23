-- 05_migracion_estado_usuario.sql
-- Migración: agregar campo estado a usuario y crear rol SuperAdmin
-- Fecha: 16-05-2026

-- 1. Agregar columna estado con default 'pendiente'
ALTER TABLE usuario
ADD COLUMN estado VARCHAR(20) NOT NULL DEFAULT 'pendiente';

-- 2. Marcar usuarios existentes como 'aprobado' (ya estaban en el sistema antes)
UPDATE usuario SET estado = 'aprobado';

-- 3. Convertir a Avercio en SuperAdmin para que pueda aprobar a otros
UPDATE usuario SET rol = 'S' WHERE correo = 'avercio@servielec.cl';

-- 4. Verificación (opcional, solo muestra el resultado)
SELECT id_usuario, nombre_usuario, correo, rol, estado FROM usuario;