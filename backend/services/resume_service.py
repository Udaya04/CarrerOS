import os
import json
import uuid
import re
from dotenv import load_dotenv
from supabase import create_client, Client
from groq import Groq

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dotenv_path = os.path.join(base_dir, ".env")
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)
else:
    load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")


def sanitize_filename(filename: str) -> str:
    filename = os.path.basename(filename)
    filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
    if not filename.lower().endswith('.pdf'):
        filename = filename + '.pdf'
    if len(filename) > 100:
        filename = filename[:96] + '.pdf'
    return filename


class ResumeException(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class ResumeService:
    def __init__(self):
        self._supabase = None
        self._groq = None

    @property
    def supabase(self) -> Client:
        if self._supabase is None:
            if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
                raise ResumeException("Supabase credentials not configured", 500)
            self._supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        return self._supabase

    @property
    def groq(self) -> Groq:
        if self._groq is None:
            if not GROQ_API_KEY:
                raise ResumeException("GROQ_API_KEY not configured", 500)
            self._groq = Groq(api_key=GROQ_API_KEY)
        return self._groq

    def extract_text(self, file_bytes: bytes) -> str:
        import fitz
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text_parts = []
        for page in doc:
            text_parts.append(page.get_text())
        doc.close()
        text = "".join(text_parts).strip()
        if not text:
            raise ResumeException(
                "PDF appears to be a scanned image with no extractable text. Please upload a text-based PDF.",
                400
            )
        return text

    def score_with_groq(self, text: str, target_role: str) -> dict:
        system_prompt = (
            "You are an expert ATS (Applicant Tracking System) resume analyzer. "
            "Analyze the provided resume text against the target role. "
            "Return ONLY valid JSON with no markdown, no explanation, no code blocks."
        )

        user_prompt = f"""Target Role: {target_role}

Resume Text:
{text}

Return JSON in this exact structure:
{{
  "ats_score": <0-100>,
  "category_scores": {{
    "formatting": <0-100>,
    "keyword_optimization": <0-100>,
    "skills_match": <0-100>,
    "experience_quality": <0-100>,
    "education": <0-100>
  }},
  "strengths": ["..."],
  "weaknesses": ["..."],
  "missing_keywords": ["..."],
  "feedback": "..."
}}"""

        for attempt in range(2):
            try:
                completion = self.groq.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"}
                )
                raw = completion.choices[0].message.content
                result = json.loads(raw)
                required = ["ats_score", "category_scores", "strengths", "weaknesses", "missing_keywords", "feedback"]
                for key in required:
                    if key not in result:
                        raise ValueError(f"Missing key: {key}")
                return result
            except (json.JSONDecodeError, ValueError, TypeError, KeyError):
                if attempt == 1:
                    raise ResumeException(
                        "Resume analysis failed: AI returned an invalid response. Please try again.",
                        500
                    )

    def upload_to_storage(self, user_id: str, file_bytes: bytes, original_filename: str = "") -> str:
        try:
            safe_filename = sanitize_filename(original_filename) if original_filename else f"{uuid.uuid4()}.pdf"
            file_path = f"resumes/{user_id}/{uuid.uuid4()}_{safe_filename}"
            self.supabase.storage.from_("resumes").upload(
                file_path, 
                file_bytes,
                {"content-type": "application/pdf"}
            )
            return file_path
        except Exception as e:
            raise ResumeException(f"Failed to upload resume file: {str(e)}", 500)

    def save_analysis(
        self,
        user_id: str,
        file_path: str,
        filename: str,
        file_size: int,
        target_role: str,
        extracted_text: str,
        score_result: dict
    ) -> dict:
        try:
            data = {
                "user_id": user_id,
                "file_path": file_path,
                "original_filename": filename,
                "file_size": file_size,
                "target_role": target_role,
                "extracted_text": extracted_text,
                "ats_score": score_result.get("ats_score"),
                "category_scores": score_result.get("category_scores"),
                "strengths": score_result.get("strengths", []),
                "weaknesses": score_result.get("weaknesses", []),
                "missing_keywords": score_result.get("missing_keywords", []),
                "feedback": score_result.get("feedback"),
            }
            response = self.supabase.table("resumes").insert(data).execute()
            if not response.data:
                raise ResumeException("Failed to save analysis result", 500)
            return response.data[0]
        except Exception as e:
            if isinstance(e, ResumeException):
                raise e
            raise ResumeException(f"Failed to save analysis: {str(e)}", 500)

    def get_analysis(self, resume_id: str) -> dict:
        try:
            response = self.supabase.table("resumes").select("*").eq("id", resume_id).execute()
            if not response.data:
                raise ResumeException("Resume analysis not found", 404)
            return response.data[0]
        except Exception as e:
            if isinstance(e, ResumeException):
                raise e
            raise ResumeException(str(e), 400)

    def list_analyses(self, user_id: str) -> list:
        try:
            response = (
                self.supabase.table("resumes")
                .select("*")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .execute()
            )
            return response.data or []
        except Exception as e:
            raise ResumeException(str(e), 400)
