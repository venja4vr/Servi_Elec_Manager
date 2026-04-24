from app.services.health_service import root_service, health_service

def get_root():
    return root_service()

def get_health():
    return health_service()