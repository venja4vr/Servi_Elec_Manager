import os
from dotenv import load_dotenv

load_dotenv()

APP_NAME = "Microservicio de Gestion"
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:Benja2026@localhost:5432/servielec_db")
WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN", "")
WHATSAPP_PHONE_ID = os.getenv("WHATSAPP_PHONE_ID", "")
