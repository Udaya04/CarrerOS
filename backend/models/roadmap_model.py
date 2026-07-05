from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class RoadmapGenerateRequest(BaseModel):
    topic: str
    target_role: Optional[str] = None

    @field_validator("topic")
    @classmethod
    def validate_topic(cls, v):
        if len(v.strip()) < 2:
            raise ValueError("Topic must be at least 2 characters")
        return v.strip()


class RoadmapTopic(BaseModel):
    title: str
    description: str = ""
    duration: str = ""
    resources: list[dict[str, str]] = []


class RoadmapCategory(BaseModel):
    title: str
    description: str = ""
    duration: str = ""
    color: str = "#0D1F0D"
    topics: list[RoadmapTopic] = []


class RoadmapResponse(BaseModel):
    id: str
    topic: str
    target_role: Optional[str] = None
    categories: list[RoadmapCategory] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RoadmapSummary(BaseModel):
    id: str
    topic: str
    target_role: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
