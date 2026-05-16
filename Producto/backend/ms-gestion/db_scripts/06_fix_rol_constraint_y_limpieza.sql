-- 06_fix_rol_constraint_y_limpieza.sql
-- Fix: actualizar constraint de rol para aceptar SuperAdmin y limpiar usuarios de prueba
-- Fecha: 16-05-2026

-- 1. Eliminar la restricción vieja que solo permitía A y T
ALTER TABLE usuario DROP CONSTRAINT usuario_rol_check;

-- 2. Crear la nueva restricción con S (SuperAdmin), A (Admin), T (Técnico)
ALTER TABLE usuario ADD CONSTRAINT usuario_rol_check 
    CHECK (rol IN ('S', 'A', 'T'));

-- 3. Eliminar usuarios de prueba (David y Hans)
DELETE FROM usuario WHERE correo IN ('dvd8768@gmail.com', 'hansbravo2004@gmail.com');

-- 4. Convertir Avercio en SuperAdmin
UPDATE usuario SET rol = 'S' WHERE correo = 'avercio@servielec.cl';

-- 5. Verificar resultado
SELECT id_usuario, nombre_usuario, correo, rol, estado FROM usuario;