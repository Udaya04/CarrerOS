import os
import hashlib
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client
import httpx

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dotenv_path = os.path.join(base_dir, ".env")
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)
else:
    load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
JSEARCH_API_KEY = os.environ.get("JSEARCH_API_KEY")


class JobException(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class JobsService:
    def __init__(self):
        self._supabase = None

    @property
    def supabase(self) -> Client:
        if self._supabase is None:
            if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
                raise JobException("Supabase credentials not configured", 500)
            self._supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        return self._supabase

    async def search_jobs(self, q: str, location: str | None, page: int) -> dict:
        location_part = location or ""
        query_hash = hashlib.md5(f"{q}_{location_part}_{page}".encode()).hexdigest()

        cache_resp = self.supabase.table("search_cache").select("*").eq("query_hash", query_hash).execute()
        if cache_resp.data:
            entry = cache_resp.data[0]
            fetched_at = entry.get("fetched_at")
            if isinstance(fetched_at, str):
                fetched_at = datetime.fromisoformat(fetched_at.replace("Z", "+00:00"))
            if fetched_at and datetime.now(timezone.utc) - fetched_at < timedelta(hours=24):
                job_ids = entry.get("job_ids", [])
                if job_ids:
                    jobs = self.supabase.table("jobs_cache").select("*").in_("id", job_ids).execute()
                    return {"jobs": jobs.data or [], "total": len(jobs.data or []), "page": page, "cached": True}

        jobs_data = await self._fetch_from_jsearch(q, location, page)
        job_ids = []

        for job in jobs_data:
            upsert_resp = self.supabase.table("jobs_cache").upsert(job, on_conflict="external_id").execute()
            if upsert_resp.data:
                job_ids.append(upsert_resp.data[0]["id"])

        self.supabase.table("search_cache").upsert(
            {"query_hash": query_hash, "job_ids": job_ids},
            on_conflict="query_hash"
        ).execute()

        jobs_resp = self.supabase.table("jobs_cache").select("*").in_("id", job_ids).execute()
        return {"jobs": jobs_resp.data or [], "total": len(jobs_resp.data or []), "page": page, "cached": False}

    async def _fetch_from_jsearch(self, q: str, location: str | None, page: int) -> list[dict]:
        if not JSEARCH_API_KEY:
            raise JobException("JSEARCH_API_KEY not configured", 500)

        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.openwebninja.com/jsearch/search-v2",
                headers={"x-api-key": JSEARCH_API_KEY},
                params={
                    "query": f"{q} in {location}" if location else q,
                    "page": str(page),
                    "num_pages": "1"
                },
                timeout=60.0
            )

        if response.status_code != 200:
            raise JobException(f"JSearch API error: {response.status_code}", 502)

        raw = response.json()
        data = raw.get("data", {}).get("jobs", []) if isinstance(raw, dict) else []
        mapped = []
        for item in data:
            location_parts = []
            if item.get("job_city"):
                location_parts.append(item["job_city"])
            if item.get("job_country"):
                location_parts.append(item["job_country"])

            salary = None
            min_sal = item.get("job_min_salary")
            max_sal = item.get("job_max_salary")
            if min_sal and max_sal:
                salary = f"${min_sal:,.0f} - ${max_sal:,.0f}"
            elif min_sal:
                salary = f"${min_sal:,.0f}"
            elif max_sal:
                salary = f"${max_sal:,.0f}"

            mapped.append({
                "external_id": item.get("job_id", ""),
                "title": item.get("job_title", ""),
                "company": item.get("employer_name", ""),
                "location": ", ".join(location_parts) if location_parts else None,
                "job_type": item.get("job_employment_type"),
                "description": item.get("job_description"),
                "apply_url": item.get("job_apply_link"),
                "salary": salary,
                "posted_at": item.get("job_posted_at_datetime_utc"),
            })
        return mapped

    def get_job(self, job_id: str) -> dict:
        resp = self.supabase.table("jobs_cache").select("*").eq("id", job_id).execute()
        if not resp.data:
            raise JobException("Job not found", 404)
        return resp.data[0]

    def save_job(self, user_id: str, job_id: str) -> dict:
        self._ensure_job_exists(job_id)
        try:
            resp = self.supabase.table("saved_jobs").insert({
                "user_id": user_id,
                "job_id": job_id
            }).execute()
            return resp.data[0]
        except Exception as e:
            if "duplicate key" in str(e).lower() or "unique constraint" in str(e).lower():
                raise JobException("Job already saved", 400)
            raise JobException(str(e), 400)

    def get_saved_jobs(self, user_id: str) -> list[dict]:
        resp = self.supabase.table("saved_jobs").select("*, job:job_id(*)").eq("user_id", user_id).order("saved_at", desc=True).execute()
        return resp.data or []

    def remove_saved_job(self, user_id: str, job_id: str) -> None:
        self._ensure_job_exists(job_id)
        resp = self.supabase.table("saved_jobs").delete().eq("user_id", user_id).eq("job_id", job_id).execute()
        if not resp.data:
            raise JobException("Saved job not found", 404)

    def apply_job(self, user_id: str, job_id: str) -> dict:
        self._ensure_job_exists(job_id)
        try:
            resp = self.supabase.table("applied_jobs").insert({
                "user_id": user_id,
                "job_id": job_id
            }).execute()
            return resp.data[0]
        except Exception as e:
            if "duplicate key" in str(e).lower() or "unique constraint" in str(e).lower():
                raise JobException("Job already applied", 400)
            raise JobException(str(e), 400)

    def get_applied_jobs(self, user_id: str) -> list[dict]:
        resp = self.supabase.table("applied_jobs").select("*, job:job_id(*)").eq("user_id", user_id).order("applied_at", desc=True).execute()
        return resp.data or []

    def _ensure_job_exists(self, job_id: str) -> None:
        resp = self.supabase.table("jobs_cache").select("id").eq("id", job_id).execute()
        if not resp.data:
            raise JobException("Job not found", 404)
