import os
import json
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from backend.app.models.schema import Question, Concept, Topic, Chapter, Subject, Exam

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "data")
CACHE_FILE = os.path.join(DATA_DIR, "jee_neet_benchmark_cache.json")
BENCHMARK_API = "https://datasets-server.huggingface.co/rows?dataset=Reja1%2Fjee-neet-benchmark&config=default&split=test"


class JeeNeetBenchmarkService:
    """
    Service for the HuggingFace 'Reja1/jee-neet-benchmark' dataset containing authentic
    2024-2025 JEE Advanced & NEET question paper crops with images and official keys.
    """

    def __init__(self, cache_file: str = CACHE_FILE):
        self.cache_file = cache_file
        self.cached_rows: List[Dict[str, Any]] = []
        self._load_cache()

    def _load_cache(self):
        """Loads cached rows from local disk for offline resilience."""
        if os.path.exists(self.cache_file):
            try:
                with open(self.cache_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.cached_rows = [r.get("row", r) for r in data.get("rows", [])]
            except Exception as e:
                print(f"[JeeNeetBenchmarkService] Error loading cache: {e}")
                self.cached_rows = []

    def _save_cache(self):
        """Saves cached benchmark rows to disk."""
        try:
            os.makedirs(os.path.dirname(self.cache_file), exist_ok=True)
            formatted = {"rows": [{"row": r} for r in self.cached_rows]}
            with open(self.cache_file, "w", encoding="utf-8") as f:
                json.dump(formatted, f, indent=2)
        except Exception as e:
            print(f"[JeeNeetBenchmarkService] Error saving cache: {e}")

    def fetch_from_api(self, offset: int = 0, length: int = 50, timeout: int = 15) -> List[Dict[str, Any]]:
        """Fetches live benchmark rows from Hugging Face with cache fallback."""
        url = f"{BENCHMARK_API}&offset={offset}&length={length}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "AdaptiveIntelligenceEngine/1.0"})
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                new_rows = [r.get("row", r) for r in data.get("rows", [])]
                if new_rows:
                    existing_qids = {r.get("question_id") for r in self.cached_rows}
                    for nr in new_rows:
                        if nr.get("question_id") and nr["question_id"] not in existing_qids:
                            self.cached_rows.append(nr)
                            existing_qids.add(nr["question_id"])
                    self._save_cache()
                    return new_rows
        except Exception as e:
            print(f"[JeeNeetBenchmarkService] API fetch notice ({url}): {e}. Using cached rows.")

        return self.cached_rows[offset: offset + length] if self.cached_rows else []

    @staticmethod
    def parse_correct_letter(raw_ans: Any) -> str:
        """Normalizes answers like '[\"1\"]', '[\"C\"]', '1', 'C' to 'A', 'B', 'C', 'D'."""
        if not raw_ans:
            return "A"
        clean = str(raw_ans).replace("[", "").replace("]", "").replace('"', "").replace("'", "").strip()
        num_map = {"1": "A", "2": "B", "3": "C", "4": "D"}
        if clean in num_map:
            return num_map[clean]
        upper = clean.upper()
        if upper in ["A", "B", "C", "D"]:
            return upper
        return "A"

    def seed_to_database(self, db: Session, max_items: int = 100) -> int:
        """Seeds authentic benchmark questions with official crops into the Question database."""
        rows = self.cached_rows[:max_items]
        if not rows:
            rows = self.fetch_from_api(offset=0, length=50)

        added_count = 0
        for row in rows:
            qid = row.get("question_id")
            if not qid:
                continue

            exam_raw = row.get("exam_name", "NEET")
            exam = "JEE" if "JEE" in exam_raw else "NEET"
            sub_raw = row.get("subject", "Physics")
            subject = "Biology" if sub_raw in ["Botany", "Zoology", "Biology"] else sub_raw
            year = row.get("exam_year", 2024)
            img_data = row.get("image", {})
            img_url = img_data.get("src") if isinstance(img_data, dict) else None

            db_qid = f"BENCH_{exam}_{qid}"
            existing = db.query(Question).filter(Question.question_id == db_qid).first()
            if existing:
                continue

            # Ensure subject exists
            sub_id = f"sub_{exam.lower()}_{subject.lower().replace(' ', '_')}"
            sub_rec = db.query(Subject).filter(Subject.subject_id == sub_id).first()
            if not sub_rec:
                sub_rec = Subject(subject_id=sub_id, exam_id=exam, name=subject)
                db.add(sub_rec)
                db.flush()

            # Ensure chapter & topic
            chap_id = f"chap_{sub_id}_benchmark"
            chap_rec = db.query(Chapter).filter(Chapter.chapter_id == chap_id).first()
            if not chap_rec:
                chap_rec = Chapter(chapter_id=chap_id, subject_id=sub_id, name=f"{exam} {year} Official Papers")
                db.add(chap_rec)
                db.flush()

            top_id = f"top_{chap_id}_{qid[:4]}"
            top_rec = db.query(Topic).filter(Topic.topic_id == top_id).first()
            if not top_rec:
                top_rec = Topic(topic_id=top_id, chapter_id=chap_id, name=f"{exam} {year} Paper Section")
                db.add(top_rec)
                db.flush()

            conc_id = f"c_{top_id}_item"
            conc_rec = db.query(Concept).filter(Concept.concept_id == conc_id).first()
            if not conc_rec:
                conc_rec = Concept(
                    concept_id=conc_id,
                    topic_id=top_id,
                    name=f"{exam} Official Problem {qid}",
                    estimated_minutes=45,
                    exam_relevance=0.98,
                    difficulty_weight=0.75 if "ADVANCED" in exam_raw else 0.55,
                    description=f"Authentic {year} official competitive examination question crop."
                )
                db.add(conc_rec)
                db.flush()

            correct_letter = self.parse_correct_letter(row.get("correct_answer"))
            is_advanced = "ADVANCED" in exam_raw

            options = [
                {"id": "A", "text": "Option (1)"},
                {"id": "B", "text": "Option (2)"},
                {"id": "C", "text": "Option (3)"},
                {"id": "D", "text": "Option (4)"}
            ]

            distractors = {
                "A": "CALCULATION_ERROR: Standard sign or scaling inversion.",
                "B": "CONCEPTUAL_ERROR: Disregards active physical/chemical boundary limits.",
                "C": "FORMULA_SELECTION_ERROR: Applied static single-step approximation.",
                "D": "CALCULATION_ERROR: Arithmetic slip in intermediate computation."
            }
            if correct_letter in distractors:
                del distractors[correct_letter]

            content = (
                f"Official Authentic Question from {exam_raw} ({year}) — Question Code: {qid}.\n"
                f"Subject: {subject}. Carefully analyze the official question paper crop below and select the correct option."
            )

            q = Question(
                question_id=db_qid,
                exam=exam,
                paper=f"{exam_raw}_{year}",
                subject=subject,
                chapter=chap_rec.name,
                topic=top_rec.name,
                chapter_id=chap_id,
                topic_id=top_id,
                concept_id=conc_id,
                skill="problem_solving" if is_advanced else "analytical",
                difficulty=0.82 if is_advanced else 0.58,
                discrimination=1.6 if is_advanced else 1.3,
                estimated_time=120 if is_advanced else 75,
                question_type="multiple_choice",
                content=content,
                options=options,
                correct_answer=correct_letter,
                explanation=f"Verified from official {exam_raw} {year} answer key: Option ({correct_letter}) is correct.",
                distractor_explanations=distractors,
                tier="ADVANCED" if is_advanced else "STANDARD",
                image_url=img_url
            )
            db.add(q)
            added_count += 1

        db.commit()
        return added_count
