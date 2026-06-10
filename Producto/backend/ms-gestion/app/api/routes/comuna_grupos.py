from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.comuna_grupo import ComunaGrupo
from app.schemas.comuna_grupo import ComunaGrupoOut
from app.utils.auth import get_current_user


router = APIRouter(prefix="/comuna-grupos", tags=["Comuna Grupos"])


@router.get("/", response_model=List[ComunaGrupoOut])
def listar_grupos(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Devuelve todos los grupos de comunas por distancia desde La Calera."""
    return db.query(ComunaGrupo).order_by(ComunaGrupo.rango_km_min).all()


@router.get("/{grupo_id}", response_model=ComunaGrupoOut)
def obtener_grupo(
    grupo_id: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Devuelve el detalle de un grupo de comunas por su id_cg."""
    grupo = db.query(ComunaGrupo).filter(ComunaGrupo.id_cg == grupo_id).first()
    if not grupo:
        raise HTTPException(status_code=404, detail="Grupo de comunas no encontrado")
    return grupo
