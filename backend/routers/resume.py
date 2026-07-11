from fastapi import APIRouter, Depends, UploadFile, File, Form
from backend.models.user_model import UserProfile
from backend.models.resume_model import ResumeAnalysisResponse, ResumeSummaryResponse
from backend.services.resume_service import ResumeService, ResumeException
from backend.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/resumes", tags=["resumes"])
resume_service = ResumeService()

MAX_FILE_SIZE = 5 * 1024 * 1024


@router.post("/upload", response_model=ResumeAnalysisResponse)
async def upload_resume(
    file: UploadFile = File(...),
    target_role: str = Form(...),
    current_user: UserProfile = Depends(get_current_user),
):
    target_role = target_role.strip()
    if not target_role:
        raise ResumeException("target_role is required", 400)

    if file.content_type != "application/pdf":
        raise ResumeException("Only PDF files are supported", 400)

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise ResumeException("Only PDF files are supported", 400)

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise ResumeException("File size must be under 5MB", 400)

    extracted_text = resume_service.extract_text(file_bytes)

    score_result = resume_service.score_with_groq(extracted_text, target_role)

    file_path = resume_service.upload_to_storage(current_user.id, file_bytes, file.filename)

    saved = resume_service.save_analysis(
        user_id=current_user.id,
        file_path=file_path,
        filename=file.filename,
        file_size=len(file_bytes),
        target_role=target_role,
        extracted_text=extracted_text,
        score_result=score_result,
    )

    return saved


@router.get("/", response_model=list[ResumeSummaryResponse])
async def list_resumes(current_user: UserProfile = Depends(get_current_user)):
    return resume_service.list_analyses(current_user.id)


@router.get("/{resume_id}", response_model=ResumeAnalysisResponse)
async def get_resume_analysis(
    resume_id: str,
    current_user: UserProfile = Depends(get_current_user),
):
    analysis = resume_service.get_analysis(resume_id)
    if str(analysis.get("user_id")) != current_user.id:
        raise ResumeException("Resume analysis not found", 404)
    return analysis
