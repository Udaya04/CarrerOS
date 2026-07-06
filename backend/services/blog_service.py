import os
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client
from backend.models.blog_model import (
    BlogCreateRequest, BlogUpdateRequest,
    BlogResponse, BlogSummary, CommentResponse
)

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dotenv_path = os.path.join(base_dir, ".env")
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)
else:
    load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")


class BlogException(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class BlogService:
    def __init__(self):
        self._supabase = None

    @property
    def supabase(self) -> Client:
        if self._supabase is None:
            if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
                raise BlogException("Supabase credentials not configured", 500)
            self._supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        return self._supabase

    def _get_author_name(self, author_id: str) -> str:
        user_resp = self.supabase.table("users").select("full_name").eq("id", author_id).execute()
        if user_resp.data:
            return user_resp.data[0].get("full_name", "Unknown")
        return "Unknown"

    def _get_likes_count(self, blog_id: str) -> int:
        resp = self.supabase.table("blog_likes").select("id", count="exact").eq("blog_id", blog_id).execute()
        return resp.count if hasattr(resp, 'count') else len(resp.data) if resp.data else 0

    def _get_comments_count(self, blog_id: str) -> int:
        resp = self.supabase.table("blog_comments").select("id", count="exact").eq("blog_id", blog_id).execute()
        return resp.count if hasattr(resp, 'count') else len(resp.data) if resp.data else 0

    def _is_liked(self, blog_id: str, user_id: str) -> bool:
        if not user_id:
            return False
        resp = self.supabase.table("blog_likes").select("id").eq("blog_id", blog_id).eq("user_id", user_id).execute()
        return len(resp.data) > 0

    def create_blog(self, user_id: str, title: str, content: str,
                    cover_image: str = None, tags: list[str] = None,
                    published: bool = True) -> BlogResponse:
        if tags is None:
            tags = []
        data = {
            "title": title,
            "content": content,
            "cover_image": cover_image,
            "tags": tags,
            "published": published,
            "author_id": user_id,
        }
        resp = self.supabase.table("blogs").insert(data).execute()
        if not resp.data:
            raise BlogException("Failed to create blog", 500)
        blog = resp.data[0]
        author_name = self._get_author_name(user_id)
        return BlogResponse(
            id=blog["id"],
            title=blog["title"],
            content=blog["content"],
            cover_image=blog.get("cover_image"),
            tags=blog.get("tags") or [],
            published=blog["published"],
            author_id=user_id,
            author_name=author_name,
            likes_count=0,
            comments_count=0,
            is_liked=False,
            created_at=blog.get("created_at"),
            updated_at=blog.get("updated_at"),
        )

    def get_blogs(self, user_id: str = None) -> list[BlogSummary]:
        resp = self.supabase.table("blogs").select("*").eq("published", True).order("created_at", desc=True).execute()
        blogs = resp.data or []
        summaries = []
        for blog in blogs:
            author_name = self._get_author_name(blog["author_id"])
            likes_count = self._get_likes_count(blog["id"])
            comments_count = self._get_comments_count(blog["id"])
            is_liked = self._is_liked(blog["id"], user_id) if user_id else False
            summaries.append(BlogSummary(
                id=blog["id"],
                title=blog["title"],
                cover_image=blog.get("cover_image"),
                tags=blog.get("tags") or [],
                published=blog["published"],
                author_name=author_name,
                likes_count=likes_count,
                comments_count=comments_count,
                is_liked=is_liked,
                created_at=blog.get("created_at"),
            ))
        return summaries

    def get_blog(self, blog_id: str, user_id: str = None) -> BlogResponse:
        resp = self.supabase.table("blogs").select("*").eq("id", blog_id).execute()
        if not resp.data:
            raise BlogException("Blog not found", 404)
        blog = resp.data[0]
        author_name = self._get_author_name(blog["author_id"])
        likes_count = self._get_likes_count(blog["id"])
        comments_count = self._get_comments_count(blog["id"])
        is_liked = self._is_liked(blog["id"], user_id) if user_id else False

        comments_resp = self.supabase.table("blog_comments").select("*").eq("blog_id", blog_id).order("created_at", desc=True).execute()
        comments = []
        for c in comments_resp.data or []:
            c_author = self._get_author_name(c["user_id"])
            comments.append(CommentResponse(
                id=c["id"],
                blog_id=c["blog_id"],
                user_id=c["user_id"],
                content=c["content"],
                author_name=c_author,
                created_at=c.get("created_at"),
            ))

        return BlogResponse(
            id=blog["id"],
            title=blog["title"],
            content=blog["content"],
            cover_image=blog.get("cover_image"),
            tags=blog.get("tags") or [],
            published=blog["published"],
            author_id=blog["author_id"],
            author_name=author_name,
            likes_count=likes_count,
            comments_count=comments_count,
            is_liked=is_liked,
            created_at=blog.get("created_at"),
            updated_at=blog.get("updated_at"),
            comments=comments,
        )

    def update_blog(self, blog_id: str, user_id: str, data: BlogUpdateRequest) -> BlogResponse:
        blog_resp = self.supabase.table("blogs").select("author_id").eq("id", blog_id).execute()
        if not blog_resp.data:
            raise BlogException("Blog not found", 404)
        if blog_resp.data[0]["author_id"] != user_id:
            raise BlogException("Unauthorized", 403)
        update_data = {k: v for k, v in data.model_dump(exclude_none=True).items()}
        if not update_data:
            raise BlogException("No fields to update", 400)
        update_data["updated_at"] = datetime.utcnow().isoformat()
        resp = self.supabase.table("blogs").update(update_data).eq("id", blog_id).execute()
        if not resp.data:
            raise BlogException("Blog not found", 404)
        return self.get_blog(blog_id, user_id)

    def delete_blog(self, blog_id: str, user_id: str):
        blog_resp = self.supabase.table("blogs").select("author_id").eq("id", blog_id).execute()
        if not blog_resp.data:
            raise BlogException("Blog not found", 404)
        if blog_resp.data[0]["author_id"] != user_id:
            raise BlogException("Unauthorized", 403)
        self.supabase.table("blogs").delete().eq("id", blog_id).execute()
        return {"message": "Blog deleted"}

    def toggle_like(self, blog_id: str, user_id: str) -> dict:
        resp = self.supabase.table("blogs").select("id").eq("id", blog_id).execute()
        if not resp.data:
            raise BlogException("Blog not found", 404)
        existing = self.supabase.table("blog_likes").select("id").eq("blog_id", blog_id).eq("user_id", user_id).execute()
        if existing.data:
            self.supabase.table("blog_likes").delete().eq("blog_id", blog_id).eq("user_id", user_id).execute()
            liked = False
        else:
            self.supabase.table("blog_likes").insert({"blog_id": blog_id, "user_id": user_id}).execute()
            liked = True
        likes_count = self._get_likes_count(blog_id)
        return {"liked": liked, "likes_count": likes_count}

    def get_comments(self, blog_id: str) -> list[CommentResponse]:
        resp = self.supabase.table("blog_comments").select("*").eq("blog_id", blog_id).order("created_at", desc=True).execute()
        comments = []
        for c in resp.data or []:
            author_name = self._get_author_name(c["user_id"])
            comments.append(CommentResponse(
                id=c["id"],
                blog_id=c["blog_id"],
                user_id=c["user_id"],
                content=c["content"],
                author_name=author_name,
                created_at=c.get("created_at"),
            ))
        return comments

    def add_comment(self, blog_id: str, user_id: str, content: str) -> CommentResponse:
        blog_resp = self.supabase.table("blogs").select("id").eq("id", blog_id).execute()
        if not blog_resp.data:
            raise BlogException("Blog not found", 404)
        data = {
            "blog_id": blog_id,
            "user_id": user_id,
            "content": content,
        }
        resp = self.supabase.table("blog_comments").insert(data).execute()
        if not resp.data:
            raise BlogException("Failed to add comment", 500)
        c = resp.data[0]
        author_name = self._get_author_name(user_id)
        return CommentResponse(
            id=c["id"],
            blog_id=c["blog_id"],
            user_id=c["user_id"],
            content=c["content"],
            author_name=author_name,
            created_at=c.get("created_at"),
        )

    def delete_comment(self, comment_id: str, user_id: str):
        resp = self.supabase.table("blog_comments").select("user_id").eq("id", comment_id).execute()
        if not resp.data:
            raise BlogException("Comment not found", 404)
        if resp.data[0]["user_id"] != user_id:
            raise BlogException("Unauthorized to delete this comment", 403)
        self.supabase.table("blog_comments").delete().eq("id", comment_id).execute()
        return {"message": "Comment deleted"}
