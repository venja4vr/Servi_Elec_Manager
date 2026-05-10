from fastapi import APIRouter, Request, HTTPException, Query
from app.core.config import VERIFY_TOKEN
from app.schemas.webhook import WAWebhookPayload
from app.controllers.webhook_controller import manejar_webhook

router = APIRouter(prefix="/webhook", tags=["WhatsApp Webhook"])


@router.get("/")
def verificar_webhook(
    hub_mode:         str = Query("", alias="hub.mode"),
    hub_challenge:    str = Query("", alias="hub.challenge"),
    hub_verify_token: str = Query("", alias="hub.verify_token"),
):
    
    # Meta hace este GET cuando se configura el webhook por primera vez
    # Para verificar que el servidor es nuestro:
    # 1. Revisar que hub.verify_token coincida con el VERIFY_TOKEN
    # 2. Si coincide, devuelve hub.challenge (un número aleatorio de Meta)
    # 3. Meta recibe el número y confirma que el servidor es legítimo
    if hub_mode == "subscribe" and hub_verify_token == VERIFY_TOKEN:
        return int(hub_challenge)
    raise HTTPException(status_code=403, detail="Token de verificación inválido")


@router.post("/")
async def recibir_mensaje(request: Request):
    # Meta hace este POST cada vez que un cliente escribe
    # Siempre devuelve 200 aunque falle internamente
    # Si se devuelve otro código, Meta reintenta el envío múltiples veces
    try:
        raw     = await request.json() # Leer el JSON de Meta
        payload = WAWebhookPayload(**raw) # Parsearlo con Pydantic
        return manejar_webhook(payload) # Procesarlo
    except Exception as e:
        print(f"[WEBHOOK ERROR] {e}")
        return {"status": "error", "detail": str(e)} # 200 igual