from decimal import Decimal
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
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
    try:
        db.delete(p)
        db.commit()
    except IntegrityError:
        db.rollback()
        from app.models.proyecto import Proyecto
        count = db.query(Proyecto).filter(Proyecto.plantilla_id == plantilla_id).count()
        raise HTTPException(
            status_code=409,
            detail=f"No se puede eliminar: hay {count} proyecto{'s' if count != 1 else ''} asociado{'s' if count != 1 else ''} a esta plantilla. Reasigna o elimina esos proyectos primero.",
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al eliminar plantilla: {str(e)}")
    return {"mensaje": "Plantilla eliminada"}


def calcular_cotizacion_plantilla(db: Session, plantilla_id: str) -> dict:
    p = obtener_plantilla(db, plantilla_id)

    vinculaciones = (
        db.query(PlantillaMaterial, Material)
        .join(Material, PlantillaMaterial.material_id == Material.id_material)
        .filter(PlantillaMaterial.plantilla_id == plantilla_id)
        .all()
    )

    materiales = []
    total_estimado = Decimal("0")
    nombres_sin_precio = []

    for pm, mat in vinculaciones:
        precio = mat.precio_sodimac_actual
        sin_precio = precio is None
        subtotal = None
        if not sin_precio:
            subtotal = Decimal(str(pm.cantidad_sugerida)) * Decimal(str(precio))
            total_estimado += subtotal
        else:
            nombres_sin_precio.append(mat.nombre_material)

        materiales.append({
            "nombre_material": mat.nombre_material,
            "cantidad": pm.cantidad_sugerida,
            "unidad": pm.unidad,
            "precio_unitario": precio,
            "subtotal": subtotal,
            "sin_precio": sin_precio,
        })

    return {
        "plantilla_id": p.id_plantilla,
        "nombre_servicio": p.nombre_servicio,
        "descripcion": p.descripcion,
        "materiales": materiales,
        "total_estimado": total_estimado,
        "materiales_sin_precio": nombres_sin_precio,
    }


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
