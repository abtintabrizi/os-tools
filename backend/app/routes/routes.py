from fastapi import APIRouter

from app.routes.map_draft import router as map_draft_router
from app.routes.striker_draft import router as striker_draft_router

router = APIRouter()


@router.get("/")
async def root():
    return {"message": "Backend running"}


router.include_router(map_draft_router)
router.include_router(striker_draft_router)
