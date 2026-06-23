BEGIN;

CREATE TABLE IF NOT EXISTS categoria_plantilla (
    id_categoria    VARCHAR(32) PRIMARY KEY,
    nombre          VARCHAR(80) UNIQUE NOT NULL,
    activa          BOOLEAN DEFAULT TRUE,
    fecha_creacion  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categoria_plantilla (id_categoria, nombre, activa)
VALUES
    ('cat_instalaciones',           'Instalaciones Eléctricas',  TRUE),
    ('cat_mantenciones',            'Mantenciones Eléctricas',   TRUE),
    ('cat_servicios_industriales',  'Servicios Industriales',    TRUE)
ON CONFLICT (id_categoria) DO NOTHING;

COMMIT;
