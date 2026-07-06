from fastapi import APIRouter, Depends
from backend.models.user_model import UserProfile
from backend.models.blog_model import (
    BlogCreateRequest, BlogUpdateRequest, BlogResponse,
    BlogSummary, CommentResponse, CommentCreate
)
from backend.services.blog_service import BlogService
from backend.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/blog", tags=["blog"])
blog_service = BlogService()


@router.get("/", response_model=list[BlogSummary])
async def list_blogs(current_user: UserProfile = Depends(get_current_user)):
    return blog_service.get_blogs(current_user.id)


@router.post("/", response_model=BlogResponse)
async def create_blog(body: BlogCreateRequest, current_user: UserProfile = Depends(get_current_user)):
    return blog_service.create_blog(
        current_user.id, body.title, body.content,
        body.cover_image, body.tags, body.published
    )


@router.get("/{blog_id}", response_model=BlogResponse)
async def get_blog(blog_id: str, current_user: UserProfile = Depends(get_current_user)):
    return blog_service.get_blog(blog_id, current_user.id)


@router.put("/{blog_id}", response_model=BlogResponse)
async def update_blog(blog_id: str, body: BlogUpdateRequest, current_user: UserProfile = Depends(get_current_user)):
    return blog_service.update_blog(blog_id, current_user.id, body)


@router.delete("/{blog_id}")
async def delete_blog(blog_id: str, current_user: UserProfile = Depends(get_current_user)):
    return blog_service.delete_blog(blog_id, current_user.id)


@router.post("/{blog_id}/like")
async def toggle_like(blog_id: str, current_user: UserProfile = Depends(get_current_user)):
    return blog_service.toggle_like(blog_id, current_user.id)


@router.get("/{blog_id}/comments", response_model=list[CommentResponse])
async def get_comments(blog_id: str, current_user: UserProfile = Depends(get_current_user)):
    return blog_service.get_comments(blog_id)


@router.post("/{blog_id}/comments", response_model=CommentResponse)
async def add_comment(blog_id: str, body: CommentCreate, current_user: UserProfile = Depends(get_current_user)):
    return blog_service.add_comment(blog_id, current_user.id, body.content)


@router.delete("/comments/{comment_id}")
async def delete_comment(comment_id: str, current_user: UserProfile = Depends(get_current_user)):
    return blog_service.delete_comment(comment_id, current_user.id)
