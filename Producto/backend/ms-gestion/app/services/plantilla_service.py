from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from app.models.plantilla import Plantilla
from app.models.plantilla_material import PlantillaMaterial
from app.models.material import Material
from app.schemas.plantilla import PlantillaCreate, PlantillaUpdate


def listar_plantillas(db: Session):
    return (
        db.query(Plantilla)
        .options(joinedload(Plantilla.materiales_vinculados))
        .all()
    )


def listar_plantillas_por_categoria(db: Session, categoria: str):
    return (
        db.query(Plantilla)
        .options(joinedload(Plantilla.materiales_vinculados))
        .filter(Plantilla.categoria == categoria, Plantilla.activa == True)
        .all()
    )


def obtener_plantilla(db: Session, plantilla_id: str):
    p = (
        db.query(Plantilla)
        .options(joinedload(Plantilla.materiales_vinculados))
        .filter(Plantilla.id_plantilla == plantilla_id)
        .first()
    )
    if not p:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    return p


def _sincronizar_materiales(db: Session, plantilla_id: str, materiales_in):
    """Elimina los materiales actuales y los reemplaza con la lista nueva."""
    db.query(PlantillaMaterial).filter(
        PlantillaMaterial.plantilla_id == plantilla_id
    ).delete(synchronize_session="fetch")

    for m in materiales_in:
        pm = PlantillaMaterial(
            plantilla_id=plantilla_id,
            material_id=m.material_id,
            cantidad_sugerida=m.cantidad_sugerida,
            unidad=m.unidad,
        )
        db.add(pm)


def crear_plantilla(db: Session, data: PlantillaCreate):
    materiales = data.materiales or []
    campos = data.model_dump(exclude={"materiales"})
    p = Plantilla(**campos)
    db.add(p)
    db.flush()  # obtiene el id_plantilla generado antes del commit
    _sincronizar_materiales(db, p.id_plantilla, materiales)
    db.commit()
    db.refresh(p)
    return p


def actualizar_plantilla(db: Session, plantilla_id: str, data: PlantillaUpdate):
    p = obtener_plantilla(db, plantilla_id)

    campos = data.model_dump(exclude_none=True, exclude={"materiales"})
    for campo, valor in campos.items():
        setattr(p, campo, valor)

    if data.materiales is not None:
        _sincronizar_materiales(db, plantilla_id, data.materiales)

    db.commit()
    db.refresh(p)
    return p


def eliminar_plantilla(db: Session, plantilla_id: str):
    p = obtener_plantilla(db, plantilla_id)
    db.delete(p)
    db.commit()
    return {"mensaje": "Plantilla eliminada"}


def obtener_materiales_de_plantilla(db: Session, plantilla_id: str):
    plantilla = obtener_plantilla(db, plantilla_id)

    vinculaciones = (
        db.query(PlantillaMaterial, Material)
        .join(Material, PlantillaMaterial.material_id == Material.id_material)
        .filter(PlantillaMaterial.plantilla_id == plantilla_id)
        .all()
    )

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
