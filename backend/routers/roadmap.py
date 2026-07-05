from fastapi import APIRouter, Depends
from backend.models.roadmap_model import (
    RoadmapGenerateRequest,
    RoadmapResponse,
    RoadmapSummary
)
from backend.services.roadmap_service import RoadmapService
from backend.middleware.auth_middleware import get_current_user
from backend.models.user_model import UserProfile

router = APIRouter(prefix="/roadmap", tags=["roadmap"])
roadmap_service = RoadmapService()


@router.post("/generate", response_model=RoadmapResponse)
async def generate_roadmap(
    request: RoadmapGenerateRequest,
    current_user: UserProfile = Depends(get_current_user)
):
    return roadmap_service.generate_roadmap(
        user_id=current_user.id,
        topic=request.topic,
        target_role=request.target_role
    )


@router.get("/history", response_model=list[RoadmapSummary])
async def get_history(
    current_user: UserProfile = Depends(get_current_user)
):
    return roadmap_service.get_user_roadmaps(current_user.id)


@router.get("/{roadmap_id}", response_model=RoadmapResponse)
async def get_roadmap(
    roadmap_id: str,
    current_user: UserProfile = Depends(get_current_user)
):
    return roadmap_service.get_roadmap(
        roadmap_id, current_user.id)


@router.delete("/{roadmap_id}")
async def delete_roadmap(
    roadmap_id: str,
    current_user: UserProfile = Depends(get_current_user)
):
    roadmap_service.delete_roadmap(
        roadmap_id, current_user.id)
    return {"message": "Roadmap deleted"}
