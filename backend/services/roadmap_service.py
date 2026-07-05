import os
import re
import json
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv
from supabase import create_client, Client
from groq import Groq
from backend.models.roadmap_model import (
    RoadmapCategory, RoadmapTopic,
    RoadmapResponse, RoadmapSummary
)

base_dir = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__)))
dotenv_path = os.path.join(base_dir, ".env")
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)
else:
    load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

# Hardcoded categories for known topics
# AI only fills descriptions/resources
TOPIC_CATEGORIES = {
    "dsa": [
        "Arrays & Strings",
        "Linked Lists",
        "Stacks & Queues",
        "Trees & BST",
        "Graphs",
        "Dynamic Programming",
        "Sorting & Searching",
        "Recursion & Backtracking"
    ],
    "python": [
        "Python Basics",
        "Data Types & Collections",
        "Functions & Modules",
        "OOP in Python",
        "File Handling",
        "Libraries & Frameworks"
    ],
    "system design": [
        "Fundamentals",
        "Database Design",
        "Caching",
        "Load Balancing",
        "Microservices",
        "Message Queues"
    ],
    "javascript": [
        "JS Fundamentals",
        "DOM & Events",
        "Async JavaScript",
        "ES6+ Features",
        "APIs & Fetch",
        "Node.js Basics"
    ],
    "react": [
        "React Basics",
        "Hooks",
        "State Management",
        "React Router",
        "Performance",
        "Testing"
    ],
    "machine learning": [
        "ML Fundamentals",
        "Data Preprocessing",
        "Supervised Learning",
        "Unsupervised Learning",
        "Neural Networks",
        "Model Evaluation"
    ],
    "os": [
        "Process Management",
        "Memory Management",
        "File Systems",
        "CPU Scheduling",
        "Deadlocks",
        "Synchronization"
    ],
    "dbms": [
        "Database Basics",
        "SQL Fundamentals",
        "Normalization",
        "Transactions & ACID",
        "Indexing",
        "NoSQL Databases"
    ],
    "cn": [
        "Network Basics",
        "OSI & TCP/IP Model",
        "Transport Layer",
        "Network Layer",
        "Application Layer",
        "Network Security"
    ],
    "java": [
        "Java Basics",
        "OOP Concepts",
        "Collections Framework",
        "Exception Handling",
        "Multithreading",
        "Java 8+ Features"
    ]
}


