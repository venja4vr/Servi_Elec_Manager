-- =====================================================================
-- Servi Elec Manager — Esquema Completo PostgreSQL
-- Generado el 2026-06-16
-- Refleja el estado tras las migraciones 01 al 24.
-- Compatible con PostgreSQL 13+
-- Importable en: pgModeler, DBeaver, Oracle Data Modeler, psql
-- =====================================================================

-- Orden de creación respeta dependencias de FK:
-- 1. Tablas sin dependencias (lookup/referencia)
-- 2. Tablas con dependencias simples
-- 3. Tablas puente (N:N)
-- 4. Tablas de auditoría/historial

-- ─────────────────────────────────────────────────────────────────────
-- 1. USUARIO
-- Usuarios del sistema (S=SuperAdmin, A=Administrador).
-- Nuevos registros llegan como 'pendiente' hasta ser aprobados por S.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario     VARCHAR(15)  PRIMARY KEY,
    nombre_usuario VARCHAR(50)  NOT NULL,
    correo         VARCHAR(40)  NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    rol            CHAR(1)      NOT NULL DEFAULT 'A'
                   CONSTRAINT usuario_rol_check CHECK (rol IN ('S', 'A', 'T')),
    estado         VARCHAR(20)  NOT NULL DEFAULT 'pendiente'
                   CONSTRAINT usuario_estado_check CHECK (estado IN ('pendiente', 'aprobado'))
);


-- ─────────────────────────────────────────────────────────────────────
-- 2. CATEGORIA (de materiales de inventario)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categoria (
    id_categoria     VARCHAR(20) PRIMARY KEY,
    nombre_categoria VARCHAR(50) NOT NULL UNIQUE
);


