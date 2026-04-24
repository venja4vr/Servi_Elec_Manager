from fastapi import APIRouter
from app.controllers.health_controller import get_root, get_health

router = APIRouter()

router.add_api_route("/", get_root, methods=["GET"])
router.add_api_route("/health", get_health, methods=["GET"])