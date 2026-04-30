import os
from dotenv import load_dotenv

load_dotenv()

APP_NAME = "Microservicio de Gestión"

# Temporal: SQLite local para desarrollo sin PostgreSQL
# Cuando tengamos PostgreSQL listo, cambia por:
# DATABASE_URL = "postgresql://usuario:password@localhost:5432/servielec_db"
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./servielec_test.db")