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
    if hub_mode == "subscribe" and hub_verify_token == VERIFY_TOKEN:
        return int(hub_challenge)
    raise HTTPException(status_code=403, detail="Token de verificación inválido")


@router.post("/")
async def recibir_mensaje(request: Request):
    try:
        raw     = await request.json()
        payload = WAWebhookPayload(**raw)
        return manejar_webhook(payload)
    except Exception as e:
        print(f"[WEBHOOK ERROR] {e}")
        return {"status": "error", "detail": str(e)}