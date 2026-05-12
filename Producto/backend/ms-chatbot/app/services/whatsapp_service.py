import httpx
import os


def enviar_mensaje(telefono: str, texto: str) -> bool:
    # Lee las variables en cada llamada (no al importar)
    # Esto es importante para que siempre tenga el token más reciente del .env
    token    = os.getenv("WHATSAPP_TOKEN", "")
    phone_id = os.getenv("WHATSAPP_PHONE_ID", "")
    api_url  = os.getenv("WHATSAPP_API_URL", "https://graph.facebook.com/v25.0")

    # La URL de la API de Meta sigue el formato:
    # https://graph.facebook.com/v25.0/{phone_number_id}/messages
    url = f"{api_url}/{phone_id}/messages"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    # Payload mínimo para enviar un mensaje de texto por WhatsApp
    payload = {
        "messaging_product": "whatsapp",
        "to": telefono, # Número del cliente: "56987906396"
        "type": "text",
        "text": {"body": texto}, # El mensaje que verá el cliente
    }
    try:
        r = httpx.post(url, json=payload, headers=headers, timeout=30)
        # Log para ver qué responde Meta (útil para depurar)
        print(f"[WA] status={r.status_code} body={r.text[:200]}")
        return r.status_code == 200
    except Exception as e:
        print(f"[WA ERROR] {e}")
        return False