class RoadmapException(Exception):
    def __init__(self, message: str,
                 status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class RoadmapService:
    def __init__(self):
        self._supabase = None
        self._groq = None

    @property
    def supabase(self) -> Client:
        if self._supabase is None:
            if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
                raise RoadmapException(
                    "Supabase not configured", 500)
            self._supabase = create_client(
                SUPABASE_URL, SUPABASE_SERVICE_KEY)
        return self._supabase

    @property
    def groq(self) -> Groq:
        if self._groq is None:
            if not GROQ_API_KEY:
                raise RoadmapException(
                    "GROQ_API_KEY not configured", 500)
            self._groq = Groq(api_key=GROQ_API_KEY)
        return self._groq

    def _get_categories(self, topic: str) -> list[str]:
        """Get hardcoded categories or None"""
        return TOPIC_CATEGORIES.get(topic.lower().strip())

    def _build_prompt(
            self,
            topic: str,
            categories: list[str],
            target_role: str | None) -> str:

        role_line = (f"Target role: {target_role}\n"
                     if target_role else "")
        cats_json = json.dumps(categories)

        return f"""You are a {topic} learning expert.

Generate detailed learning content for a {topic} roadmap.
{role_line}
The roadmap has EXACTLY these categories (do not change them):
{cats_json}

For each category, generate 3-4 specific topics with:
- title: specific topic name
- description: what student will learn (2-3 sentences)  
- duration: how long to study (e.g. "3 days", "1 week")
- resources: 2 real learning resources with name and url

Return ONLY this JSON structure, no markdown:
{{
  "categories": [
    {{
      "title": "Arrays & Strings",
      "description": "Foundation of all DSA problems",
      "duration": "2 weeks",
      "topics": [
        {{
          "title": "Array Traversal",
          "description": "Learn basic array iteration patterns",
          "duration": "2 days",
          "resources": [
            {{"name": "LeetCode Arrays", "url": "https://leetcode.com/explore/learn/card/array-and-string/"}},
            {{"name": "GeeksforGeeks", "url": "https://www.geeksforgeeks.org/array-data-structure/"}}
          ]
        }}
      ]
    }}
  ]
}}

CRITICAL: Use EXACTLY the category titles provided.
Return raw JSON only. No explanation. No markdown."""

    def _parse_json(self, raw: str) -> dict:
        raw = raw.strip()
        if "```" in raw:
            raw = re.sub(r"```(?:json)?\s*", "", raw)
            raw = re.sub(r"```\s*$", "", raw)
            raw = raw.strip()
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start == -1 or end == 0:
            raise ValueError("No JSON found")
        return json.loads(raw[start:end])

    def generate_roadmap(
            self,
            user_id: str,
            topic: str,
            target_role: str | None = None
    ) -> RoadmapResponse:

        # Get hardcoded categories
        categories = self._get_categories(topic)

        # Unknown topic — ask AI for categories too
        if not categories:
            cat_prompt = f"""List 5-7 main learning categories for: {topic}
Return JSON only: {{"categories": ["Cat1", "Cat2", "Cat3"]}}"""
            
            cat_completion = self.groq.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "Return only valid JSON."},
                    {"role": "user", "content": cat_prompt}
                ],
                temperature=0.3,
                max_tokens=500,
                response_format={"type": "json_object"}
            )
            cat_raw = cat_completion.choices[0].message.content
            cat_data = json.loads(cat_raw)
            categories = cat_data.get("categories", [f"{topic} Fundamentals"])

        # Build content prompt with locked categories
        prompt = self._build_prompt(topic, categories, target_role)

        # Call Groq for content
        for attempt in range(3):
            try:
                completion = self.groq.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {
                            "role": "system",
                            "content": f"You are a {topic} expert. Return raw JSON only."
                        },
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                    max_tokens=4000,
                )
                raw = completion.choices[0].message.content
                result = self._parse_json(raw)

                # Parse categories
                raw_cats = result.get("categories", [])
                parsed_categories = []

                for i, cat in enumerate(raw_cats):
                    topics = []
                    for t in cat.get("topics", []):
                        topics.append(RoadmapTopic(
                            title=t.get("title", ""),
                            description=t.get("description", ""),
                            duration=t.get("duration", ""),
                            resources=t.get("resources", [])
                        ))
                    # Force correct title from our list
                    correct_title = (categories[i]
                                     if i < len(categories)
                                     else cat.get("title", ""))
                    parsed_categories.append(RoadmapCategory(
                        title=correct_title,
                        description=cat.get("description", ""),
                        duration=cat.get("duration", ""),
                        topics=topics
                    ))

                if not parsed_categories:
                    raise ValueError("No categories generated")

                break

            except Exception as e:
                if attempt == 2:
                    raise RoadmapException(
                        f"Generation failed: {str(e)}", 500)
                continue

        # Save to Supabase
        roadmap_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        save_data = {
            "id": roadmap_id,
            "user_id": user_id,
            "topic": topic,
            "target_role": target_role,
            "roadmap_data": json.dumps(
                [c.model_dump() for c in parsed_categories]),
            "created_at": now.isoformat(),
        }

        try:
            self.supabase.table("roadmaps").insert(
                save_data).execute()
        except Exception as e:
            raise RoadmapException(
                f"Failed to save: {str(e)}", 500)

        return RoadmapResponse(
            id=roadmap_id,
            topic=topic,
            target_role=target_role,
            categories=parsed_categories,
            created_at=now,
        )

    def get_user_roadmaps(
            self, user_id: str) -> list[RoadmapSummary]:
        try:
            response = (
                self.supabase.table("roadmaps")
                .select("id, topic, target_role, created_at")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .execute()
            )
            results = []
            for row in response.data or []:
                created_at = row.get("created_at")
                if isinstance(created_at, str):
                    try:
                        created_at = datetime.fromisoformat(created_at)
                    except Exception:
                        created_at = datetime.now(timezone.utc)
                results.append(RoadmapSummary(
                    id=row["id"],
                    topic=row.get("topic", ""),
                    target_role=row.get("target_role"),
                    created_at=created_at,
                ))
            return results
        except Exception as e:
            raise RoadmapException(str(e), 400)

    def get_roadmap(
            self,
            roadmap_id: str,
            user_id: str
    ) -> RoadmapResponse:
        try:
            response = (
                self.supabase.table("roadmaps")
                .select("*")
                .eq("id", roadmap_id)
                .execute()
            )
            if not response.data:
                raise RoadmapException("Not found", 404)
        except RoadmapException:
            raise
        except Exception as e:
            raise RoadmapException(str(e), 400)

        row = response.data[0]
        if str(row.get("user_id")) != user_id:
            raise RoadmapException("Not found", 404)

        roadmap_data = row.get("roadmap_data", "[]")
        if isinstance(roadmap_data, str):
            roadmap_data = json.loads(roadmap_data)

        categories = [
            RoadmapCategory(**cat)
            for cat in roadmap_data
        ]

        created_at = row.get("created_at")
        if isinstance(created_at, str):
            try:
                created_at = datetime.fromisoformat(created_at)
            except Exception:
                created_at = datetime.now(timezone.utc)

        return RoadmapResponse(
            id=row["id"],
            topic=row.get("topic", ""),
            target_role=row.get("target_role"),
            categories=categories,
            created_at=created_at,
        )

    def delete_roadmap(
            self, roadmap_id: str, user_id: str):
        try:
            response = (
                self.supabase.table("roadmaps")
                .select("id, user_id")
                .eq("id", roadmap_id)
                .execute()
            )
            if not response.data:
                raise RoadmapException("Not found", 404)
            if str(response.data[0].get("user_id")) != user_id:
                raise RoadmapException("Not found", 404)
            self.supabase.table("roadmaps").delete().eq(
                "id", roadmap_id).execute()
        except RoadmapException:
            raise
        except Exception as e:
            raise RoadmapException(str(e), 400)
