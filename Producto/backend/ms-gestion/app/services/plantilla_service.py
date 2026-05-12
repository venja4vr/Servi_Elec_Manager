from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.plantilla import Plantilla
from app.models.plantilla_material import PlantillaMaterial
from app.models.material import Material
from app.schemas.plantilla import PlantillaCreate, PlantillaUpdate


def listar_plantillas(db: Session):
    return db.query(Plantilla).all()


def obtener_plantilla(db: Session, plantilla_id: str):
    p = db.query(Plantilla).filter(Plantilla.id_plantilla == plantilla_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    return p


def crear_plantilla(db: Session, data: PlantillaCreate):
    p = Plantilla(**data.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


def actualizar_plantilla(db: Session, plantilla_id: str, data: PlantillaUpdate):
    p = obtener_plantilla(db, plantilla_id)
    for campo, valor in data.model_dump(exclude_none=True).items():
        setattr(p, campo, valor)
    db.commit()
    db.refresh(p)
    return p


def eliminar_plantilla(db: Session, plantilla_id: str):
    p = obtener_plantilla(db, plantilla_id)
    db.delete(p)
    db.commit()
    return {"mensaje": "Plantilla eliminada"}


def obtener_materiales_de_plantilla(db: Session, plantilla_id: str):
    """
    Devuelve los materiales vinculados a una plantilla con sus datos del inventario.
    Para cada material indica si hay stock suficiente para cubrir la cantidad sugerida.
    """
    # Verificar que la plantilla existe
    plantilla = obtener_plantilla(db, plantilla_id)

    # Hacer join entre plantilla_material y material
    vinculaciones = (
        db.query(PlantillaMaterial, Material)
        .join(Material, PlantillaMaterial.material_id == Material.id_material)
        .filter(PlantillaMaterial.plantilla_id == plantilla_id)
        .all()
    )

    # Construir la respuesta enriquecida
    materiales = []
    for pm, mat in vinculaciones:
        materiales.append({
            "material_id": mat.id_material,
            "nombre_material": mat.nombre_material,
            "cantidad_sugerida": pm.cantidad_sugerida,
            "unidad": pm.unidad,
            "stock_actual": mat.stock_actual,
            "stock_critico": mat.stock_critico,
            "precio_unitario": mat.precio_unitario,
            "suficiente_stock": mat.stock_actual >= pm.cantidad_sugerida,
        })

    return {
        "id_plantilla": plantilla.id_plantilla,
        "nombre_servicio": plantilla.nombre_servicio,
        "descripcion": plantilla.descripcion,
        "precio_estimado": plantilla.precio_estimado,
        "materiales": materiales,
    }