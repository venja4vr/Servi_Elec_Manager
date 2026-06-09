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
    estados_validos = ["pendiente", "en_curso", "finalizado", "cancelado"]
    if nuevo_estado not in estados_validos:
        raise HTTPException(
            status_code=400,
            detail=f"Estado inválido. Válidos: {estados_validos}"
        )

    p = obtener_proyecto(db, proyecto_id)
    estado_actual = p.estado

    # Transición: pendiente → en_curso (validar stock primero)
    if estado_actual == "pendiente" and nuevo_estado == "en_curso":
        _validar_stock_disponible(db, p)
        _ejecutar_descuento_stock(db, p, usuario_id)

    # Transición: en_curso → cancelado (devolver stock)
    elif estado_actual == "en_curso" and nuevo_estado == "cancelado":
        _devolver_stock(db, p)

    # ── Notificaciones WhatsApp al cliente ──────────────────
    from app.services.whatsapp_client import enviar_mensaje

    telefono = getattr(p, "telefono_cliente", None)
    nombre   = getattr(p, "nombre_cliente", "Cliente")
    servicio = getattr(p, "nombre_servicio", "servicio")

    if telefono:
        if nuevo_estado == "en_curso":
            msg = (
                f"Hola {nombre}, tu solicitud de *{servicio}* ha sido aceptada.\n"
                f"Te contactaremos pronto para coordinar la visita.\n\n"
                f"_Servi Elec_"
            )
            enviar_mensaje(telefono, msg)

        elif nuevo_estado == "finalizado":
            msg = (
                f"✅ Hola {nombre}, tu servicio de *{servicio}* ha sido completado.\n"
                f"Gracias por confiar en Servi Elec.\n\n"
                f"_Escribe *menú* si necesitas otro servicio._"
            )
            enviar_mensaje(telefono, msg)

    p.estado = nuevo_estado
    db.commit()
    db.refresh(p)
    return p


def _validar_stock_disponible(db: Session, proyecto: Proyecto):
    """
    Verifica que TODOS los materiales planeados tengan stock suficiente.
    Si falta aunque sea uno, lanza un error 400 con detalle estructurado para que
    el frontend pueda mostrar los materiales faltantes con sus cantidades.
    """
    materiales_planeados = (
        db.query(ProyectoMaterial)
        .filter(ProyectoMaterial.proyecto_id == proyecto.id_proyecto)
        .all()
    )

    faltantes = []
    for pm in materiales_planeados:
        material = db.query(Material).filter(Material.id_material == pm.material_id).first()
        if not material:
            continue

        cantidad_planeada = int(pm.cantidad_planeada)
        if material.stock_actual < cantidad_planeada:
            faltan = cantidad_planeada - material.stock_actual
            faltantes.append({
                "material_id": material.id_material,
                "nombre": material.nombre_material,
                "planeado": cantidad_planeada,
                "disponible": material.stock_actual,
                "faltan": faltan,
            })

    if faltantes:
        # Mensaje legible + lista estructurada
        nombres = ", ".join([f"{f['nombre']} (faltan {f['faltan']})" for f in faltantes])
        raise HTTPException(
            status_code=400,
            detail={
                "mensaje": "Stock insuficiente para aceptar el proyecto",
                "resumen": nombres,
                "faltantes": faltantes,
            }
        )


def _ejecutar_descuento_stock(db: Session, proyecto: Proyecto, usuario_id: str):
    """
    Lee los materiales planeados NO externos del proyecto, crea movimientos
    y descuenta el stock real del inventario.
    Los materiales con externo=True se omiten (nunca tocan el stock interno).
    """
    materiales_planeados = (
        db.query(ProyectoMaterial)
        .filter(
            ProyectoMaterial.proyecto_id == proyecto.id_proyecto,
            ProyectoMaterial.externo == False,  # noqa: E712
        )
        .all()
    )

    for pm in materiales_planeados:
        material = db.query(Material).filter(Material.id_material == pm.material_id).first()
        if not material:
            continue

        cantidad_a_descontar = min(int(pm.cantidad_planeada), material.stock_actual)
        if cantidad_a_descontar > 0:
            mov = Movimiento(
                id_movimiento=uuid.uuid4().hex,
                cantidad=cantidad_a_descontar,
                fecha_salida=datetime.utcnow(),
                proyecto_id=proyecto.id_proyecto,
                material_id=material.id_material,
                usuario_id=usuario_id,
            )
            db.add(mov)
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
        .outerjoin(Material, ProyectoMaterial.material_id == Material.id_material)
        .filter(ProyectoMaterial.proyecto_id == proyecto_id)
        .all()
    )

    resultado = []
    for pm, mat in vinculaciones:
        resultado.append(_material_dict(pm, mat))

    return resultado


