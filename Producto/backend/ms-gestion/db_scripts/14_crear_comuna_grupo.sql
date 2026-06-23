-- =====================================================================
-- Servi Elec Manager - Migración 14
-- Crea la tabla comuna_grupo e inserta los 8 grupos de distancia
-- calculados desde La Calera, Paradero 26, Quinta Región.
-- precio_por_km = $105 CLP/km (diesel $1.050/litro, rendimiento 10 km/l)
-- =====================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS comuna_grupo (
    id_cg         VARCHAR(32)  PRIMARY KEY,
    nombre        VARCHAR(80)  NOT NULL,
    descripcion   TEXT,
    rango_km_min  INTEGER      NOT NULL,
    rango_km_max  INTEGER      NOT NULL,
    precio_por_km INTEGER      NOT NULL
);

INSERT INTO comuna_grupo (id_cg, nombre, descripcion, rango_km_min, rango_km_max, precio_por_km)
VALUES
    (
        'zona_01_local',
        'Local (0–15 km)',
        'La Calera, La Cruz, San Pedro, Quillota',
        0, 15, 105
    ),
    (
        'zona_02_proxima',
        'Próxima (16–35 km)',
        'Hijuelas, Nogales, Limache, Olmué',
        16, 35, 105
    ),
    (
        'zona_03_semi',
        'Semi-media (36–55 km)',
        'Catemu, Llaillay, Quilpué, Villa Alemana',
        36, 55, 105
    ),
    (
        'zona_04_valpo',
        'Valparaíso y Costa Norte (56–72 km)',
        'San Felipe, Panquehue, Santa María, Casablanca, Concón, Viña del Mar, Valparaíso, Puchuncaví, Quintero',
        56, 72, 105
    ),
    (
        'zona_05_andes',
        'Andes e Interior (73–90 km)',
        'Rinconada, Calle Larga, Los Andes, San Esteban, Putaendo',
        73, 90, 105
    ),
    (
        'zona_06_costa_media',
        'Costa Sur Media (91–110 km)',
        'Algarrobo, El Quisco, El Tabo',
        91, 110, 105
    ),
    (
        'zona_07_san_antonio',
        'San Antonio (111–125 km)',
        'Cartagena, San Antonio',
        111, 125, 105
    ),
    (
        'zona_08_extremo',
        'Extremo Sur (126–145 km)',
        'Santo Domingo',
        126, 145, 105
    )
ON CONFLICT (id_cg) DO NOTHING;

COMMIT;
