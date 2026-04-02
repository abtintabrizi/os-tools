from fastapi import APIRouter

from app.routes.map_draft import router as map_draft_router

router = APIRouter()


@router.get("/")
async def root():
    return {"message": "Backend running"}


router.include_router(map_draft_router)
