-- =====================================================================
-- Servi Elec Manager - Microservicio de Gestión
-- Script de creación de tablas (versión 2: con tabla puente plantilla_material)
-- Base de datos: PostgreSQL
-- =====================================================================

-- Tabla USUARIO
CREATE TABLE usuario (
    id_usuario      VARCHAR(15)  PRIMARY KEY,
    nombre_usuario  VARCHAR(50)  NOT NULL,
    correo          VARCHAR(40)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    rol             CHAR(1)      NOT NULL DEFAULT 'A'
                    CHECK (rol IN ('S', 'A', 'T')),
    estado          VARCHAR(20)  NOT NULL DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente', 'aprobado'))
);

-- Tabla CATEGORIA
CREATE TABLE categoria (
    id_categoria     VARCHAR(20) PRIMARY KEY,
    nombre_categoria VARCHAR(50) NOT NULL UNIQUE
);

-- Tabla PLANTILLA (con precio_estimado nuevo)
CREATE TABLE plantilla (
    id_plantilla         VARCHAR(20)   PRIMARY KEY,
    nombre_servicio      VARCHAR(60)   NOT NULL UNIQUE,
    descripcion          VARCHAR(200),
    materiales_sugeridos TEXT,
    precio_estimado      NUMERIC(9, 2) CHECK (precio_estimado >= 0)
);

-- Tabla MATERIAL
CREATE TABLE material (
    id_material      VARCHAR(20)   PRIMARY KEY,
    nombre_material  VARCHAR(50)   NOT NULL,
    descripcion      VARCHAR(250),
    stock_actual     INTEGER       NOT NULL DEFAULT 0
                     CHECK (stock_actual >= 0),
    stock_critico    INTEGER       NOT NULL DEFAULT 0
                     CHECK (stock_critico >= 0),
    precio_unitario  NUMERIC(9, 2) NOT NULL DEFAULT 0
                     CHECK (precio_unitario >= 0),
    categoria_id     VARCHAR(20)   NOT NULL,
    CONSTRAINT fk_material_categoria
        FOREIGN KEY (categoria_id)
        REFERENCES categoria (id_categoria)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- Tabla PLANTILLA_MATERIAL (NUEVA: tabla puente)
-- Resuelve la relación N:N entre plantillas y materiales.
-- Permite que una plantilla tenga muchos materiales sugeridos con cantidades específicas,
-- y que un material aparezca en muchas plantillas distintas.
CREATE TABLE plantilla_material (
    plantilla_id        VARCHAR(20)   NOT NULL,
    material_id         VARCHAR(20)   NOT NULL,
    cantidad_sugerida   NUMERIC(9, 2) NOT NULL CHECK (cantidad_sugerida > 0),
    unidad              VARCHAR(15)   NOT NULL,
    PRIMARY KEY (plantilla_id, material_id),
    CONSTRAINT fk_pm_plantilla
        FOREIGN KEY (plantilla_id)
        REFERENCES plantilla (id_plantilla)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_pm_material
        FOREIGN KEY (material_id)
        REFERENCES material (id_material)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- Tabla PROYECTO (con telefono_cliente y direccion_cliente nuevos)
CREATE TABLE proyecto (
    id_proyecto           VARCHAR(20)   PRIMARY KEY,
    nombre_proyecto       VARCHAR(50)   NOT NULL,
    tipo_proyecto         VARCHAR(25),
    nombre_cliente        VARCHAR(50)   NOT NULL,
    telefono_cliente      VARCHAR(20),
    direccion_cliente     VARCHAR(150),
    fecha_inicio          DATE          DEFAULT CURRENT_DATE,
    estado                VARCHAR(10)   NOT NULL DEFAULT 'pendiente'
                          CHECK (estado IN ('pendiente', 'en_curso', 'finalizado', 'cancelado')),
    presupuesto_estimado  NUMERIC(9, 2) CHECK (presupuesto_estimado >= 0),
    presupuesto_final     NUMERIC(9, 2) CHECK (presupuesto_final >= 0),
    fecha_termino_maximo  DATE,
    plantilla_id          VARCHAR(20),
    CONSTRAINT fk_proyecto_plantilla
        FOREIGN KEY (plantilla_id)
        REFERENCES plantilla (id_plantilla)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- Tabla PROYECTO_MATERIAL (NUEVA: planificación de materiales)
-- Guarda qué materiales planea usar un proyecto, antes de que se ejecute.
-- Cuando el proyecto pasa a "en_curso", estos planes se convierten en movimientos reales.
CREATE TABLE proyecto_material (
    proyecto_id        VARCHAR(20)   NOT NULL,
    material_id        VARCHAR(20)   NOT NULL,
    cantidad_planeada  NUMERIC(9, 2) NOT NULL CHECK (cantidad_planeada > 0),
    PRIMARY KEY (proyecto_id, material_id),
    CONSTRAINT fk_pm_proy_proyecto
        FOREIGN KEY (proyecto_id)
        REFERENCES proyecto (id_proyecto)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_pm_proy_material
        FOREIGN KEY (material_id)
        REFERENCES material (id_material)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- Tabla MOVIMIENTO
CREATE TABLE movimiento (
    id_movimiento  VARCHAR(100)  PRIMARY KEY,
    cantidad       INTEGER       NOT NULL
                   CHECK (cantidad > 0),
    fecha_salida   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    proyecto_id    VARCHAR(20)   NOT NULL,
    material_id    VARCHAR(20)   NOT NULL,
    usuario_id     VARCHAR(15)   NOT NULL,
    CONSTRAINT fk_movimiento_proyecto
        FOREIGN KEY (proyecto_id)
        REFERENCES proyecto (id_proyecto)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_movimiento_material
        FOREIGN KEY (material_id)
        REFERENCES material (id_material)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_movimiento_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuario (id_usuario)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);