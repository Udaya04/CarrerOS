from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime

PREDEFINED_TOPICS = ["OS", "DBMS", "CN", "OOP"]
PREDEFINED_TOPICS_SET = set(PREDEFINED_TOPICS)
VALID_DIFFICULTIES = ["easy", "medium", "hard"]
VALID_QUESTION_COUNTS = [10, 15, 20]
TIME_LIMIT_MAP = {10: 15, 15: 20, 20: 30}


class QuizGenerateRequest(BaseModel):
    topics: list[str]
    difficulty: str
    total_questions: int

    @field_validator("topics")
    @classmethod
    def validate_topics(cls, v):
        if not v:
            raise ValueError("At least one topic must be selected")
        invalid = set(v) - PREDEFINED_TOPICS_SET
        if invalid:
            raise ValueError(
                f"Invalid topics: {', '.join(sorted(invalid))}. "
                f"Allowed: {', '.join(sorted(PREDEFINED_TOPICS))}"
            )
        if len(v) != len(set(v)):
            raise ValueError("Duplicate topics are not allowed")
        return v

    @field_validator("difficulty")
    @classmethod
    def validate_difficulty(cls, v):
        if v not in VALID_DIFFICULTIES:
            raise ValueError(f"Difficulty must be one of: {', '.join(VALID_DIFFICULTIES)}")
        return v

    @field_validator("total_questions")
    @classmethod
    def validate_count(cls, v):
        if v not in VALID_QUESTION_COUNTS:
            raise ValueError(f"Total questions must be one of: {VALID_QUESTION_COUNTS}")
        return v


class QuestionResponse(BaseModel):
    question: str
    options: list[str]
    topic: str
    difficulty: str


class QuizGenerateResponse(BaseModel):
    attempt_id: str
    time_limit_minutes: int
    questions: list[QuestionResponse]


class QuizSubmitRequest(BaseModel):
    attempt_id: str
    answers: list[int]


class TopicScore(BaseModel):
    correct: int
    total: int
    percentage: float


class QuestionResult(BaseModel):
    question: str
    options: list[str]
    correct_option: int
    selected_option: int
    is_correct: bool
    explanation: str
    topic: str
    difficulty: str


class QuizResultResponse(BaseModel):
    attempt_id: str
    total_questions: int
    correct_answers: int
    score_percentage: float
    topic_scores: dict[str, TopicScore]
    skill_scores_updated: dict[str, int]
    questions: list[QuestionResult]
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AttemptSummary(BaseModel):
    id: str
    topics: list[str]
    difficulty: str
    total_questions: int
    correct_answers: int
    score_percentage: float
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class QuizStatsResponse(BaseModel):
    skill_scores: dict[str, int]


class BookmarkAddRequest(BaseModel):
    attempt_id: str
    question_index: int
    note: Optional[str] = None


class BookmarkResponse(BaseModel):
    id: str
    attempt_id: str
    question_index: int
    note: Optional[str] = None
    created_at: Optional[datetime] = None
    question_text: str = ""
    topic: str = ""
    difficulty: str = ""

    class Config:
        from_attributes = True
