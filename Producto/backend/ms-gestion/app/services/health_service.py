def root_service():
    return {"message": "Microservicio de Gestión funcionando"}

def health_service():
    return {"status": "ok"}