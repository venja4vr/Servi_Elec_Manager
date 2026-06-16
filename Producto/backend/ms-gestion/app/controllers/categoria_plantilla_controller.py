from sqlalchemy.orm import Session
from app.services import categoria_plantilla_service
from app.schemas.categoria_plantilla import CategoriaPlantillaIn, CategoriaPlantillaUpdate


def get_all(db: Session, solo_con_plantillas: bool = False):
    return categoria_plantilla_service.listar_categorias(db, solo_con_plantillas)


def create(db: Session, data: CategoriaPlantillaIn):
    return categoria_plantilla_service.crear_categoria(db, data)


def update(db: Session, id_categoria: str, data: CategoriaPlantillaUpdate):
    return categoria_plantilla_service.actualizar_categoria(db, id_categoria, data)


def delete(db: Session, id_categoria: str):
    return categoria_plantilla_service.desactivar_categoria(db, id_categoria)
