from fastapi import FastAPI
from app.api.router import api_router

app = FastAPI(title="Microservicio de Gestión")

app.include_router(api_router)