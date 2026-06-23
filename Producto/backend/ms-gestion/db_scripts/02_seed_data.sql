-- =====================================================================
-- Servi Elec Manager - Datos iniciales
-- Categorías, plantillas (con precio_estimado) y usuario administrador
-- =====================================================================

-- USUARIO ADMINISTRADOR (Avercio Zamora)
INSERT INTO usuario (id_usuario, nombre_usuario, correo, password_hash, rol) VALUES
('USR-AVERCIO', 'Avercio Zamora', 'avercio@servielec.cl', 'CAMBIAR_HASH_BCRYPT', 'A');

-- CATEGORÍAS DE MATERIALES
INSERT INTO categoria (id_categoria, nombre_categoria) VALUES
('CAT-CONDUCTORES',  'Conductores'),
('CAT-PROTECCIONES', 'Protecciones'),
('CAT-TABLEROS',     'Tableros'),
('CAT-ILUMINACION',  'Iluminación'),
('CAT-HERRAMIENTAS', 'Herramientas'),
('CAT-CANALIZACION', 'Canalización');

-- PLANTILLAS DE SERVICIO (las 6 que corresponden a tus fichas técnicas)
INSERT INTO plantilla (id_plantilla, nombre_servicio, descripcion, materiales_sugeridos, precio_estimado) VALUES

('PLA-TABLERO-12P',
 'Instalación de Tablero Residencial 12 Polos',
 'Normalización y montaje de tablero eléctrico general residencial con protecciones diferenciales según RIC.',
 'Gabinete sobrepuesto 12 polos, disyuntor termomagnético 16A, interruptor diferencial 25A 30mA, peine de conexión monofásico, cable THHN 2.5mm² (blanco/rojo/verde).',
 195000),

('PLA-CAMBIO-INTERR',
 'Cambio de Interruptores',
 'Reemplazo de interruptores defectuosos en instalaciones residenciales o comerciales.',
 'Interruptor simple, interruptor doble, caja embutida, cable THHN 1.5mm², cinta aisladora.',
 58000),

('PLA-DIAG-CORTOC',
 'Diagnóstico y Reparación de Cortocircuito',
 'Inspección y diagnóstico de cortocircuitos. Incluye prueba de aislamiento, reparación e instalación de protecciones.',
 'Cable THHN 2.5mm², conectores de empalme, cinta aisladora, terminales, tubo termocontraíble, disyuntor de reemplazo.',
 42500),

('PLA-MANT-TABLERO',
 'Reparación y Mantención de Tablero Eléctrico',
 'Inspección general del tablero, ajuste de borneras, reemplazo de protecciones desgastadas y rotulación.',
 'Disyuntores de reemplazo, terminales pin, cinta aisladora, limpiador dieléctrico, etiquetas para rotulación.',
 35000),

('PLA-CONFIG-MAQ',
 'Configuración Completa de Maquinaria Industrial',
 'Conexión y puesta en marcha de maquinaria industrial nueva. Incluye circuito dedicado y protecciones específicas.',
 'Cable THHN 6mm², contactor magnético trifásico, relé térmico, guardamotor, canalización metálica, terminales de cobre.',
 385000),

('PLA-SIST-TRIF',
 'Instalación de Sistema Energético Trifásico Completo',
 'Diseño e instalación de sistema trifásico para galpones industriales o talleres comerciales.',
 'Tablero trifásico 24 polos, disyuntores trifásicos, diferencial trifásico 40A, cable THHN 6/10mm², canalización EMT.',
 750000);