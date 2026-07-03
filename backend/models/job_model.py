from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class JobResponse(BaseModel):
    id: str
    external_id: str
    title: str
    company: str
    location: Optional[str] = None
    job_type: Optional[str] = None
    description: Optional[str] = None
    apply_url: Optional[str] = None
    salary: Optional[str] = None
    posted_at: Optional[str] = None
    fetched_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class JobSearchResponse(BaseModel):
    jobs: list[JobResponse]
    total: int
    page: int
    cached: bool = False


class SavedJobResponse(BaseModel):
    id: str
    job: JobResponse
    saved_at: datetime

    class Config:
        from_attributes = True


class AppliedJobResponse(BaseModel):
    id: str
    job: JobResponse
    applied_at: datetime

    class Config:
        from_attributes = True
