-- =====================================================================
-- Servi Elec Manager - Vinculación plantilla-material
-- Cada plantilla se asocia con sus materiales reales del inventario,
-- con la cantidad y unidad sugerida (datos extraídos de las fichas técnicas).
-- =====================================================================

INSERT INTO plantilla_material (plantilla_id, material_id, cantidad_sugerida, unidad) VALUES

-- ============================================================
-- PLA-TABLERO-12P: Instalación de Tablero Residencial 12 Polos
-- ============================================================
('PLA-TABLERO-12P', 'MAT-GABI-12P',     1,  'unidad'),
('PLA-TABLERO-12P', 'MAT-DISY-16A',     4,  'unidad'),
('PLA-TABLERO-12P', 'MAT-DIFE-25A',     1,  'unidad'),
('PLA-TABLERO-12P', 'MAT-PEINE-MONO',   1,  'unidad'),
('PLA-TABLERO-12P', 'MAT-CABLE-25-V',   15, 'metro'),

-- ============================================================
-- PLA-CAMBIO-INTERR: Cambio de Interruptores
-- ============================================================
('PLA-CAMBIO-INTERR', 'MAT-CABLE-15-R',   3, 'metro'),
('PLA-CAMBIO-INTERR', 'MAT-CINTA-3M',     1, 'unidad'),

-- ============================================================
-- PLA-DIAG-CORTOC: Diagnóstico y Reparación de Cortocircuito
-- ============================================================
('PLA-DIAG-CORTOC', 'MAT-CABLE-25-V',  5, 'metro'),
('PLA-DIAG-CORTOC', 'MAT-CINTA-3M',    1, 'unidad'),
('PLA-DIAG-CORTOC', 'MAT-DISY-10A',    1, 'unidad'),

-- ============================================================
-- PLA-MANT-TABLERO: Reparación y Mantención de Tablero Eléctrico
-- ============================================================
('PLA-MANT-TABLERO', 'MAT-DISY-16A', 2,  'unidad'),
('PLA-MANT-TABLERO', 'MAT-CINTA-3M', 1,  'unidad'),

-- ============================================================
-- PLA-CONFIG-MAQ: Configuración Completa de Maquinaria Industrial
-- ============================================================
('PLA-CONFIG-MAQ', 'MAT-CABLE-6-N',    50, 'metro'),
('PLA-CONFIG-MAQ', 'MAT-DISY-25A',     1, 'unidad'),

-- ============================================================
-- PLA-SIST-TRIF: Instalación de Sistema Energético Trifásico Completo
-- ============================================================
('PLA-SIST-TRIF', 'MAT-GABI-24P',       1, 'unidad'),
('PLA-SIST-TRIF', 'MAT-DIFE-T-40A',     1, 'unidad'),
('PLA-SIST-TRIF', 'MAT-CABLE-10-N',     150, 'metro'),
('PLA-SIST-TRIF', 'MAT-CABLE-6-N',      80, 'metro'),