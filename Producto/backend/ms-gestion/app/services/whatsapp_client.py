import httpx
import os


def enviar_mensaje(telefono: str, texto: str) -> bool:
    token    = os.getenv("WHATSAPP_TOKEN", "")
    phone_id = os.getenv("WHATSAPP_PHONE_ID", "")
    api_url  = os.getenv("WHATSAPP_API_URL", "https://graph.facebook.com/v25.0")

    url = f"{api_url}/{phone_id}/messages"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": telefono,
        "type": "text",
        "text": {"body": texto},
    }
    try:
        r = httpx.post(url, json=payload, headers=headers, timeout=30)
        print(f"[WA-GESTION] status={r.status_code} body={r.text[:200]}")
        return r.status_code == 200
    except Exception as e:
        print(f"[WA-GESTION ERROR] {e}")
        return False