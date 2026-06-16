from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.categoria_plantilla import CategoriaPlantilla
from app.models.plantilla import Plantilla
from app.schemas.categoria_plantilla import CategoriaPlantillaIn, CategoriaPlantillaUpdate


def listar_categorias(db: Session, solo_con_plantillas: bool = False):
    q = db.query(CategoriaPlantilla).filter(CategoriaPlantilla.activa == True)

    if solo_con_plantillas:
        nombres_usados = (
            db.query(Plantilla.categoria)
            .filter(Plantilla.activa == True, Plantilla.categoria.isnot(None))
            .distinct()
            .all()
        )
        nombres_set = {row[0] for row in nombres_usados if row[0]}
        q = q.filter(CategoriaPlantilla.nombre.in_(nombres_set))

    return q.order_by(CategoriaPlantilla.nombre).all()


def crear_categoria(db: Session, data: CategoriaPlantillaIn):
    existente = db.query(CategoriaPlantilla).filter(
        CategoriaPlantilla.id_categoria == data.id_categoria
    ).first()
    if existente:
        raise HTTPException(status_code=409, detail="Ya existe una categoría con ese ID.")

    nombre_dup = db.query(CategoriaPlantilla).filter(
        CategoriaPlantilla.nombre == data.nombre
    ).first()
    if nombre_dup:
        raise HTTPException(status_code=409, detail="Ya existe una categoría con ese nombre.")

    cat = CategoriaPlantilla(id_categoria=data.id_categoria, nombre=data.nombre, activa=True)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


def actualizar_categoria(db: Session, id_categoria: str, data: CategoriaPlantillaUpdate):
    cat = _obtener_o_404(db, id_categoria)

    nombre_dup = db.query(CategoriaPlantilla).filter(
        CategoriaPlantilla.nombre == data.nombre,
        CategoriaPlantilla.id_categoria != id_categoria,
    ).first()
    if nombre_dup:
        raise HTTPException(status_code=409, detail="Ya existe una categoría con ese nombre.")

    cat.nombre = data.nombre
    db.commit()
    db.refresh(cat)
    return cat


def desactivar_categoria(db: Session, id_categoria: str):
    cat = _obtener_o_404(db, id_categoria)
    cat.activa = False
    db.commit()
    return {"mensaje": "Categoría desactivada"}


def _obtener_o_404(db: Session, id_categoria: str) -> CategoriaPlantilla:
    cat = db.query(CategoriaPlantilla).filter(
        CategoriaPlantilla.id_categoria == id_categoria
    ).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada.")
    return cat
