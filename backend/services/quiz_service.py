import os
import json
import uuid
import random
import hashlib
from datetime import datetime, timedelta, timezone
from concurrent.futures import ThreadPoolExecutor, as_completed
from dotenv import load_dotenv
from supabase import create_client, Client
from groq import Groq
from backend.models.quiz_model import (
    PREDEFINED_TOPICS_SET,
    TIME_LIMIT_MAP,
    QuestionResponse,
    QuizGenerateResponse,
    TopicScore,
    QuestionResult,
    QuizResultResponse,
    AttemptSummary,
    BookmarkAddRequest,
    BookmarkResponse,
)


base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dotenv_path = os.path.join(base_dir, ".env")
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)
else:
    load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")


class QuizException(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class QuizService:
    def __init__(self):
        self._supabase = None
        self._groq = None

    @property
    def supabase(self) -> Client:
        if self._supabase is None:
            if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
                raise QuizException("Supabase credentials not configured", 500)
            self._supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        return self._supabase

    @property
    def groq(self) -> Groq:
        if self._groq is None:
            if not GROQ_API_KEY:
                raise QuizException("GROQ_API_KEY not configured", 500)
            self._groq = Groq(api_key=GROQ_API_KEY)
        return self._groq

    def _parse_json_field(self, value):
        if isinstance(value, str):
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return value
        return value

    def _get_question_hash(self, question: str) -> str:
        """Generate a hash for a question to detect duplicates."""
        normalized = " ".join(question.lower().split())
        return hashlib.sha256(normalized.encode()).hexdigest()[:16]

    def _get_previous_question_hashes(self, user_id: str, topic: str, limit: int = 50) -> set[str]:
        """Fetch hashes of previously asked questions for a user/topic."""
        try:
            resp = (
                self.supabase.table("attempts")
                .select("questions")
                .eq("user_id", user_id)
                .contains("topics", [topic])
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            hashes = set()
            for attempt in resp.data or []:
                questions = self._parse_json_field(attempt.get("questions", []))
                for q in questions:
                    if q.get("topic") == topic:
                        hashes.add(self._get_question_hash(q["question"]))
            return hashes
        except Exception:
            return set()

    def generate_questions(self, user_id: str, topics: list[str], difficulty: str, total_questions: int) -> QuizGenerateResponse:
        try:
            last_resp = (
                self.supabase.table("attempts")
                .select("created_at")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            if last_resp.data:
                last_created = last_resp.data[0]["created_at"]
                if isinstance(last_created, str):
                    last_created = datetime.fromisoformat(last_created)
                elapsed = datetime.now(timezone.utc) - last_created
                if elapsed.total_seconds() < 30:
                    remaining = int(30 - elapsed.total_seconds())
                    raise QuizException(
                        f"Please wait {remaining} seconds before generating a new quiz",
                        429
                    )
        except QuizException:
            raise
        except Exception as e:
            raise QuizException(str(e), 400)

        try:
            self.supabase.table("attempts")\
                .update({"status": "abandoned"})\
                .eq("user_id", user_id)\
                .eq("status", "pending")\
                .execute()
        except Exception:
            pass

        base = total_questions // len(topics)
        remainder = total_questions % len(topics)
        counts = []
        for i in range(len(topics)):
            counts.append(base + (1 if i < remainder else 0))

        all_questions = []
        with ThreadPoolExecutor(max_workers=len(topics)) as executor:
            future_map = {}
            for i, topic in enumerate(topics):
                previous_hashes = self._get_previous_question_hashes(user_id, topic)
                future_map[
                    executor.submit(self._generate_topic_questions, topic, difficulty, counts[i], previous_hashes)
                ] = topic
            for future in as_completed(future_map):
                topic = future_map[future]
                try:
                    questions = future.result()
                    all_questions.extend(questions)
                except Exception as e:
                    raise QuizException(f"Failed to generate questions for {topic}: {str(e)}", 500)

        random.shuffle(all_questions)

        now = datetime.now(timezone.utc)
        time_limit_minutes = TIME_LIMIT_MAP[total_questions]
        expires_at = now + timedelta(minutes=time_limit_minutes)

        attempt_id = str(uuid.uuid4())
        attempt_data = {
            "id": attempt_id,
            "user_id": user_id,
            "topics": topics,
            "difficulty": difficulty,
            "total_questions": len(all_questions),
            "correct_answers": 0,
            "topic_scores": {},
            "questions": json.dumps(all_questions),
            "user_answers": None,
            "status": "pending",
            "created_at": now.isoformat(),
            "expires_at": expires_at.isoformat(),
        }

        try:
            response = self.supabase.table("attempts").insert(attempt_data).execute()
            if not response.data:
                raise QuizException("Failed to save quiz attempt", 500)
        except Exception as e:
            raise QuizException(f"Failed to save quiz attempt: {str(e)}", 500)

        sanitized = [
            QuestionResponse(
                question=q["question"],
                options=q["options"],
                topic=q["topic"],
                difficulty=q["difficulty"],
            )
            for q in all_questions
        ]

        return QuizGenerateResponse(
            attempt_id=attempt_id,
            time_limit_minutes=time_limit_minutes,
            questions=sanitized,
        )

    def _generate_topic_questions(self, topic: str, difficulty: str, count: int, previous_hashes: set[str] = None) -> list[dict]:
        if previous_hashes is None:
            previous_hashes = set()

        system_prompt = (
            "You are an expert computer science quiz generator. "
            "Generate multiple-choice questions in valid JSON only. "
            "No markdown, no code blocks, no explanation outside the JSON."
        )

        exclude_note = ""
        if previous_hashes:
            exclude_note = (
                f"\n\nIMPORTANT: Do NOT generate questions similar to these previously asked "
                f"question hashes (first 16 chars of SHA256): {', '.join(sorted(previous_hashes))}. "
                "Ensure new questions are distinct in wording and concept."
            )

        user_prompt = f"""Generate {count} {difficulty} multiple-choice questions on the topic "{topic}".

Each question must have:
- A clear question statement
- Exactly 4 options
- One correct option (indicated by its 0-based index in correct_option)
- A concise educational explanation

Return valid JSON in this exact structure:
{{
  "questions": [
    {{
      "question": "string",
      "options": ["option0", "option1", "option2", "option3"],
      "correct_option": 0,
      "explanation": "string"
    }}
  ]
}}{exclude_note}"""

        for attempt in range(2):
            try:
                completion = self.groq.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    response_format={"type": "json_object"},
                )
                raw = completion.choices[0].message.content
                result = json.loads(raw)
                questions = result.get("questions", [])
                if not questions or len(questions) != count:
                    raise ValueError(f"Expected {count} questions, got {len(questions)}")
                for q in questions:
                    required = ["question", "options", "correct_option", "explanation"]
                    for key in required:
                        if key not in q:
                            raise ValueError(f"Missing key: {key}")
                    if len(q["options"]) != 4:
                        raise ValueError("Each question must have exactly 4 options")
                    if not isinstance(q["correct_option"], int) or q["correct_option"] not in range(4):
                        raise ValueError("correct_option must be an integer 0-3")

                # Filter out any duplicates the LLM might have generated
                seen = set()
                unique_questions = []
                for q in questions:
                    q_hash = self._get_question_hash(q["question"])
                    if q_hash not in previous_hashes and q_hash not in seen:
                        seen.add(q_hash)
                        unique_questions.append(q)

                if len(unique_questions) < count:
                    # If we lost questions to deduplication, retry once
                    if attempt == 0:
                        continue
                    raise ValueError(f"Generated {len(unique_questions)} unique questions, need {count}")

                for q in unique_questions:
                    q["topic"] = topic
                    q["difficulty"] = difficulty
                return unique_questions
            except (json.JSONDecodeError, ValueError, TypeError, KeyError):
                if attempt == 1:
                    raise QuizException(
                        f"Question generation failed for {topic}: "
                        "AI returned an invalid response. Please try again.",
                        500,
                    )

    def submit_attempt(self, user_id: str, attempt_id: str, answers: list[int]) -> QuizResultResponse:
        try:
            response = self.supabase.table("attempts").select("*").eq("id", attempt_id).execute()
            if not response.data:
                raise QuizException("Attempt not found", 404)
        except QuizException:
            raise
        except Exception as e:
            raise QuizException(str(e), 400)

        attempt = response.data[0]

        if str(attempt.get("user_id")) != user_id:
            raise QuizException("Attempt not found", 404)

        if attempt.get("status") == "completed":
            raise QuizException("This attempt has already been submitted", 400)

        expires_at = attempt.get("expires_at")
        if expires_at:
            if isinstance(expires_at, str):
                try:
                    expires_at = datetime.fromisoformat(expires_at)
                except (ValueError, TypeError):
                    expires_at = None
            if expires_at and datetime.now(timezone.utc) > expires_at:
                raise QuizException(
                    "Time limit exceeded, quiz attempt has expired", 400
                )

        stored_questions = self._parse_json_field(attempt.get("questions", []))

        if len(answers) != len(stored_questions):
            raise QuizException(
                f"Expected {len(stored_questions)} answers, got {len(answers)}", 400
            )

        correct_count = 0
        topic_correct = {}
        topic_total = {}
        question_results = []

        for stored_q, selected in zip(stored_questions, answers):
            topic = stored_q["topic"]
            is_correct = selected == stored_q["correct_option"]
            if is_correct:
                correct_count += 1
            topic_correct[topic] = topic_correct.get(topic, 0) + (1 if is_correct else 0)
            topic_total[topic] = topic_total.get(topic, 0) + 1

            question_results.append(QuestionResult(
                question=stored_q["question"],
                options=stored_q["options"],
                correct_option=stored_q["correct_option"],
                selected_option=selected,
                is_correct=is_correct,
                explanation=stored_q["explanation"],
                topic=topic,
                difficulty=stored_q.get("difficulty", attempt.get("difficulty", "medium")),
            ))

        topic_scores = {}
        for topic in topic_total:
            pct = round((topic_correct[topic] / topic_total[topic]) * 100, 1)
            topic_scores[topic] = TopicScore(
                correct=topic_correct[topic],
                total=topic_total[topic],
                percentage=pct,
            )

        score_percentage = round((correct_count / len(stored_questions)) * 100, 1)

        try:
            update_data = {
                "correct_answers": correct_count,
                "topic_scores": json.dumps({k: v.model_dump() for k, v in topic_scores.items()}),
                "user_answers": json.dumps(answers),
                "status": "completed",
            }
            self.supabase.table("attempts").update(update_data).eq("id", attempt_id).execute()
        except Exception as e:
            raise QuizException(f"Failed to save results: {str(e)}", 500)

        skill_scores_updated = self._update_skill_scores(user_id, topic_scores)

        created_at = attempt.get("created_at")
        if isinstance(created_at, str):
            try:
                created_at = datetime.fromisoformat(created_at)
            except (ValueError, TypeError):
                created_at = datetime.now(timezone.utc)

        return QuizResultResponse(
            attempt_id=attempt_id,
            total_questions=len(stored_questions),
            correct_answers=correct_count,
            score_percentage=score_percentage,
            topic_scores=topic_scores,
            skill_scores_updated=skill_scores_updated,
            questions=question_results,
            created_at=created_at,
        )

    def _update_skill_scores(self, user_id: str, topic_scores: dict[str, TopicScore]) -> dict[str, int]:
        topics_to_update = set(topic_scores.keys()) & PREDEFINED_TOPICS_SET

        try:
            user_resp = self.supabase.table("users").select("skill_scores").eq("id", user_id).execute()
            if not user_resp.data:
                raise QuizException("User not found", 404)
            current_scores = self._parse_json_field(user_resp.data[0].get("skill_scores", {}))
        except Exception as e:
            if isinstance(e, QuizException):
                raise
            raise QuizException(f"Failed to fetch user scores: {str(e)}", 500)

        new_scores = dict(current_scores)

        for topic in topics_to_update:
            try:
                attempts_resp = (
                    self.supabase.table("attempts")
                    .select("topic_scores")
                    .eq("user_id", user_id)
                    .eq("status", "completed")
                    .contains("topics", [topic])
                    .order("created_at", desc=True)
                    .limit(3)
                    .execute()
                )

                percentages = []
                if attempts_resp.data:
                    for att in attempts_resp.data:
                        ts = self._parse_json_field(att.get("topic_scores", {}))
                        if isinstance(ts, dict) and topic in ts:
                            entry = ts[topic]
                            if isinstance(entry, dict):
                                pct = entry.get("percentage", 0)
                            else:
                                pct = 0
                            percentages.append(pct)

                if percentages:
                    new_scores[topic] = round(sum(percentages) / len(percentages))
                else:
                    new_scores[topic] = round(topic_scores[topic].percentage)
            except Exception as e:
                raise QuizException(f"Failed to update skill score for {topic}: {str(e)}", 500)

        try:
            self.supabase.table("users").update({"skill_scores": new_scores}).eq("id", user_id).execute()
        except Exception as e:
            raise QuizException(f"Failed to save skill scores: {str(e)}", 500)

        return new_scores

    def get_user_attempts(self, user_id: str) -> list[AttemptSummary]:
        try:
            response = (
                self.supabase.table("attempts")
                .select("*")
                .eq("user_id", user_id)
                .eq("status", "completed")
                .order("created_at", desc=True)
                .execute()
            )
            results = []
            for row in response.data or []:
                total = row.get("total_questions", 0)
                correct = row.get("correct_answers", 0)
                pct = round((correct / total * 100), 1) if total > 0 else 0.0
                created_at = row.get("created_at")
                if isinstance(created_at, str):
                    try:
                        created_at = datetime.fromisoformat(created_at)
                    except (ValueError, TypeError):
                        created_at = datetime.now(timezone.utc)
                results.append(AttemptSummary(
                    id=row["id"],
                    topics=row.get("topics", []),
                    difficulty=row.get("difficulty", ""),
                    total_questions=total,
                    correct_answers=correct,
                    score_percentage=pct,
                    created_at=created_at,
                ))
            return results
        except Exception as e:
            raise QuizException(str(e), 400)

    def get_attempt_detail(self, user_id: str, attempt_id: str) -> QuizResultResponse:
        try:
            response = self.supabase.table("attempts").select("*").eq("id", attempt_id).execute()
            if not response.data:
                raise QuizException("Attempt not found", 404)
        except QuizException:
            raise
        except Exception as e:
            raise QuizException(str(e), 400)

        attempt = response.data[0]

        if str(attempt.get("user_id")) != user_id:
            raise QuizException("Attempt not found", 404)

        stored_questions = self._parse_json_field(attempt.get("questions", []))
        user_answers = self._parse_json_field(attempt.get("user_answers", []))
        topic_scores_raw = self._parse_json_field(attempt.get("topic_scores", {}))

        topic_scores = {}
        for topic, data in topic_scores_raw.items():
            if isinstance(data, dict):
                topic_scores[topic] = TopicScore(
                    correct=data.get("correct", 0),
                    total=data.get("total", 0),
                    percentage=data.get("percentage", 0.0),
                )

        total = attempt.get("total_questions", 0)
        correct = attempt.get("correct_answers", 0)
        score_pct = round((correct / total * 100), 1) if total > 0 else 0.0

        question_results = []
        for i, q in enumerate(stored_questions):
            selected = user_answers[i] if isinstance(user_answers, list) and i < len(user_answers) else -1
            is_correct = selected == q["correct_option"]
            question_results.append(QuestionResult(
                question=q["question"],
                options=q["options"],
                correct_option=q["correct_option"],
                selected_option=selected,
                is_correct=is_correct,
                explanation=q.get("explanation", ""),
                topic=q.get("topic", ""),
                difficulty=q.get("difficulty", attempt.get("difficulty", "medium")),
            ))

        created_at = attempt.get("created_at")
        if isinstance(created_at, str):
            try:
                created_at = datetime.fromisoformat(created_at)
            except (ValueError, TypeError):
                created_at = datetime.now(timezone.utc)

        return QuizResultResponse(
            attempt_id=attempt_id,
            total_questions=total,
            correct_answers=correct,
            score_percentage=score_pct,
            topic_scores=topic_scores,
            skill_scores_updated={},
            questions=question_results,
            created_at=created_at,
        )

    def get_skill_stats(self, user_id: str) -> dict:
        try:
            response = self.supabase.table("users").select("skill_scores").eq("id", user_id).execute()
            if not response.data:
                raise QuizException("User not found", 404)
            scores = self._parse_json_field(response.data[0].get("skill_scores", {}))
            return {"skill_scores": scores}
        except Exception as e:
            if isinstance(e, QuizException):
                raise
            raise QuizException(str(e), 400)

    def add_bookmark(self, user_id: str, attempt_id: str, question_index: int, note: str = None) -> dict:
        try:
            resp = self.supabase.table("attempts").select("questions, topics, difficulty").eq("id", attempt_id).execute()
            if not resp.data:
                raise QuizException("Attempt not found", 404)
            attempt = resp.data[0]

            questions = self._parse_json_field(attempt.get("questions", []))
            if question_index < 0 or question_index >= len(questions):
                raise QuizException("Invalid question index", 400)

            q = questions[question_index]
            payload = {
                "attempt_id": attempt_id,
                "question_index": question_index,
                "note": note,
                "question_text": q.get("question", ""),
                "topic": q.get("topic", ""),
                "difficulty": q.get("difficulty", ""),
            }

            upsert = (
                self.supabase.table("question_bookmarks")
                .upsert(
                    {
                        "user_id": user_id,
                        "attempt_id": attempt_id,
                        "question_index": question_index,
                        "note": note,
                    },
                    on_conflict="user_id, attempt_id, question_index",
                )
                .execute()
            )

            if upsert.data:
                payload["id"] = upsert.data[0]["id"]
            return payload

        except QuizException:
            raise
        except Exception as e:
            raise QuizException(f"Failed to add bookmark: {str(e)}", 400)

    def remove_bookmark(self, user_id: str, attempt_id: str, question_index: int) -> None:
        try:
            self.supabase.table("question_bookmarks")\
                .delete()\
                .eq("user_id", user_id)\
                .eq("attempt_id", attempt_id)\
                .eq("question_index", question_index)\
                .execute()
        except Exception as e:
            raise QuizException(f"Failed to remove bookmark: {str(e)}", 400)

    def get_user_bookmarks(self, user_id: str) -> list[dict]:
        try:
            resp = (
                self.supabase.table("question_bookmarks")
                .select("*")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .execute()
            )
            results = []
            for row in resp.data or []:
                bm = {
                    "id": row["id"],
                    "attempt_id": row["attempt_id"],
                    "question_index": row["question_index"],
                    "note": row.get("note"),
                    "created_at": row.get("created_at"),
                    "question_text": "",
                    "topic": "",
                    "difficulty": "",
                }
                try:
                    att_resp = self.supabase.table("attempts").select("questions, topics, difficulty").eq("id", row["attempt_id"]).execute()
                    if att_resp.data:
                        att = att_resp.data[0]
                        questions = self._parse_json_field(att.get("questions", []))
                        idx = row["question_index"]
                        if idx < len(questions):
                            q = questions[idx]
                            bm["question_text"] = q.get("question", "")
                            bm["topic"] = q.get("topic", "")
                            bm["difficulty"] = q.get("difficulty", "")
                except Exception:
                    pass
                results.append(bm)
            return results
        except Exception as e:
            raise QuizException(f"Failed to fetch bookmarks: {str(e)}", 400)
    