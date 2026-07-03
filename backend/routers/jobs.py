from fastapi import APIRouter, Depends, Query
from backend.models.user_model import UserProfile
from backend.models.job_model import JobSearchResponse, JobResponse, SavedJobResponse, AppliedJobResponse
from backend.services.jobs_service import JobsService
from backend.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/jobs", tags=["jobs"])
jobs_service = JobsService()


@router.get("/search", response_model=JobSearchResponse)
async def search_jobs(
    q: str = Query(..., description="Search query"),
    location: str | None = Query(None, description="Location filter"),
    page: int = Query(1, ge=1, description="Page number"),
):
    return await jobs_service.search_jobs(q, location, page)


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    return jobs_service.get_job(job_id)


@router.post("/save/{job_id}", response_model=SavedJobResponse)
async def save_job(
    job_id: str,
    current_user: UserProfile = Depends(get_current_user),
):
    return jobs_service.save_job(current_user.id, job_id)


@router.get("/saved", response_model=list[SavedJobResponse])
async def get_saved_jobs(current_user: UserProfile = Depends(get_current_user)):
    return jobs_service.get_saved_jobs(current_user.id)


@router.delete("/saved/{job_id}")
async def remove_saved_job(
    job_id: str,
    current_user: UserProfile = Depends(get_current_user),
):
    jobs_service.remove_saved_job(current_user.id, job_id)
    return {"message": "Job removed from saved"}


@router.post("/apply/{job_id}", response_model=AppliedJobResponse)
async def apply_job(
    job_id: str,
    current_user: UserProfile = Depends(get_current_user),
):
    return jobs_service.apply_job(current_user.id, job_id)


@router.get("/applied", response_model=list[AppliedJobResponse])
async def get_applied_jobs(current_user: UserProfile = Depends(get_current_user)):
    return jobs_service.get_applied_jobs(current_user.id)
