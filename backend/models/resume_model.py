from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CategoryScores(BaseModel):
    formatting: float
    keyword_optimization: float
    skills_match: float
    experience_quality: float
    education: float


class ResumeAnalysisResponse(BaseModel):
    id: str
    ats_score: Optional[float] = None
    category_scores: Optional[CategoryScores] = None
    strengths: Optional[list[str]] = None
    weaknesses: Optional[list[str]] = None
    missing_keywords: Optional[list[str]] = None
    feedback: Optional[str] = None
    target_role: str
    original_filename: str
    file_size: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ResumeSummaryResponse(BaseModel):
    id: str
    original_filename: str
    ats_score: Optional[float] = None
    target_role: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
