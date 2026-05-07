from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.movimiento import Movimiento
from app.models.material import Material
from app.models.proyecto import Proyecto
from app.schemas.movimiento import MovimientoCreate


def listar_movimientos(db: Session):
    return db.query(Movimiento).order_by(Movimiento.fecha_salida.desc()).all()


def listar_por_proyecto(db: Session, proyecto_id: str):
    return db.query(Movimiento).filter(
        Movimiento.proyecto_id == proyecto_id
    ).all()


def registrar_movimiento(db: Session, data: MovimientoCreate, usuario_id: str):
    # Verificar que el proyecto existe
    proyecto = db.query(Proyecto).filter(Proyecto.id_proyecto == data.proyecto_id).first()
    if not proyecto:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")

    # Verificar que el material existe
    material = db.query(Material).filter(Material.id_material == data.material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material no encontrado")

    # Verificar stock suficiente
    if material.stock_actual < data.cantidad:
        raise HTTPException(
            status_code=400,
            detail=f"Stock insuficiente. Disponible: {material.stock_actual}, solicitado: {data.cantidad}"
        )

    # Descontar stock automáticamente
    material.stock_actual -= data.cantidad

    # Registrar movimiento tomando usuario desde el token JWT
    mov = Movimiento(
        cantidad=data.cantidad,
        proyecto_id=data.proyecto_id,
        material_id=data.material_id,
        usuario_id=usuario_id,
    )
    db.add(mov)
    db.commit()
    db.refresh(mov)
    return mov