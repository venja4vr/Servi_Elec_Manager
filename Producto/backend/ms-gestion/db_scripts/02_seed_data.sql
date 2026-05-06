-- =====================================================================
-- Servi Elec Manager - Microservicio de Gestión
-- Script de carga de datos iniciales (seed)
-- Base de datos: PostgreSQL
-- =====================================================================
-- Este script inserta los datos mínimos necesarios para que el sistema
-- funcione tras una instalación limpia: un usuario administrador,
-- categorías típicas del rubro eléctrico y las plantillas de servicio
-- iniciales acordadas con el cliente Servi Elec.
-- =====================================================================

-- ---------------------------------------------------------------------
-- USUARIO administrador inicial
-- ---------------------------------------------------------------------
-- IMPORTANTE: el password_hash es solo un placeholder.
-- Antes del despliegue real, reemplazar por un hash bcrypt válido
-- generado desde la lógica de autenticación del backend.
INSERT INTO usuario (id_usuario, nombre_usuario, correo, password_hash, rol)
VALUES ('USR-ADMIN-0001', 'Avercio Zamora', 'avercio@servielec.cl', 'CAMBIAR_HASH_BCRYPT', 'A');

-- ---------------------------------------------------------------------
-- CATEGORIAS de material
-- ---------------------------------------------------------------------
INSERT INTO categoria (id_categoria, nombre_categoria) VALUES
    ('CAT-CONDUCTORES',   'Conductores'),
    ('CAT-PROTECCIONES',  'Protecciones'),
    ('CAT-TABLEROS',      'Tableros'),
    ('CAT-ILUMINACION',   'Iluminación'),
    ('CAT-CANALIZACION',  'Canalización'),
    ('CAT-HERRAMIENTAS',  'Herramientas');

-- ---------------------------------------------------------------------
-- PLANTILLAS de servicio
-- ---------------------------------------------------------------------
INSERT INTO plantilla (id_plantilla, nombre_servicio, descripcion, materiales_sugeridos) VALUES
    ('PLA-TABLERO-12P',
     'Instalación de Tablero Residencial 12 Polos',
     'Normalización y montaje de tablero eléctrico general residencial con protecciones diferenciales según RIC.',
     'Gabinete sobrepuesto 12 polos, disyuntor termomagnético 16A, interruptor diferencial 25A 30mA, peine de conexión monofásico, cable THHN 2.5mm² (blanco/rojo/verde).'),

    ('PLA-CAMBIO-INTERR',
     'Cambio de Interruptores',
     'Reemplazo de interruptores defectuosos en instalaciones residenciales o comerciales.',
     'Interruptor simple, interruptor doble, caja embutida, cable THHN 1.5mm², cinta aisladora.'),

    ('PLA-CONEX-MAQUINARIA',
     'Conexión Eléctrica de Maquinaria Nueva',
     'Instalación y puesta en marcha de circuito dedicado para maquinaria industrial o equipos de alto consumo.',
     'Cable THHN 4mm², protector trifásico, contactor, canalización metálica, terminales.'),

    ('PLA-CONTACTO-ADMIN',
     'Contacto Directo con Administrador',
     'Plantilla para solicitudes que no encajan en categorías estándar y requieren evaluación manual del administrador.',
     'A definir según evaluación.');