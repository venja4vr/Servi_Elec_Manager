import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent.parent / ".env")

APP_NAME = "Microservicio de Chatbot — ServiElec"

# WhatsApp Business API
WHATSAPP_API_URL  = os.getenv("WHATSAPP_API_URL", "https://graph.facebook.com/v25.0")
WHATSAPP_TOKEN    = os.getenv("WHATSAPP_TOKEN", "")
WHATSAPP_PHONE_ID = os.getenv("WHATSAPP_PHONE_ID", "")
VERIFY_TOKEN      = os.getenv("VERIFY_TOKEN", "servielec_verify_2026")

# ms-gestion
MS_GESTION_URL   = os.getenv("MS_GESTION_URL", "http://localhost:8000")
MS_GESTION_TOKEN = os.getenv("MS_GESTION_TOKEN", "")

# Sesiones
SESSION_TTL_MINUTES = int(os.getenv("SESSION_TTL_MINUTES", "60"))