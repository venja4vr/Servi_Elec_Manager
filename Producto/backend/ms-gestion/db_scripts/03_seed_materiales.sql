-- =====================================================================
-- Servi Elec Manager - Materiales iniciales del inventario
-- Datos coherentes con las plantillas y fichas del proyecto.
-- =====================================================================

INSERT INTO material (id_material, nombre_material, descripcion, stock_actual, stock_critico, precio_unitario, categoria_id) VALUES

-- ---------- CONDUCTORES ----------
('MAT-CABLE-25-V', 'Cable THHN 2.5mm² 100m Verde',
 'Cable de cobre flexible para tendido en canalización. Ideal para fase, neutro o tierra según código de color.',
 8, 3, 38940, 'CAT-CONDUCTORES'),

('MAT-CABLE-15-R', 'Cable THHN 1.5mm² 100m Rojo',
 'Cable de cobre flexible 1.5mm². Recomendado para circuitos de iluminación residencial.',
 5, 2, 19990, 'CAT-CONDUCTORES'),

('MAT-CABLE-6-N', 'Cable THHN 6mm² 100m Negro',
 'Cable para alimentadores principales y circuitos de fuerza. Calibre robusto para cargas medianas.',
 3, 1, 89990, 'CAT-CONDUCTORES'),

('MAT-CABLE-10-N', 'Cable THHN 10mm² 100m Negro',
 'Cable para alimentadores trifásicos en instalaciones industriales o comerciales.',
 2, 1, 179990, 'CAT-CONDUCTORES'),

-- ---------- PROTECCIONES ----------
('MAT-DISY-16A', 'Disyuntor Termomagnético 16A Curva C',
 'Protección magnetotérmica para circuitos de tomas e iluminación. Marca Schneider Electric.',
 25, 5, 4390, 'CAT-PROTECCIONES'),

('MAT-DISY-10A', 'Disyuntor Termomagnético 10A Curva C',
 'Protección para circuitos de iluminación de baja carga. Curva C estándar.',
 18, 5, 3890, 'CAT-PROTECCIONES'),

('MAT-DISY-25A', 'Disyuntor Termomagnético 25A Curva C',
 'Protección para circuitos de fuerza, hornos y equipos de mediana carga.',
 12, 4, 5890, 'CAT-PROTECCIONES'),

('MAT-DIFE-25A', 'Interruptor Diferencial 25A 30mA',
 'Protección contra contactos directos e indirectos. Sensibilidad 30mA según norma chilena.',
 15, 4, 22790, 'CAT-PROTECCIONES'),

('MAT-DIFE-T-40A', 'Diferencial Trifásico 40A 30mA',
 'Protección diferencial trifásica para tableros industriales o comerciales.',
 4, 1, 89990, 'CAT-PROTECCIONES'),

-- ---------- TABLEROS ----------
('MAT-GABI-12P', 'Gabinete Sobrepuesto 12 Polos Termoplástico',
 'Gabinete plástico con tapa transparente para 12 módulos DIN. Apto para uso residencial.',
 7, 2, 27990, 'CAT-TABLEROS'),

('MAT-GABI-24P', 'Tablero Trifásico 24 Polos Sobrepuesto',
 'Tablero metálico para distribución trifásica industrial o comercial.',
 3, 1, 129890, 'CAT-TABLEROS'),

('MAT-PEINE-MONO', 'Peine de Conexión Monofásico',
 'Conector tipo peine para distribución de fase entre disyuntores en tablero residencial.',
 20, 5, 4490, 'CAT-TABLEROS'),

-- ---------- ILUMINACIÓN ----------
('MAT-AMP-LED-9W', 'Ampolleta LED E27 9W Luz Fría',
 'Ampolleta LED estándar para reemplazar incandescente. Equivalente a 60W.',
 50, 10, 2190, 'CAT-ILUMINACION'),

('MAT-PLAFON-LED-18', 'Plafón LED 18W Redondo',
 'Plafón LED de superficie para iluminación general. Adecuado para baños, cocinas o pasillos.',
 14, 4, 4590, 'CAT-ILUMINACION'),

-- ---------- HERRAMIENTAS ----------
('MAT-PELACABLES', 'Pelacables Profesional 8 pulgadas',
 'Herramienta multifuncional para pelar, cortar y crimpar cables.',
 6, 2, 13718, 'CAT-HERRAMIENTAS'),

('MAT-MULTITESTER', 'Multitester Digital',
 'Instrumento para medición de voltaje, corriente, resistencia y continuidad.',
 4, 1, 4890, 'CAT-HERRAMIENTAS'),

('MAT-CINTA-3M', 'Cinta Aisladora 3M Negra 18mm',
 'Cinta vinílica autoadhesiva para aislación de empalmes eléctricos.',
 40, 10, 1290, 'CAT-HERRAMIENTAS');