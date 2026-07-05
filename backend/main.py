from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from backend.services.auth_service import AuthException
from backend.services.resume_service import ResumeException
from backend.services.quiz_service import QuizException
from backend.services.interview_service import InterviewException
from backend.services.jobs_service import JobException
from backend.services.roadmap_service import RoadmapException
from backend.routers.auth import router as auth_router
from backend.routers.resume import router as resume_router
from backend.routers.quiz import router as quiz_router
from backend.routers.interview import router as interview_router
from backend.routers.jobs import router as jobs_router
from backend.routers.roadmap import router as roadmap_router

app = FastAPI(title="AI Career Platform API")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(AuthException)
async def auth_exception_handler(request: Request, exc: AuthException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.message,
            "status": exc.status_code
        }
    )

@app.exception_handler(ResumeException)
async def resume_exception_handler(request: Request, exc: ResumeException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.message,
            "status": exc.status_code
        }
    )

@app.exception_handler(QuizException)
async def quiz_exception_handler(request: Request, exc: QuizException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.message,
            "status": exc.status_code
        }
    )

@app.exception_handler(InterviewException)
async def interview_exception_handler(request: Request, exc: InterviewException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.message,
            "status": exc.status_code
        }
    )

@app.exception_handler(JobException)
async def job_exception_handler(request: Request, exc: JobException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.message,
            "status": exc.status_code
        }
    )

@app.exception_handler(RoadmapException)
async def roadmap_exception_handler(request: Request, exc: RoadmapException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.message,
            "status": exc.status_code
        }
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.detail,
            "status": exc.status_code
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    messages = []
    for err in errors:
        loc = " -> ".join(str(l) for l in err.get("loc", []))
        messages.append(f"[{loc}]: {err.get('msg')}")
    combined_message = "Validation failed: " + ", ".join(messages)

    return JSONResponse(
        status_code=400,
        content={
            "error": True,
            "message": combined_message,
            "status": 400
        }
    )

app.include_router(auth_router)
app.include_router(resume_router)
app.include_router(quiz_router)
app.include_router(interview_router)
app.include_router(jobs_router)
app.include_router(roadmap_router)

@app.get("/")
async def root():
    return {"message": "Welcome to the AI Career Platform API. Auth at /auth, Resume analysis at /resumes."}
