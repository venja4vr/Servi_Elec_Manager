"""
Servicio del comparador de precios externos.

Versión actual: usa datos simulados con precios realistas del rubro eléctrico
correspondientes a Sodimac y Easy. En la siguiente fase se reemplazará por
web scraping real con Playwright.
"""

"""
Los materiales de la lista corresponden a los usados en las fichas,
además de algunos otros
"""
CATALOGO_MOCK = [
    {"codigo": "110243855", "nombre": "Cable THHN 2.5mm² 100m Verde", "marca": "Cordón Andino", "precio": 38940, "tienda": "Sodimac", "imagen": "https://sodimac.scene7.com/is/image/SodimacCL/cable-thhn-25mm", "url": "https://www.sodimac.cl/sodimac-cl/product/15871234"},
    {"codigo": "SKU 175515", "nombre": "Cable THHN 2.5mm² 100m Verde", "marca": "Madeco", "precio": 41810, "tienda": "Easy", "imagen": "https://easycl.vtexassets.com/arquivos/ids/cable-thhn-25", "url": "https://www.easy.cl/p/cable-thhn-25mm-5582341"},
    {"codigo": "147232671", "nombre": "Cable THHN 1.5mm² 100m Rojo", "marca": "Cordón Andino", "precio": 61190, "tienda": "Sodimac", "imagen": "https://sodimac.scene7.com/is/image/SodimacCL/cable-thhn-15mm", "url": "https://www.sodimac.cl/sodimac-cl/product/15881235"},
    {"codigo": "SKU 174813", "nombre": "Cable THHN 1.5mm² 100m Rojo", "marca": "Madeco", "precio": 41810, "tienda": "Easy", "imagen": "https://easycl.vtexassets.com/arquivos/ids/cable-thhn-15", "url": "https://www.easy.cl/p/cable-thhn-15mm-5582342"},
    {"codigo": "110238002", "nombre": "Disyuntor Termomagnético 16A Curva C", "marca": "Schneider Electric", "precio": 4390, "tienda": "Sodimac", "imagen": "https://sodimac.scene7.com/is/image/SodimacCL/disyuntor-16a", "url": "https://www.sodimac.cl/sodimac-cl/product/15921100"},
    {"codigo": "SKU 420976", "nombre": "Disyuntor Termomagnético 16A Curva C", "marca": "Legrand", "precio": 3290, "tienda": "Easy", "imagen": "https://easycl.vtexassets.com/arquivos/ids/disyuntor-16a", "url": "https://www.easy.cl/p/disyuntor-16a-5601122"},
    {"codigo": "110218257", "nombre": "Interruptor Diferencial 25A 30mA", "marca": "Schneider Electric", "precio": 22790, "tienda": "Sodimac", "imagen": "https://sodimac.scene7.com/is/image/SodimacCL/diferencial-25a", "url": "https://www.sodimac.cl/sodimac-cl/product/15921105"},
    {"codigo": "SKU 1400519", "nombre": "Interruptor Diferencial 25A 30mA", "marca": "Legrand", "precio": 8150, "tienda": "Easy", "imagen": "https://easycl.vtexassets.com/arquivos/ids/diferencial-25a", "url": "https://www.easy.cl/p/diferencial-25a-5601127"},
    {"codigo": "110216262", "nombre": "Gabinete Sobrepuesto 12 Polos Termoplástico", "marca": "Schneider Electric", "precio": 27990, "tienda": "Sodimac", "imagen": "https://sodimac.scene7.com/is/image/SodimacCL/gabinete-12p", "url": "https://www.sodimac.cl/sodimac-cl/product/15931200"},
    {"codigo": "148289000", "nombre": "Ampolleta LED E27 9W Luz Fría", "marca": "Philips", "precio": 2190, "tienda": "Sodimac", "imagen": "https://sodimac.scene7.com/is/image/SodimacCL/ampolleta-led-9w", "url": "https://www.sodimac.cl/sodimac-cl/product/15941301"},
    {"codigo": "SKU 1287474", "nombre": "Ampolleta LED E27 9W Luz Fría", "marca": "Osram", "precio": 1790, "tienda": "Easy", "imagen": "https://easycl.vtexassets.com/arquivos/ids/ampolleta-led-9w", "url": "https://www.easy.cl/p/ampolleta-led-9w-5621340"},
    {"codigo": "116949436", "nombre": "Plafón LED 18W Redondo", "marca": "Philips", "precio": 4590, "tienda": "Sodimac", "imagen": "https://sodimac.scene7.com/is/image/SodimacCL/plafon-led-18w", "url": "https://www.sodimac.cl/sodimac-cl/product/15941350"},
    {"codigo": "144596224", "nombre": "Pelacables Profesional 8 pulgadas", "marca": "Stanley", "precio": 13718, "tienda": "Sodimac", "imagen": "https://sodimac.scene7.com/is/image/SodimacCL/pelacables", "url": "https://www.sodimac.cl/sodimac-cl/product/15951401"},
    {"codigo": "137921064", "nombre": "Multitester Digital", "marca": "Truper", "precio": 4890, "tienda": "Sodimac", "imagen": "https://sodimac.scene7.com/is/image/SodimacCL/multitester", "url": "https://www.sodimac.cl/sodimac-cl/product/15951410"},
    {"codigo": "ESKU 1257177", "nombre": "Multitester Digital", "marca": "Stanley", "precio": 34990, "tienda": "Easy", "imagen": "https://easycl.vtexassets.com/arquivos/ids/multitester", "url": "https://www.easy.cl/p/multitester-5631460"},
    {"codigo": "127385491", "nombre": "Interruptor Simple 9/12 Bticino", "marca": "Bticino", "precio": 2990, "tienda": "Sodimac", "imagen": "https://sodimac.scene7.com/is/image/SodimacCL/interruptor-simple-bticino", "url": "https://www.sodimac.cl/sodimac-cl/product/127385491"},
    {"codigo": "SKU 198432", "nombre": "Interruptor Simple 9/12 Bticino", "marca": "Bticino", "precio": 3290, "tienda": "Easy", "imagen": "https://easycl.vtexassets.com/arquivos/ids/interruptor-simple", "url": "https://www.easy.cl/p/interruptor-simple-198432"},
    {"codigo": "127385580", "nombre": "Interruptor Doble 9/24 Bticino", "marca": "Bticino", "precio": 4490, "tienda": "Sodimac", "imagen": "https://sodimac.scene7.com/is/image/SodimacCL/interruptor-doble", "url": "https://www.sodimac.cl/sodimac-cl/product/127385580"},
    {"codigo": "126778521", "nombre": "Caja Embutida Plástica Cuadrada", "marca": "Legrand", "precio": 590, "tienda": "Sodimac", "imagen": "https://sodimac.scene7.com/is/image/SodimacCL/caja-embutida", "url": "https://www.sodimac.cl/sodimac-cl/product/126778521"},
    {"codigo": "139482671", "nombre": "Cinta Aisladora 3M Negra 18mm", "marca": "3M", "precio": 1290, "tienda": "Sodimac", "imagen": "https://sodimac.scene7.com/is/image/SodimacCL/cinta-aisladora", "url": "https://www.sodimac.cl/sodimac-cl/product/139482671"},
    {"codigo": "SKU 256741", "nombre": "Cinta Aisladora 3M Negra 18mm", "marca": "3M", "precio": 1490, "tienda": "Easy", "imagen": "https://easycl.vtexassets.com/arquivos/ids/cinta-aisladora", "url": "https://www.easy.cl/p/cinta-aisladora-256741"},
    {"codigo": "148729034", "nombre": "Conector Wago 3 Vías 222-413", "marca": "Wago", "precio": 1490, "tienda": "Sodimac", "imagen": "https://sodimac.scene7.com/is/image/SodimacCL/wago-3vias", "url": "https://www.sodimac.cl/sodimac-cl/product/148729034"},
    {"codigo": "SKU 387219", "nombre": "Tubo Termocontraíble 6mm 1m", "marca": "Sumitomo", "precio": 790, "tienda": "Easy", "imagen": "https://easycl.vtexassets.com/arquivos/ids/termocontraible", "url": "https://www.easy.cl/p/termocontraible-387219"},
    {"codigo": "110238015", "nombre": "Disyuntor Termomagnético 10A Curva C", "marca": "Schneider Electric", "precio": 3890, "tienda": "Sodimac", "imagen": "https://sodimac.scene7.com/is/image/SodimacCL/disyuntor-10a", "url": "https://www.sodimac.cl/sodimac-cl/product/110238015"},
    {"codigo": "129472108", "nombre": "Terminal Pin Aislado 2.5mm² (50 unid)", "marca": "Klauke", "precio": 5990, "tienda": "Sodimac", "imagen": "https://sodimac.scene7.com/is/image/SodimacCL/terminal-pin", "url": "https://www.sodimac.cl/sodimac-cl/product/129472108"},
    {"codigo": "138291046", "nombre": "Limpiador Dieléctrico Aerosol 400ml", "marca": "WD-40", "precio": 5990, "tienda": "Sodimac", "imagen": "https://sodimac.scene7.com/is/image/SodimacCL/limpiador-dielectrico", "url": "https://www.sodimac.cl/sodimac-cl/product/138291046"},
    {"codigo": "147382091", "nombre": "Etiquetas Adhesivas para Rotulación Eléctrica", "marca": "Brady", "precio": 2890, "tienda": "Sodimac", "imagen": "https://sodimac.scene7.com/is/image/SodimacCL/etiquetas-rotulacion", "url": "https://www.sodimac.cl/sodimac-cl/product/147382091"},
    {"codigo": "118472093", "nombre": "Cable THHN 6mm² 100m Negro", "marca": "Cordón Andino", "precio": 89990, "tienda": "Sodimac", "imagen": "https://sodimac.scene7.com/is/image/SodimacCL/cable-thhn-6mm-negro", "url": "https://www.sodimac.cl/sodimac-cl/product/118472093"},
    {"codigo": "118472094", "nombre": "Cable THHN 6mm² 100m Verde", "marca": "Cordón Andino", "precio": 89990, "tienda": "Sodimac", "imagen": "https://sodimac.scene7.com/is/image/SodimacCL/cable-thhn-6mm-verde", "url": "https://www.sodimac.cl/sodimac-cl/product/118472094"},
    {"codigo": "118562478", "nombre": "Cable THHN 10mm² 100m Negro", "marca": "Cordón Andino", "precio": 179990, "tienda": "Sodimac", "imagen": "https://sodimac.scene7.com/is/image/SodimacCL/cable-thhn-10mm", "url": "https://www.sodimac.cl/sodimac-cl/product/118562478"},
    {"codigo": "115648372", "nombre": "Contactor Magnético Trifásico 25A LC1D", "marca": "Schneider Electric", "precio": 54990, "tienda": "Sodimac", "imagen": "https://sodimac.scene7.com/is/image/SodimacCL/contactor-25a", "url": "https://www.sodimac.cl/sodimac-cl/product/115648372"},
    {"codigo": "115648380", "nombre": "Relé Térmico 7-10A LRD", "marca": "Schneider Electric", "precio": 38500, "tienda": "Sodimac", "imagen": "https://sodimac.scene7.com/is/image/SodimacCL/rele-termico", "url": "https://www.sodimac.cl/sodimac-cl/product/115648380"},
    {"codigo": "115648395", "nombre": "Guardamotor Trifásico 9-13A GV2ME", "marca": "Schneider Electric", "precio": 72890, "tienda": "Sodimac", "imagen": "https://sodimac.scene7.com/is/image/SodimacCL/guardamotor-13a", "url": "https://www.sodimac.cl/sodimac-cl/product/115648395"},
    {"codigo": "117384920", "nombre": "Canalización Metálica EMT 3/4\" x 3m", "marca": "Wheatland", "precio": 4200, "tienda": "Sodimac", "imagen": "https://sodimac.scene7.com/is/image/SodimacCL/emt-3-4", "url": "https://www.sodimac.cl/sodimac-cl/product/117384920"},
    {"codigo": "117384925", "nombre": "Canalización Metálica EMT 1\" x 3m", "marca": "Wheatland", "precio": 5040, "tienda": "Sodimac", "imagen": "https://sodimac.scene7.com/is/image/SodimacCL/emt-1", "url": "https://www.sodimac.cl/sodimac-cl/product/117384925"},
    {"codigo": "129483756", "nombre": "Terminal de Cobre Tipo Ojo 6mm² (10 unid)", "marca": "Klauke", "precio": 6000, "tienda": "Sodimac", "imagen": "https://sodimac.scene7.com/is/image/SodimacCL/terminal-ojo", "url": "https://www.sodimac.cl/sodimac-cl/product/129483756"},
    {"codigo": "118573091", "nombre": "Tablero Trifásico 24 Polos Sobrepuesto", "marca": "Schneider Electric", "precio": 129890, "tienda": "Sodimac", "imagen": "https://sodimac.scene7.com/is/image/SodimacCL/tablero-24p", "url": "https://www.sodimac.cl/sodimac-cl/product/118573091"},
    {"codigo": "110238420", "nombre": "Disyuntor Trifásico 32A Curva C", "marca": "Schneider Electric", "precio": 58990, "tienda": "Sodimac", "imagen": "https://sodimac.scene7.com/is/image/SodimacCL/disyuntor-trifasico-32a", "url": "https://www.sodimac.cl/sodimac-cl/product/110238420"},
    {"codigo": "110238425", "nombre": "Disyuntor Trifásico 16A Curva C", "marca": "Schneider Electric", "precio": 49000, "tienda": "Sodimac", "imagen": "https://sodimac.scene7.com/is/image/SodimacCL/disyuntor-trifasico-16a", "url": "https://www.sodimac.cl/sodimac-cl/product/110238425"},
    {"codigo": "110218485", "nombre": "Interruptor Diferencial Trifásico 40A 30mA", "marca": "Schneider Electric", "precio": 89990, "tienda": "Sodimac", "imagen": "https://sodimac.scene7.com/is/image/SodimacCL/diferencial-trifasico", "url": "https://www.sodimac.cl/sodimac-cl/product/110218485"},
    {"codigo": "127483920", "nombre": "Prensaestopas PG-21 Metálico", "marca": "Lapp", "precio": 750, "tienda": "Sodimac", "imagen": "https://sodimac.scene7.com/is/image/SodimacCL/prensaestopas-pg21", "url": "https://www.sodimac.cl/sodimac-cl/product/127483920"}
]


def buscar_productos(query: str = "", tienda: str = ""):
    resultados = CATALOGO_MOCK

    if tienda:
        resultados = [p for p in resultados if p["tienda"].lower() == tienda.lower()]

    if query:
        q = query.lower().strip()
        resultados = [p for p in resultados if q in p["nombre"].lower() or q in p["marca"].lower()]

    return resultados