# ═══════════════════════════════════════════════════════════════════════════════
# GESTIÓN DE MATERIALES EN UN PROYECTO EXISTENTE
# ═══════════════════════════════════════════════════════════════════════════════

def _material_dict(pm: ProyectoMaterial, mat) -> dict:
    """Convierte un ProyectoMaterial + Material (puede ser None) a dict estandarizado."""
    if mat is not None:
        return {
            "id_pm": pm.id_pm,
            "material_id": mat.id_material,
            "nombre_material": mat.nombre_material,
            "cantidad_planeada": pm.cantidad_planeada,
            "stock_actual": mat.stock_actual,
            "precio_unitario": mat.precio_unitario,
            "suficiente_stock": mat.stock_actual >= pm.cantidad_planeada,
            "externo": bool(pm.externo),
            "es_externo_nuevo": False,
        }
    # Material externo nuevo (sin entrada en el inventario)
    return {
        "id_pm": pm.id_pm,
        "material_id": None,
        "nombre_material": pm.nombre_material_externo or "Material externo",
        "cantidad_planeada": pm.cantidad_planeada,
        "stock_actual": None,
        "precio_unitario": pm.precio_unitario_externo,
        "suficiente_stock": True,
        "externo": True,
        "es_externo_nuevo": True,
    }


def agregar_material_a_proyecto(
    db: Session,
    proyecto_id: str,
    cantidad: "Decimal",
    usuario_id: str,
    externo: bool = False,
    material_id: str = None,
    nombre_externo: str = None,
    precio_externo: "Decimal" = None,
) -> dict:
    proyecto = obtener_proyecto(db, proyecto_id)

    if proyecto.estado in ("finalizado", "cancelado"):
        raise HTTPException(400, "No se pueden agregar materiales a un proyecto finalizado o cancelado")

    es_externo_nuevo = (material_id is None)

    if not es_externo_nuevo:
        # Material del inventario — verificar duplicado y existencia
        pm_existe = (
            db.query(ProyectoMaterial)
            .filter(ProyectoMaterial.proyecto_id == proyecto_id, ProyectoMaterial.material_id == material_id)
            .first()
        )
        if pm_existe:
            raise HTTPException(409, "El material ya está asignado a este proyecto")

        material = db.query(Material).filter(Material.id_material == material_id).first()
        if not material:
            raise HTTPException(404, "Material no encontrado")

        cantidad_int = int(cantidad)

        # Si en_curso y no externo → descontar stock inmediatamente
        if proyecto.estado == "en_curso" and not externo:
            if material.stock_actual < cantidad_int:
                raise HTTPException(
                    422,
                    f"Stock insuficiente. Disponible: {material.stock_actual}, necesario: {cantidad_int}",
                )
            material.stock_actual -= cantidad_int
            db.add(Movimiento(
                id_movimiento=uuid.uuid4().hex,
                cantidad=cantidad_int,
                fecha_salida=datetime.utcnow(),
                proyecto_id=proyecto_id,
                material_id=material_id,
                usuario_id=usuario_id,
            ))

        pm = ProyectoMaterial(
            proyecto_id=proyecto_id,
            material_id=material_id,
            cantidad_planeada=cantidad,
            externo=externo,
        )
        db.add(pm)
        db.commit()
        db.refresh(pm)
        db.refresh(material)
        return _material_dict(pm, material)

    else:
        # Material externo nuevo — nunca toca stock
        pm = ProyectoMaterial(
            proyecto_id=proyecto_id,
            material_id=None,
            cantidad_planeada=cantidad,
            externo=True,
            nombre_material_externo=(nombre_externo or "").strip(),
            precio_unitario_externo=precio_externo,
        )
        db.add(pm)
        db.commit()
        db.refresh(pm)
        return _material_dict(pm, None)


