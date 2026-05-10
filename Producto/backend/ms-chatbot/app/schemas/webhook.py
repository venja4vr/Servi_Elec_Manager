from pydantic import BaseModel
from typing import Optional, List, Any


# Meta envía un JSON muy anidado cuando llega un mensaje
# Este archivo lo parsea y extrae solo lo que necesitamos

class WATexto(BaseModel):
    body: str # El texto que escribió el cliente


class WAMensaje(BaseModel):
    type: str = "" # "text", "image", "audio", etc.
    timestamp: str = "" # Cuándo se envió
    from_numero: str = "" # Número del cliente: "56987906396"
    text: Optional[WATexto] = None

    @classmethod
    def desde_raw(cls, raw: dict) -> "WAMensaje":
        # Parsea un mensaje individual del JSON de Meta
        # "from" es palabra reservada en Python, por eso usamos from_numero
        msg = cls(
            type=raw.get("type", ""),
            timestamp=raw.get("timestamp", ""),
        )
        msg.from_numero = raw.get("from", "")
        if raw.get("type") == "text":
            msg.text = WATexto(body=raw.get("text", {}).get("body", ""))
        return msg


class WAWebhookPayload(BaseModel):
    # El JSON completo que envía Meta al webhook
    object: str = ""
    entry: List[Any] = []

    def get_mensajes(self) -> List[WAMensaje]:
        # Navega la estructura anidada del JSON de Meta
        # entry → changes → value → messages → cada mensaje
        mensajes = []
        for entry in self.entry:
            for change in entry.get("changes", []):
                value = change.get("value", {})
                for raw in value.get("messages", []):
                    msg = WAMensaje.desde_raw(raw)
                    if msg.type == "text": # Solo procesamos texto por ahora
                        mensajes.append(msg)
        return mensajes