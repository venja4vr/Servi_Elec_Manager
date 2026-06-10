from decimal import Decimal
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.proyecto import Proyecto
from app.models.proyecto_material import ProyectoMaterial
from app.models.comuna_grupo import ComunaGrupo


def calcular_costos_proyecto(proyecto_id: str, db: Session) -> dict:
    """
    Calcula el costo real de un proyecto: materiales + bencina + mano de obra + ganancia.

    Lógica de precio por material:
    - Externo: usa precio_unitario_externo.
    - Inventario: usa precio_sodimac_actual si existe, sino precio_unitario.
    Si un material no tiene precio, se omite del subtotal y se registra en
    materiales_sin_precio para que el front/bot lo informe al usuario.

    Costo bencina (solo si el proyecto tiene comuna_grupo_id asignado):
      km_promedio × 2 (ida y vuelta) × precio_por_km × dias_estimados

    Devuelve un dict compatible con ProyectoCostosOut.
    """
    proyecto = db.query(Proyecto).filter(Proyecto.id_proyecto == proyecto_id).first()
    if not proyecto:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")

    # ── 1. Subtotal materiales ────────────────────────────────────────────────
    materiales_planeados = (
        db.query(ProyectoMaterial)
        .filter(ProyectoMaterial.proyecto_id == proyecto_id)
        .all()
    )

    subtotal_materiales = Decimal("0")
    materiales_sin_precio: list[str] = []

    for pm in materiales_planeados:
        cantidad = Decimal(str(pm.cantidad_planeada))

        if pm.externo:
            if pm.precio_unitario_externo and pm.precio_unitario_externo > 0:
                subtotal_materiales += Decimal(str(pm.precio_unitario_externo)) * cantidad
            else:
                nombre = pm.nombre_material_externo or "Material externo sin nombre"
                materiales_sin_precio.append(nombre)
        else:
            mat = pm.material
            if mat:
                # Preferir precio Sodimac actualizado sobre precio_unitario base
                precio = mat.precio_sodimac_actual or mat.precio_unitario
                if precio and precio > 0:
                    subtotal_materiales += Decimal(str(precio)) * cantidad
                else:
                    materiales_sin_precio.append(mat.nombre_material)
            else:
                materiales_sin_precio.append(f"Material ID {pm.material_id}")

    # ── 2. Costo bencina ──────────────────────────────────────────────────────
    costo_bencina = Decimal("0")
    km_distancia: float = 0.0

    if proyecto.comuna_grupo_id:
        grupo = (
            db.query(ComunaGrupo)
            .filter(ComunaGrupo.id_cg == proyecto.comuna_grupo_id)
            .first()
        )
        if grupo:
            km_distancia = (grupo.rango_km_min + grupo.rango_km_max) / 2
            dias = proyecto.dias_estimados or 1
            costo_bencina = (
                Decimal(str(km_distancia))
                * Decimal("2")
                * Decimal(str(grupo.precio_por_km))
                * Decimal(str(dias))
            )

    # ── 3. Costo mano de obra ─────────────────────────────────────────────────
    precio_dia = Decimal(str(proyecto.precio_dia_trabajador or 60000))
    trabajadores = proyecto.cantidad_trabajadores or 1
    dias_est = proyecto.dias_estimados or 1
    costo_mano_obra = precio_dia * Decimal(str(trabajadores)) * Decimal(str(dias_est))

    # ── 4. Totales ────────────────────────────────────────────────────────────
    subtotal_sin_ganancia = subtotal_materiales + costo_bencina + costo_mano_obra
    porcentaje = Decimal(str(proyecto.porcentaje_ganancia or 15))
    monto_ganancia = subtotal_sin_ganancia * (porcentaje / Decimal("100"))
    total_final = subtotal_sin_ganancia + monto_ganancia

    return {
        "proyecto_id": proyecto_id,
        "subtotal_materiales": subtotal_materiales,
        "costo_bencina": costo_bencina,
        "costo_mano_obra": costo_mano_obra,
        "subtotal_sin_ganancia": subtotal_sin_ganancia,
        "monto_ganancia": monto_ganancia,
        "total_final": total_final,
        "materiales_sin_precio": materiales_sin_precio,
        "detalles": {
            "km_distancia": km_distancia,
            "dias_estimados": dias_est,
            "cantidad_trabajadores": trabajadores,
            "precio_dia_trabajador": float(precio_dia),
            "porcentaje_ganancia": float(porcentaje),
            "comuna_grupo_id": proyecto.comuna_grupo_id,
        },
    }


def obtener_costo_bencina_estimado(
    comuna_grupo_id: str,
    dias_estimados: int = 5,
    db: Session = None,
) -> dict:
    """
    Estima el costo de bencina para un grupo-comuna sin necesitar un proyecto creado.
    Útil para el bot al mostrar presupuesto antes de registrar la solicitud.
    """
    grupo = db.query(ComunaGrupo).filter(ComunaGrupo.id_cg == comuna_grupo_id).first()
    if not grupo:
        raise HTTPException(status_code=404, detail="Grupo de comuna no encontrado")

    km_distancia = (grupo.rango_km_min + grupo.rango_km_max) / 2
    costo_bencina = (
        Decimal(str(km_distancia))
        * Decimal("2")
        * Decimal(str(grupo.precio_por_km))
        * Decimal(str(dias_estimados))
    )

    return {
        "comuna_grupo_id": comuna_grupo_id,
        "nombre_grupo": grupo.nombre,
        "km_distancia_promedio": km_distancia,
        "dias_estimados": dias_estimados,
        "precio_por_km": grupo.precio_por_km,
        "costo_bencina_estimado": costo_bencina,
    }
