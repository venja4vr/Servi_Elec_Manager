from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import Optional
from datetime import datetime
import uuid

from app.models.proyecto import Proyecto
from app.models.proyecto_material import ProyectoMaterial
from app.models.material import Material
from app.models.movimiento import Movimiento
from app.schemas.proyecto import ProyectoCreate, ProyectoUpdate, ProyectoCreateConMateriales


def listar_proyectos(db: Session, estado: Optional[str] = None):
    q = db.query(Proyecto)
    if estado:
        q = q.filter(Proyecto.estado == estado)
    return q.order_by(Proyecto.fecha_inicio.desc()).all()


def obtener_proyecto(db: Session, proyecto_id: str):
    p = db.query(Proyecto).filter(Proyecto.id_proyecto == proyecto_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    return p


def crear_proyecto(db: Session, data: ProyectoCreate):
    """Crear proyecto simple, sin materiales planeados (compatibilidad con código viejo)."""
    p = Proyecto(**data.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


def crear_proyecto_con_materiales(db: Session, data: ProyectoCreateConMateriales):
    """
    Crea un proyecto en estado 'pendiente' y guarda los materiales que planea usar.
    NO descuenta stock todavía. Solo se hace eso al cambiar el estado a 'en_curso'.
    """
    # Extraer materiales del payload
    materiales_lista = data.materiales

    # Crear el proyecto (sin los materiales que no son campos de Proyecto)
    datos_proyecto = data.model_dump(exclude={"materiales"})
    datos_proyecto["estado"] = "pendiente"

    proyecto = Proyecto(**datos_proyecto)
    db.add(proyecto)
    db.flush()  # genera el id_proyecto sin hacer commit todavía

    # Validar que cada material existe y guardar las planificaciones
    for item in materiales_lista:
        material_id = item.get("material_id")
        cantidad = item.get("cantidad_planeada")

        if not material_id or cantidad is None:
            raise HTTPException(
                status_code=400,
                detail="Cada material debe tener material_id y cantidad_planeada"
            )

        material = db.query(Material).filter(Material.id_material == material_id).first()
        if not material:
            raise HTTPException(
                status_code=400,
                detail=f"Material {material_id} no existe en el inventario"
            )

        pm = ProyectoMaterial(
            proyecto_id=proyecto.id_proyecto,
            material_id=material_id,
            cantidad_planeada=cantidad,
        )
        db.add(pm)

    db.commit()
    db.refresh(proyecto)
    return proyecto


def actualizar_proyecto(db: Session, proyecto_id: str, data: ProyectoUpdate):
    p = obtener_proyecto(db, proyecto_id)
    for campo, valor in data.model_dump(exclude_none=True).items():
        setattr(p, campo, valor)
    db.commit()
    db.refresh(p)
    return p


def cambiar_estado(db: Session, proyecto_id: str, nuevo_estado: str, usuario_id: str):
    """
    Cambia el estado del proyecto y ejecuta la lógica asociada:
    - pendiente → en_curso: descuenta el stock de los materiales planeados (crea movimientos).
    - en_curso → cancelado: devuelve el stock al inventario.
    - en_curso → finalizado: simplemente cambia el estado (los movimientos ya están registrados).
    """
    estados_validos = ["pendiente", "en_curso", "finalizado", "cancelado"]
    if nuevo_estado not in estados_validos:
        raise HTTPException(
            status_code=400,
            detail=f"Estado inválido. Válidos: {estados_validos}"
        )

    p = obtener_proyecto(db, proyecto_id)
    estado_actual = p.estado

    # Transición: pendiente → en_curso
    if estado_actual == "pendiente" and nuevo_estado == "en_curso":
        _ejecutar_descuento_stock(db, p, usuario_id)

    # Transición: en_curso → cancelado (devolver stock)
    elif estado_actual == "en_curso" and nuevo_estado == "cancelado":
        _devolver_stock(db, p)

    p.estado = nuevo_estado
    db.commit()
    db.refresh(p)
    return p


def _ejecutar_descuento_stock(db: Session, proyecto: Proyecto, usuario_id: str):
    """
    Lee los materiales planeados del proyecto, crea movimientos por cada uno
    y descuenta el stock real del inventario.
    Si un material no tiene stock suficiente, se descuenta lo que haya y queda
    como pendiente (el resto se registra implícitamente por falta de movimiento).
    """
    materiales_planeados = (
        db.query(ProyectoMaterial)
        .filter(ProyectoMaterial.proyecto_id == proyecto.id_proyecto)
        .all()
    )

    for pm in materiales_planeados:
        material = db.query(Material).filter(Material.id_material == pm.material_id).first()
        if not material:
            continue

        cantidad_a_descontar = min(int(pm.cantidad_planeada), material.stock_actual)
        if cantidad_a_descontar > 0:
            # Crear movimiento
            mov = Movimiento(
                id_movimiento=uuid.uuid4().hex,
                cantidad=cantidad_a_descontar,
                fecha_salida=datetime.utcnow(),
                proyecto_id=proyecto.id_proyecto,
                material_id=material.id_material,
                usuario_id=usuario_id,
            )
            db.add(mov)

            # Descontar stock
            material.stock_actual -= cantidad_a_descontar


def _devolver_stock(db: Session, proyecto: Proyecto):
    """
    Revierte todos los movimientos asociados al proyecto:
    devuelve la cantidad descontada al stock del material y elimina los movimientos.
    """
    movimientos = (
        db.query(Movimiento)
        .filter(Movimiento.proyecto_id == proyecto.id_proyecto)
        .all()
    )

    for mov in movimientos:
        material = db.query(Material).filter(Material.id_material == mov.material_id).first()
        if material:
            material.stock_actual += mov.cantidad
        db.delete(mov)


def eliminar_proyecto(db: Session, proyecto_id: str):
    p = obtener_proyecto(db, proyecto_id)

    # Si está en curso, primero devolver el stock antes de eliminar
    if p.estado == "en_curso":
        _devolver_stock(db, p)

    db.delete(p)
    db.commit()
    return {"mensaje": "Proyecto eliminado"}


def obtener_materiales_planeados(db: Session, proyecto_id: str):
    """
    Devuelve los materiales planeados de un proyecto con sus datos del inventario.
    """
    obtener_proyecto(db, proyecto_id)  # valida que existe

    vinculaciones = (
        db.query(ProyectoMaterial, Material)
        .join(Material, ProyectoMaterial.material_id == Material.id_material)
        .filter(ProyectoMaterial.proyecto_id == proyecto_id)
        .all()
    )

    resultado = []
    for pm, mat in vinculaciones:
        resultado.append({
            "material_id": mat.id_material,
            "nombre_material": mat.nombre_material,
            "cantidad_planeada": pm.cantidad_planeada,
            "stock_actual": mat.stock_actual,
            "precio_unitario": mat.precio_unitario,
            "suficiente_stock": mat.stock_actual >= pm.cantidad_planeada,
        })

    return resultado