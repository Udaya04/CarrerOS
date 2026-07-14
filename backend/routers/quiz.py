from fastapi import APIRouter, Depends
from backend.models.user_model import UserProfile
from backend.models.quiz_model import (
    QuizGenerateRequest,
    QuizGenerateResponse,
    QuizSubmitRequest,
    QuizResultResponse,
    AttemptSummary,
    QuizStatsResponse,
    BookmarkAddRequest,
    BookmarkResponse,
)
from backend.services.quiz_service import QuizService
from backend.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/quiz", tags=["quiz"])
quiz_service = QuizService()


@router.post("/generate", response_model=QuizGenerateResponse)
async def generate_quiz(
    body: QuizGenerateRequest,
    current_user: UserProfile = Depends(get_current_user),
):
    return quiz_service.generate_questions(
        current_user.id, body.topics, body.difficulty, body.total_questions
    )


@router.post("/submit", response_model=QuizResultResponse)
async def submit_quiz(
    body: QuizSubmitRequest,
    current_user: UserProfile = Depends(get_current_user),
):
    return quiz_service.submit_attempt(current_user.id, body.attempt_id, body.answers)


@router.get("/attempts", response_model=list[AttemptSummary])
async def list_attempts(current_user: UserProfile = Depends(get_current_user)):
    return quiz_service.get_user_attempts(current_user.id)


@router.get("/attempts/{attempt_id}", response_model=QuizResultResponse)
async def get_attempt(
    attempt_id: str,
    current_user: UserProfile = Depends(get_current_user),
):
    return quiz_service.get_attempt_detail(current_user.id, attempt_id)


@router.get("/stats", response_model=QuizStatsResponse)
async def get_stats(current_user: UserProfile = Depends(get_current_user)):
    return quiz_service.get_skill_stats(current_user.id)


@router.post("/bookmarks", response_model=BookmarkResponse)
async def add_bookmark(
    body: BookmarkAddRequest,
    current_user: UserProfile = Depends(get_current_user),
):
    return quiz_service.add_bookmark(current_user.id, body.attempt_id, body.question_index, body.note)


@router.delete("/bookmarks/{attempt_id}/{question_index}")
async def remove_bookmark(
    attempt_id: str,
    question_index: int,
    current_user: UserProfile = Depends(get_current_user),
):
    quiz_service.remove_bookmark(current_user.id, attempt_id, question_index)
    return {"ok": True}


@router.get("/bookmarks", response_model=list[BookmarkResponse])
async def list_bookmarks(current_user: UserProfile = Depends(get_current_user)):
    return quiz_service.get_user_bookmarks(current_user.id)
