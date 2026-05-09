"""
Servicio del comparador de precios externos.

Versión actual: usa datos simulados con precios realistas del rubro eléctrico
correspondientes a Sodimac y Easy. En la siguiente fase se reemplazará por
web scraping real con Playwright.
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
]


def buscar_productos(query: str = "", tienda: str = ""):
    resultados = CATALOGO_MOCK

    if tienda:
        resultados = [p for p in resultados if p["tienda"].lower() == tienda.lower()]

    if query:
        q = query.lower().strip()
        resultados = [p for p in resultados if q in p["nombre"].lower() or q in p["marca"].lower()]

    return resultados