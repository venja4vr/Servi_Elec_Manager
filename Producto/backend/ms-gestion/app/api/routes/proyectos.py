from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.controllers import proyecto_controller
from app.schemas.proyecto import (
    ProyectoCreate,
    ProyectoUpdate,
    ProyectoOut,
    ProyectoAlertaOut,
    ProyectoCreateConMateriales,
    ProyectoCostosUpdate,
    ProyectoCostosOut,
)
from app.schemas.proyecto_material import AgregarMaterialProyecto, ActualizarMaterialProyecto
from app.utils.auth import get_current_user, require_admin
from app.services.pdf_service import generar_pdf_proyecto, generar_pdf_cliente
from app.services import costo_service
from app.models.proyecto import Proyecto


router = APIRouter(prefix="/proyectos", tags=["Proyectos"])


@router.get("/", response_model=List[ProyectoOut])
def listar(
    estado: Optional[str] = Query(None, description="pendiente | en_curso | finalizado | cancelado"),
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    return proyecto_controller.get_all(db, estado)


@router.get("/alertas", response_model=List[ProyectoAlertaOut])
def alertas_fecha(
    dias: int = Query(3, ge=1, le=30, description="Ventana en días para alertas"),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Proyectos con alertas de fecha: pendientes próximos a iniciar, en_curso próximos a vencer, y atrasados."""
    from app.services.proyecto_service import listar_alertas_fecha
    return listar_alertas_fecha(db, dias)


@router.get("/{proyecto_id}", response_model=ProyectoOut)
def obtener(proyecto_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return proyecto_controller.get_one(db, proyecto_id)


@router.get("/{proyecto_id}/materiales")
def obtener_materiales_planeados(
    proyecto_id: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    """Devuelve los materiales que el proyecto planea/planeó usar, con info del inventario."""
    return proyecto_controller.get_materiales_planeados(db, proyecto_id)


@router.get("/{proyecto_id}/pdf")
def descargar_pdf_empresa(
    proyecto_id: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """PDF interno (empresa) con todos los campos, costos y margen."""
    pdf_bytes = generar_pdf_proyecto(proyecto_id, db)
    filename = f"proyecto_{proyecto_id[:8].upper()}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{proyecto_id}/pdf-cliente")
def descargar_pdf_cliente(
    proyecto_id: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """PDF externo (cliente) sin precios unitarios ni margen."""
    pdf_bytes = generar_pdf_cliente(proyecto_id, db)
    filename = f"proyecto_cliente_{proyecto_id[:8].upper()}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/{proyecto_id}/materiales", status_code=201)
def agregar_material(
    proyecto_id: str,
    data: AgregarMaterialProyecto,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Agrega material del inventario o un material externo nuevo (sin inventario)."""
    return proyecto_controller.agregar_material(
        db, proyecto_id, data.cantidad, current_user["id_usuario"],
        externo=data.externo,
        material_id=data.material_id,
        nombre_externo=data.nombre_externo,
        precio_externo=data.precio_externo,
    )


@router.put("/{proyecto_id}/materiales/{id_pm}")
def actualizar_cantidad_material(
    proyecto_id: str,
    id_pm: str,
    data: ActualizarMaterialProyecto,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Actualiza la cantidad de un material en el proyecto (identificado por id_pm)."""
    return proyecto_controller.actualizar_cantidad_material(
        db, proyecto_id, id_pm, data.cantidad, data.ajustar_stock, current_user["id_usuario"]
    )


@router.delete("/{proyecto_id}/materiales/{id_pm}")
def quitar_material(
    proyecto_id: str,
    id_pm: str,
    devolver_stock: bool = Query(False, description="Si True, devuelve el stock descontado"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Elimina un material del proyecto (identificado por id_pm)."""
    return proyecto_controller.quitar_material(
        db, proyecto_id, id_pm, devolver_stock, current_user["id_usuario"]
    )


@router.post("/", response_model=ProyectoOut, status_code=201)
def crear(data: ProyectoCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    """Crear proyecto sin materiales (uso básico/legacy)."""
    return proyecto_controller.create(db, data)


@router.post("/con-materiales", response_model=ProyectoOut, status_code=201)
def crear_con_materiales(
    data: ProyectoCreateConMateriales,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    """
    Crea un proyecto con su lista de materiales planeados.
    El proyecto se crea en estado 'pendiente'.
    NO descuenta stock hasta que cambie a 'en_curso'.
    """
    return proyecto_controller.create_con_materiales(db, data)


@router.put("/{proyecto_id}", response_model=ProyectoOut)
def actualizar(
    proyecto_id: str,
    data: ProyectoUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    return proyecto_controller.update(db, proyecto_id, data)


@router.patch("/{proyecto_id}/estado", response_model=ProyectoOut)
def cambiar_estado(
    proyecto_id: str,
    nuevo_estado: str = Query(..., description="pendiente | en_curso | finalizado | cancelado"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Cambia el estado del proyecto.
    - pendiente → en_curso: descuenta stock automáticamente.
    - en_curso → cancelado: devuelve stock al inventario.
    """
    return proyecto_controller.cambiar_estado(
        db,
        proyecto_id,
        nuevo_estado,
        current_user["id_usuario"]
    )


@router.delete("/{proyecto_id}")
def eliminar(proyecto_id: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    return proyecto_controller.delete(db, proyecto_id)


# ── Costos ────────────────────────────────────────────────────────────────────

@router.get("/{proyecto_id}/costos", response_model=ProyectoCostosOut)
def obtener_costos(
    proyecto_id: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Calcula y devuelve el desglose de costos del proyecto (solo lectura)."""
    return costo_service.calcular_costos_proyecto(proyecto_id, db)


@router.put("/{proyecto_id}/costos", response_model=ProyectoCostosOut)
def actualizar_costos(
    proyecto_id: str,
    data: ProyectoCostosUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """
    Actualiza los parámetros de costo del proyecto (solo los campos enviados)
    y devuelve el desglose recalculado.
    """
    proyecto = db.query(Proyecto).filter(Proyecto.id_proyecto == proyecto_id).first()
    if not proyecto:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")

    campos = data.model_dump(exclude_none=True)
    for campo, valor in campos.items():
        setattr(proyecto, campo, valor)

    db.commit()
    db.refresh(proyecto)
    return costo_service.calcular_costos_proyecto(proyecto_id, db)


@router.post("/{proyecto_id}/recalcular-costos", response_model=ProyectoCostosOut)
def recalcular_costos(
    proyecto_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """Fuerza el recálculo del desglose de costos con los valores actuales del proyecto."""
    return costo_service.calcular_costos_proyecto(proyecto_id, db)