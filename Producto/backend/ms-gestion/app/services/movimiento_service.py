from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.movimiento import Movimiento
from app.models.material import Material
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.movimiento import MovimientoCreate

def listar_movimientos(db: Session):
    return db.query(Movimiento).order_by(Movimiento.fecha_salida.desc()).all()

def listar_por_proyecto(db: Session, proyecto_id: str):
    return db.query(Movimiento).filter(
        Movimiento.PROYECTO_id_proyecto == proyecto_id
    ).all()

def registrar_movimiento(db: Session, data: MovimientoCreate):
    # Verificar que el proyecto existe
    proyecto = db.query(Proyecto).filter(Proyecto.id_proyecto == data.PROYECTO_id_proyecto).first()
    if not proyecto:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")

    # Verificar que el material existe
    material = db.query(Material).filter(Material.id_material == data.MATERIAL_id_material).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material no encontrado")

    # Verificar que el usuario existe
    usuario = db.query(Usuario).filter(Usuario.id_usuario == data.USUARIO_id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Verificar stock suficiente
    if material.stock_actual < data.cantidad:
        raise HTTPException(
            status_code=400,
            detail=f"Stock insuficiente. Disponible: {material.stock_actual}, solicitado: {data.cantidad}"
        )

    # Descontar stock
    material.stock_actual -= data.cantidad

    # Registrar movimiento
    mov = Movimiento(**data.model_dump())
    db.add(mov)
    db.commit()
    db.refresh(mov)
    return mov