def actualizar_cantidad_material(
    db: Session,
    proyecto_id: str,
    id_pm: str,
    nueva_cantidad: "Decimal",
    ajustar_stock: bool,
    usuario_id: str,
) -> dict:
    proyecto = obtener_proyecto(db, proyecto_id)

    if proyecto.estado in ("finalizado", "cancelado"):
        raise HTTPException(400, "No se puede modificar materiales en un proyecto finalizado o cancelado")

    pm = (
        db.query(ProyectoMaterial)
        .filter(ProyectoMaterial.proyecto_id == proyecto_id, ProyectoMaterial.id_pm == id_pm)
        .first()
    )
    if not pm:
        raise HTTPException(404, "Entrada de material no encontrada")

    material = None
    if pm.material_id:
        material = db.query(Material).filter(Material.id_material == pm.material_id).first()

    diff = int(nueva_cantidad) - int(pm.cantidad_planeada)

    if ajustar_stock and diff != 0 and material and not pm.externo and proyecto.estado == "en_curso":
        if diff > 0:
            if material.stock_actual < diff:
                raise HTTPException(
                    422,
                    f"Stock insuficiente. Disponible: {material.stock_actual}, necesario: {diff}",
                )
            material.stock_actual -= diff
            mov = (
                db.query(Movimiento)
                .filter(Movimiento.proyecto_id == proyecto_id, Movimiento.material_id == pm.material_id)
                .first()
            )
            if mov:
                mov.cantidad += diff
            else:
                db.add(Movimiento(
                    id_movimiento=uuid.uuid4().hex,
                    cantidad=diff,
                    fecha_salida=datetime.utcnow(),
                    proyecto_id=proyecto_id,
                    material_id=pm.material_id,
                    usuario_id=usuario_id,
                ))
        else:
            devolver = abs(diff)
            material.stock_actual += devolver
            mov = (
                db.query(Movimiento)
                .filter(Movimiento.proyecto_id == proyecto_id, Movimiento.material_id == pm.material_id)
                .first()
            )
            if mov:
                if mov.cantidad <= devolver:
                    db.delete(mov)
                else:
                    mov.cantidad -= devolver

    pm.cantidad_planeada = nueva_cantidad
    db.commit()
    db.refresh(pm)
    if material:
        db.refresh(material)
    return _material_dict(pm, material)


def quitar_material_de_proyecto(
    db: Session,
    proyecto_id: str,
    id_pm: str,
    devolver_stock: bool,
    usuario_id: str,
) -> dict:
    proyecto = obtener_proyecto(db, proyecto_id)

    if proyecto.estado in ("finalizado", "cancelado"):
        raise HTTPException(400, "No se pueden eliminar materiales de un proyecto finalizado o cancelado")

    pm = (
        db.query(ProyectoMaterial)
        .filter(ProyectoMaterial.proyecto_id == proyecto_id, ProyectoMaterial.id_pm == id_pm)
        .first()
    )
    if not pm:
        raise HTTPException(404, "Entrada de material no encontrada")

    # Devolver stock si corresponde (en_curso, no externo, con material del inventario)
    if devolver_stock and not pm.externo and pm.material_id and proyecto.estado == "en_curso":
        material = db.query(Material).filter(Material.id_material == pm.material_id).first()
        if material:
            movimientos = (
                db.query(Movimiento)
                .filter(Movimiento.proyecto_id == proyecto_id, Movimiento.material_id == pm.material_id)
                .all()
            )
            total = sum(m.cantidad for m in movimientos)
            if total > 0:
                material.stock_actual += total
            for mov in movimientos:
                db.delete(mov)

    db.delete(pm)
    db.commit()
    return {"mensaje": "Material eliminado del proyecto"}