-- ─────────────────────────────────────────────────────────────────────
-- 3. CATEGORIA_PLANTILLA
-- Categorías dinámicas para las plantillas de servicio.
-- Se usan para construir el menú de categorías del chatbot WhatsApp.
-- NOTA: plantilla.categoria hace match por nombre con esta tabla (no FK directa).
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categoria_plantilla (
    id_categoria   VARCHAR(32) PRIMARY KEY,
    nombre         VARCHAR(80) NOT NULL UNIQUE,
    activa         BOOLEAN     NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ─────────────────────────────────────────────────────────────────────
-- 4. PLANTILLA
-- Plantillas de servicio (trabajos estandarizados). El chatbot las usa
-- para mostrar opciones de cotización y estimación de costos.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plantilla (
    id_plantilla          VARCHAR(20)   PRIMARY KEY,
    nombre_servicio       VARCHAR(60)   NOT NULL UNIQUE,
    descripcion           VARCHAR(200),
    materiales_sugeridos  TEXT,                            -- legado; usar plantilla_material
    precio_estimado       NUMERIC(9, 2) CHECK (precio_estimado >= 0),
    categoria             VARCHAR(40),                     -- match por nombre con categoria_plantilla
    activa                BOOLEAN       NOT NULL DEFAULT TRUE,
    dias_default          INTEGER       DEFAULT 1,
    horas_diarias_default INTEGER       DEFAULT 8,
    trabajadores_default  INTEGER       DEFAULT 1,
    dias_minimos          INTEGER       DEFAULT 1,         -- validación mínima en chatbot
    horas_minimas         INTEGER       DEFAULT 1          -- validación mínima en chatbot
);


-- ─────────────────────────────────────────────────────────────────────
-- 5. MATERIAL
-- Inventario de materiales eléctricos de Servi Elec.
-- precio_sodimac_actual se actualiza vía scraper automático.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS material (
    id_material                VARCHAR(20)   PRIMARY KEY,
    nombre_material            VARCHAR(50)   NOT NULL,
    descripcion                VARCHAR(250),
    stock_actual               INTEGER       NOT NULL DEFAULT 0
                               CHECK (stock_actual >= 0),
    stock_critico              INTEGER       NOT NULL DEFAULT 0
                               CHECK (stock_critico >= 0),
    precio_unitario            NUMERIC(9, 2) NOT NULL DEFAULT 0
                               CHECK (precio_unitario >= 0),
    categoria_id               VARCHAR(20)   NOT NULL,
    precio_sodimac_actual      NUMERIC(12, 2),
    precio_sodimac_actualizado TIMESTAMP,
    unidad_compra              VARCHAR(20)   NOT NULL DEFAULT 'unidad'
                               CHECK (unidad_compra IN ('unidad','metro','rollo','kilo','litro')),

    CONSTRAINT fk_material_categoria
        FOREIGN KEY (categoria_id)
        REFERENCES categoria (id_categoria)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


-- ─────────────────────────────────────────────────────────────────────
-- 6. MATERIAL_PRECIO_HISTORICO
-- Historial de precios capturados por el scraper (Sodimac, Easy) o
-- ingresados manualmente. Permite análisis de outliers y tendencias.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS material_precio_historico (
    id_pmh      VARCHAR(32)   PRIMARY KEY,
    material_id VARCHAR(20)   NOT NULL,
    precio      NUMERIC(12,2) NOT NULL,
    fuente      VARCHAR(20)   NOT NULL
                CHECK (fuente IN ('sodimac', 'manual')),
    tienda      VARCHAR(20)   DEFAULT 'Sodimac',
    es_outlier  BOOLEAN       NOT NULL DEFAULT FALSE,
    fecha       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_pmh_material
        FOREIGN KEY (material_id)
        REFERENCES material (id_material)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pmh_material_fecha
    ON material_precio_historico (material_id, fecha DESC);


-- ─────────────────────────────────────────────────────────────────────
-- 7. PLANTILLA_MATERIAL (tabla puente N:N)
-- Define qué materiales y en qué cantidades requiere cada plantilla de
-- servicio. Reemplaza el campo legado materiales_sugeridos (TEXT).
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plantilla_material (
    plantilla_id      VARCHAR(20)   NOT NULL,
    material_id       VARCHAR(20)   NOT NULL,
    cantidad_sugerida NUMERIC(9, 2) NOT NULL CHECK (cantidad_sugerida > 0),
    unidad            VARCHAR(15)   NOT NULL,

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


-- ─────────────────────────────────────────────────────────────────────
-- 8. COMUNA_GRUPO
-- Zonas de distancia (km) desde La Calera hacia comunas de la Quinta
-- Región. Se usa para calcular el costo de bencina del técnico.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comuna_grupo (
    id_cg         VARCHAR(32) PRIMARY KEY,
    nombre        VARCHAR(80) NOT NULL,
    descripcion   TEXT,
    rango_km_min  INTEGER     NOT NULL,
    rango_km_max  INTEGER     NOT NULL,
    precio_por_km INTEGER     NOT NULL    -- $105 CLP/km (diesel a $1.050/L, 10 km/L)
);


-- ─────────────────────────────────────────────────────────────────────
-- 9. PROYECTO
-- Trabajos/proyectos de Servi Elec. Creados manualmente o via chatbot.
-- Ciclo de vida: pendiente → en_curso → finalizado | cancelado.
-- Las columnas de costos (mig 15+18) calculan el presupuesto estimado.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS proyecto (
    id_proyecto           VARCHAR(20)    PRIMARY KEY,
    nombre_proyecto       VARCHAR(50)    NOT NULL,
    tipo_proyecto         VARCHAR(25),
    nombre_cliente        VARCHAR(50)    NOT NULL,
    telefono_cliente      VARCHAR(20),
    direccion_cliente     VARCHAR(150),
    fecha_inicio          DATE           DEFAULT CURRENT_DATE,
    estado                VARCHAR(10)    NOT NULL DEFAULT 'pendiente'
                          CHECK (estado IN ('pendiente','en_curso','finalizado','cancelado')),
    presupuesto_estimado  NUMERIC(9, 2)  CHECK (presupuesto_estimado >= 0),
    presupuesto_final     NUMERIC(9, 2)  CHECK (presupuesto_final >= 0),
    fecha_termino_maximo  DATE,
    plantilla_id          VARCHAR(20),
    observaciones         VARCHAR(500),
    -- Costos (agregados en migraciones 15 y 18)
    dias_estimados        INTEGER        DEFAULT 1,
    cantidad_trabajadores INTEGER        DEFAULT 1,
    horas_diarias         INTEGER        DEFAULT 8,
    comuna_grupo_id       VARCHAR(32),
    porcentaje_ganancia   NUMERIC(5, 2)  DEFAULT 15.00,
    precio_dia_trabajador NUMERIC(10, 2) DEFAULT 60000.00,

    CONSTRAINT fk_proyecto_plantilla
        FOREIGN KEY (plantilla_id)
        REFERENCES plantilla (id_plantilla)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_proyecto_comuna_grupo
        FOREIGN KEY (comuna_grupo_id)
        REFERENCES comuna_grupo (id_cg)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);


-- ─────────────────────────────────────────────────────────────────────
-- 10. PROYECTO_MATERIAL
-- Materiales planeados para un proyecto (antes de ejecutarse).
-- Si externo=true, el material no descuenta stock interno.
-- material_id puede ser NULL cuando el material es externo sin registro.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS proyecto_material (
    id_pm                   VARCHAR(32)    PRIMARY KEY,      -- sustituyó la PK compuesta (mig 09)
    proyecto_id             VARCHAR(20)    NOT NULL,
    material_id             VARCHAR(20),                      -- nullable desde mig 09
    cantidad_planeada       NUMERIC(9, 2)  NOT NULL CHECK (cantidad_planeada > 0),
    externo                 BOOLEAN        NOT NULL DEFAULT FALSE,
    nombre_material_externo VARCHAR(200),
    precio_unitario_externo NUMERIC(12, 2),

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

-- Evita duplicar el mismo material del inventario en el mismo proyecto
CREATE UNIQUE INDEX IF NOT EXISTS uix_pm_proyecto_material
    ON proyecto_material (proyecto_id, material_id)
    WHERE material_id IS NOT NULL;


-- ─────────────────────────────────────────────────────────────────────
-- 11. MOVIMIENTO
-- Registro de entradas y salidas de stock en el inventario.
-- Cada movimiento está ligado a un proyecto, un material y un usuario.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS movimiento (
    id_movimiento VARCHAR(100) PRIMARY KEY,
    cantidad      INTEGER      NOT NULL CHECK (cantidad > 0),
    fecha_salida  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    proyecto_id   VARCHAR(20)  NOT NULL,
    material_id   VARCHAR(20)  NOT NULL,
    usuario_id    VARCHAR(15)  NOT NULL,

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


-- ─────────────────────────────────────────────────────────────────────
-- 12. NOTIFICACION
-- Notificaciones in-app para usuarios (alertas de stock, solicitudes, etc.)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notificacion (
    id_notificacion VARCHAR(15)  PRIMARY KEY,
    usuario_id      VARCHAR(15)  NOT NULL,
    tipo            VARCHAR(50)  NOT NULL,
    titulo          VARCHAR(200) NOT NULL,
    mensaje         TEXT         NOT NULL,
    leida           BOOLEAN      NOT NULL DEFAULT FALSE,
    creada_en       TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_notificacion_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuario (id_usuario)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_notificacion_usuario_id ON notificacion (usuario_id);
CREATE INDEX IF NOT EXISTS ix_notificacion_leida      ON notificacion (leida);
