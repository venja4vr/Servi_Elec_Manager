-- =====================================================================
-- Servi Elec Manager - Microservicio de Gestión
-- Script de creación de tablas
-- Base de datos: PostgreSQL
-- =====================================================================

-- Tabla USUARIO
-- Almacena administradores y técnicos del sistema.
-- El campo 'rol' diferencia entre Administrador (A) y Técnico (T).
CREATE TABLE usuario (
    id_usuario      VARCHAR(15)  PRIMARY KEY,
    nombre_usuario  VARCHAR(50)  NOT NULL,
    correo          VARCHAR(40)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    rol             CHAR(1)      NOT NULL DEFAULT 'A'
                    CHECK (rol IN ('A', 'T'))
);

-- Tabla CATEGORIA
-- Agrupa los materiales por tipo (ej: Conductores, Protecciones, Tableros).
-- Solo se relaciona con MATERIAL.
CREATE TABLE categoria (
    id_categoria     VARCHAR(20) PRIMARY KEY,
    nombre_categoria VARCHAR(50) NOT NULL UNIQUE
);

-- Tabla PLANTILLA
-- Define los servicios que ofrece la empresa (ej: "Instalación de Tablero 12 Polos").
-- Cada plantilla representa un tipo de trabajo con sus materiales sugeridos.
-- NO tiene relación con CATEGORIA (cambio aplicado tras actualización del MER).
CREATE TABLE plantilla (
    id_plantilla         VARCHAR(20)  PRIMARY KEY,
    nombre_servicio      VARCHAR(50)  NOT NULL UNIQUE,
    descripcion          VARCHAR(200),
    materiales_sugeridos TEXT
);

-- Tabla MATERIAL
-- Almacena el inventario de productos eléctricos.
-- Cada material pertenece a una categoría (FK a CATEGORIA).
-- El campo stock_critico define el umbral mínimo antes de alertar reposición.
CREATE TABLE material (
    id_material              VARCHAR(20)   PRIMARY KEY,
    nombre_material          VARCHAR(50)   NOT NULL,
    descripcion              VARCHAR(250),
    stock_actual             INTEGER       NOT NULL DEFAULT 0
                             CHECK (stock_actual >= 0),
    stock_critico            INTEGER       NOT NULL DEFAULT 0
                             CHECK (stock_critico >= 0),
    precio_unitario          NUMERIC(9, 2) NOT NULL DEFAULT 0
                             CHECK (precio_unitario >= 0),
    CATEGORIA_id_categoria   VARCHAR(20)   NOT NULL,
    CONSTRAINT fk_material_categoria
        FOREIGN KEY (CATEGORIA_id_categoria)
        REFERENCES categoria (id_categoria)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- Tabla PROYECTO
-- Representa cada obra o servicio contratado por un cliente.
-- Se vincula a una PLANTILLA (tipo de servicio) que define los materiales sugeridos.
-- El estado controla el ciclo de vida: pendiente -> en_curso -> finalizado / cancelado.
CREATE TABLE proyecto (
    id_proyecto              VARCHAR(20)   PRIMARY KEY,
    nombre_proyecto          VARCHAR(50)   NOT NULL,
    tipo_proyecto            VARCHAR(25),
    nombre_cliente           VARCHAR(50)   NOT NULL,
    fecha_inicio             DATE          DEFAULT CURRENT_DATE,
    estado                   VARCHAR(10)   NOT NULL DEFAULT 'pendiente'
                             CHECK (estado IN ('pendiente', 'en_curso', 'finalizado', 'cancelado')),
    presupuesto_estimado     NUMERIC(9, 2) CHECK (presupuesto_estimado >= 0),
    presupuesto_final        NUMERIC(9, 2) CHECK (presupuesto_final >= 0),
    fecha_termino_maximo     DATE,
    PLANTILLA_id_plantilla   VARCHAR(20),
    CONSTRAINT fk_proyecto_plantilla
        FOREIGN KEY (PLANTILLA_id_plantilla)
        REFERENCES plantilla (id_plantilla)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- Tabla MOVIMIENTO
-- Registra cada salida de material desde bodega hacia un proyecto.
-- Tiene tres FKs: PROYECTO (a qué obra), MATERIAL (qué se sacó), USUARIO (quién lo registró).
-- Cada movimiento descuenta automáticamente el stock del material asociado (lógica del backend).
CREATE TABLE movimiento (
    id_movimiento            VARCHAR(100)  PRIMARY KEY,
    cantidad                 INTEGER       NOT NULL
                             CHECK (cantidad > 0),
    fecha_salida             TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PROYECTO_id_proyecto     VARCHAR(20)   NOT NULL,
    MATERIAL_id_material     VARCHAR(20)   NOT NULL,
    USUARIO_id_usuario       VARCHAR(15)   NOT NULL,
    CONSTRAINT fk_movimiento_proyecto
        FOREIGN KEY (PROYECTO_id_proyecto)
        REFERENCES proyecto (id_proyecto)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_movimiento_material
        FOREIGN KEY (MATERIAL_id_material)
        REFERENCES material (id_material)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_movimiento_usuario
        FOREIGN KEY (USUARIO_id_usuario)
        REFERENCES usuario (id_usuario)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);