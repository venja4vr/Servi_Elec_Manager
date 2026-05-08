from pydantic import BaseModel
from typing import Optional, List, Any


class WATexto(BaseModel):
    body: str


class WAMensaje(BaseModel):
    type: str = ""
    timestamp: str = ""
    from_numero: str = ""
    text: Optional[WATexto] = None

    @classmethod
    def desde_raw(cls, raw: dict) -> "WAMensaje":
        msg = cls(
            type=raw.get("type", ""),
            timestamp=raw.get("timestamp", ""),
        )
        msg.from_numero = raw.get("from", "")
        if raw.get("type") == "text":
            msg.text = WATexto(body=raw.get("text", {}).get("body", ""))
        return msg


class WAWebhookPayload(BaseModel):
    object: str = ""
    entry: List[Any] = []

    def get_mensajes(self) -> List[WAMensaje]:
        mensajes = []
        for entry in self.entry:
            for change in entry.get("changes", []):
                value = change.get("value", {})
                for raw in value.get("messages", []):
                    msg = WAMensaje.desde_raw(raw)
                    if msg.type == "text":
                        mensajes.append(msg)
        return mensajes