import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.material import Material
from app.models.precio_historico import MaterialPrecioHistorico
from app.services.scraper_sodimac import buscar_en_sodimac

logger = logging.getLogger(__name__)


def _insertar_historico(material_id: str, precio: float, fuente: str, db: Session) -> None:
    registro = MaterialPrecioHistorico(
        material_id=material_id,
        precio=round(precio, 2),
        fuente=fuente,
    )
    db.add(registro)


def actualizar_precio_material(material_id: str, db: Session) -> bool:
    """Busca el material en Sodimac y guarda el promedio de los 3 primeros precios.
    También inserta un registro en el histórico con fuente='sodimac'.
    Devuelve True si se actualizó, False si el scraper falló o no hubo resultados."""
    material = db.query(Material).filter(Material.id_material == material_id).first()
    if not material:
        return False

    try:
        resultados = buscar_en_sodimac(material.nombre_material)
    except Exception as e:
        logger.error(f"[precio_service] Error scraper para '{material.nombre_material}': {e}")
        return False

    if not resultados:
        logger.info(f"[precio_service] Sin resultados para '{material.nombre_material}'")
        return False

    precios_validos = [
        r["precio"] for r in resultados[:3]
        if r.get("precio") is not None
    ]
    if not precios_validos:
        logger.info(f"[precio_service] Resultados sin precio para '{material.nombre_material}'")
        return False

    promedio = sum(precios_validos) / len(precios_validos)
    material.precio_sodimac_actual = round(promedio, 2)
    material.precio_sodimac_actualizado = datetime.now(timezone.utc)
    _insertar_historico(material_id, promedio, "sodimac", db)
    db.commit()
    return True


def actualizar_todos_los_precios(db: Session) -> dict:
    """Itera todos los materiales y actualiza sus precios Sodimac."""
    materiales = db.query(Material).all()
    total = len(materiales)
    actualizados = 0
    fallidos = 0

    for m in materiales:
        ok = actualizar_precio_material(m.id_material, db)
        if ok:
            actualizados += 1
        else:
            fallidos += 1

    return {"actualizados": actualizados, "fallidos": fallidos, "total": total}


def actualizar_precios_de_plantillas(db: Session) -> dict:
    """Actualiza solo los materiales que aparecen en alguna plantilla."""
    result = db.execute(text("SELECT DISTINCT material_id FROM plantilla_material"))
    material_ids = [row[0] for row in result]

    total = len(material_ids)
    actualizados = 0
    fallidos = 0

    for mid in material_ids:
        ok = actualizar_precio_material(mid, db)
        if ok:
            actualizados += 1
        else:
            fallidos += 1

    return {"actualizados": actualizados, "fallidos": fallidos, "total": total}


def guardar_precio_manual(material_id: str, precio: float, db: Session) -> bool:
    """Guarda un precio ingresado manualmente por el admin e inserta histórico."""
    material = db.query(Material).filter(Material.id_material == material_id).first()
    if not material:
        return False
    material.precio_sodimac_actual = round(precio, 2)
    material.precio_sodimac_actualizado = datetime.now(timezone.utc)
    _insertar_historico(material_id, precio, "manual", db)
    db.commit()
    return True
