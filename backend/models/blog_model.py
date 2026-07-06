from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class BlogCreateRequest(BaseModel):
    title: str
    content: str
    cover_image: Optional[str] = None
    tags: list[str] = []
    published: bool = True


class BlogUpdateRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    cover_image: Optional[str] = None
    tags: Optional[list[str]] = None
    published: Optional[bool] = None


class BlogAuthor(BaseModel):
    id: str
    full_name: str
    avatar_url: Optional[str] = None


class CommentCreate(BaseModel):
    content: str


class CommentResponse(BaseModel):
    id: str
    blog_id: str
    user_id: str
    content: str
    author_name: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BlogResponse(BaseModel):
    id: str
    title: str
    content: str
    cover_image: Optional[str] = None
    tags: list[str] = []
    published: bool = True
    author_id: str
    author_name: str
    likes_count: int = 0
    comments_count: int = 0
    is_liked: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    comments: list[CommentResponse] = []

    class Config:
        from_attributes = True


class BlogSummary(BaseModel):
    id: str
    title: str
    cover_image: Optional[str] = None
    tags: list[str] = []
    published: bool = True
    author_name: str
    likes_count: int = 0
    comments_count: int = 0
    is_liked: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
