import uuid
import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from backend.app.models.schema import (
    Roadmap, RoadmapAction, StudentConceptMastery, Concept, Topic, Chapter, Subject, Student
)
from backend.app.roadmap.priority import PriorityEngine
from backend.app.knowledge_graph.graph import CurriculumGraph
from backend.app.knowledge_graph.prerequisites import PrerequisiteResolver
from backend.app.events.collector import EventCollector

class RoadmapGenerator:
    """
    Generates dynamic, action-oriented learning roadmaps tailored to the student's mastery,
    forgetting curves, and prerequisite graphs.
    """
    def __init__(self, db: Session, exam_id: str = "JEE"):
        self.db = db
        self.exam_id = exam_id
        self.priority_engine = PriorityEngine(db, exam_id=exam_id)
        self.graph = CurriculumGraph(db, exam_id=exam_id)
        self.prereq_resolver = PrerequisiteResolver(db, self.graph)

    def determine_action_type(
        self,
        mastery: float,
        forgetting_risk: float,
        exam: str = "JEE"
    ) -> Dict[str, Any]:
        """
        Determines the pedagogical action type and question parameterization based on mastery state,
        customized deeply for JEE Main vs NEET-UG tracks.
        """
        if forgetting_risk > 0.40 and mastery >= 0.50:
            return {
                "action_type": f"{exam}_RETENTION_DRILL",
                "questions_count": 5,
                "estimated_minutes": 20,
                "target_difficulty": 0.60,
                "strategy": "Spaced repetition drill targeting Ebbinghaus forgetting curve"
            }

        if mastery < 0.35:
            if exam == "JEE":
                action = "JEE_FOUNDATION_REBUILD"
                time_est = 45
                diff = 0.40
                strat = "First-principles derivation, coordinate axis setup & FBD equilibrium"
            elif exam == "NEET":
                action = "NEET_NCERT_CORE_RECALL"
                time_est = 35
                diff = 0.35
                strat = "NCERT line-by-line concept consolidation & biological definition mastery"
            else:
                action = "LEARN_CONCEPT"
                time_est = 40
                diff = 0.35
                strat = "Foundational conceptual study"

            return {
                "action_type": action,
                "questions_count": 5,
                "estimated_minutes": time_est,
                "target_difficulty": diff,
                "strategy": strat
            }
        elif mastery < 0.55:
            if exam == "JEE":
                action = "JEE_MAIN_SPRINT"
                time_est = 30
                diff = 0.55
                strat = "Speed-accuracy calibration for JEE Main single-choice & numerical sections"
            elif exam == "NEET":
                action = "NEET_HIGH_SPEED_DRILL"
                time_est = 25
                diff = 0.50
                strat = "Rapid-fire 45s/question pace, eliminating careless reads and sign slips"
            else:
                action = "BASIC_PRACTICE"
                time_est = 25
                diff = 0.50
                strat = "Basic application practice"

            return {
                "action_type": action,
                "questions_count": 7,
                "estimated_minutes": time_est,
                "target_difficulty": diff,
                "strategy": strat
            }
        elif mastery < 0.75:
            if exam == "JEE":
                action = "JEE_MULTI_CONCEPT_DRILL"
                time_est = 35
                diff = 0.70
                strat = "Multi-concept synthesis linking calculus with kinematics & electrodynamics"
            elif exam == "NEET":
                action = "NEET_APPLICATION_PRACTICE"
                time_est = 30
                diff = 0.65
                strat = "Assertion-reasoning, match-the-column & physiological multi-step numericals"
            else:
                action = "UPSC_PRELIMS_PRACTICE"
                time_est = 30
                diff = 0.70
                strat = "Standard prelims practice"

            return {
                "action_type": action,
                "questions_count": 6,
                "estimated_minutes": time_est,
                "target_difficulty": diff,
                "strategy": strat
            }
        elif mastery < 0.88:
            if exam == "JEE":
                action = "JEE_ADVANCED_PRACTICE"
                time_est = 40
                diff = 0.85
                strat = "Multi-correct, matrix match & paragraph questions with penalty risk control"
            elif exam == "NEET":
                action = "NEET_720_TARGET_SPRINT"
                time_est = 30
                diff = 0.80
                strat = "Zero-unforced-error speed drill targeting 700+ marks"
            else:
                action = "UPSC_MAINS_WRITING"
                time_est = 35
                diff = 0.85
                strat = "Answer writing practice"

            return {
                "action_type": action,
                "questions_count": 5,
                "estimated_minutes": time_est,
                "target_difficulty": diff,
                "strategy": strat
            }
        else:
            return {
                "action_type": f"{exam}_TRANSFER_TEST",
                "questions_count": 4,
                "estimated_minutes": 20,
                "target_difficulty": 0.85,
                "strategy": "Transfer problem testing across unencountered problem variants"
            }

    def generate_roadmap(
        self,
        student_id: str,
        max_actions: int = 6,
        trigger_event: str = "ASSESSMENT_COMPLETED"
    ) -> Roadmap:
        """
        Generates and saves a new dynamic roadmap for the student, superseding previous roadmaps.
        """
        student = self.db.query(Student).filter(Student.student_id == student_id).first()
        exam_id = student.target_exam if student else self.exam_id

        # Mark existing active roadmaps as SUPERSEDED
        existing_roadmaps = self.db.query(Roadmap).filter(
            Roadmap.student_id == student_id,
            Roadmap.status == "ACTIVE"
        ).all()
        version = len(existing_roadmaps) + 1
        for rm in existing_roadmaps:
            rm.status = "SUPERSEDED"

        roadmap_id = f"rdm_{uuid.uuid4().hex[:12]}"
        new_roadmap = Roadmap(
            roadmap_id=roadmap_id,
            student_id=student_id,
            version=version,
            status="ACTIVE",
            trigger_event=trigger_event,
            created_at=datetime.datetime.utcnow()
        )
        self.db.add(new_roadmap)
        self.db.flush()

        # Rank all priorities
        ranked_priorities = self.priority_engine.rank_all_priorities(student_id)

        masteries = self.db.query(StudentConceptMastery).filter(
            StudentConceptMastery.student_id == student_id
        ).all()
        mastery_map = {m.concept_id: m for m in masteries}

        actions = []
        visited_concepts = set()

        for p in ranked_priorities:
            if len(actions) >= max_actions:
                break

            target_cid = p["concept_id"]
            if target_cid in visited_concepts:
                continue

            # Check prerequisite chain
            prereq_res = self.prereq_resolver.analyze_prerequisite_chain(student_id, target_cid)

            # If there are broken prerequisites, insert the broken prerequisite first
            if prereq_res["has_prerequisite_gaps"]:
                for broken in prereq_res["broken_prerequisites"]:
                    b_cid = broken["concept_id"]
                    if b_cid not in visited_concepts and len(actions) < max_actions:
                        visited_concepts.add(b_cid)
                        b_m_rec = mastery_map.get(b_cid)
                        b_mastery = b_m_rec.mastery if b_m_rec else 0.0
                        b_risk = b_m_rec.forgetting_risk if b_m_rec else 0.0

                        action_details = self.determine_action_type(b_mastery, b_risk, exam=exam_id)
                        node_name = broken["name"]

                        exam_prefix = f"[{exam_id} Prerequisite Fix]"
                        action = RoadmapAction(
                            roadmap_id=roadmap_id,
                            sequence_order=len(actions) + 1,
                            action_type=action_details["action_type"],
                            concept_id=b_cid,
                            priority_score=0.95,
                            reasons=[
                                f"{exam_prefix} Root foundational gap blocking '{p['concept_name']}'",
                                f"Current mastery {int(b_mastery * 100)}% (Requires >= 70% to unlock downstream topics)",
                                f"Strategy: {action_details.get('strategy', 'Remediate foundation')}"
                            ],
                            target_questions_count=action_details["questions_count"],
                            estimated_minutes=action_details["estimated_minutes"],
                            target_difficulty=action_details["target_difficulty"],
                            is_completed=False
                        )
                        self.db.add(action)
                        actions.append(action)

            # Now add the target concept itself if room exists
            if target_cid not in visited_concepts and len(actions) < max_actions:
                visited_concepts.add(target_cid)
                m_rec = mastery_map.get(target_cid)
                mastery = m_rec.mastery if m_rec else 0.0
                forgetting_risk = m_rec.forgetting_risk if m_rec else 0.0

                action_details = self.determine_action_type(mastery, forgetting_risk, exam=exam_id)
                exam_prefix = f"[{exam_id} Priority Action]"

                action = RoadmapAction(
                    roadmap_id=roadmap_id,
                    sequence_order=len(actions) + 1,
                    action_type=action_details["action_type"],
                    concept_id=target_cid,
                    priority_score=p["priority_score"],
                    reasons=[f"{exam_prefix} {r}" for r in p["reasons"][:2]] + [f"Strategy: {action_details.get('strategy', 'Standard target')}"] ,
                    target_questions_count=action_details["questions_count"],
                    estimated_minutes=action_details["estimated_minutes"],
                    target_difficulty=action_details["target_difficulty"],
                    is_completed=False
                )
                self.db.add(action)
                actions.append(action)

        # Log Roadmap Generated Event
        EventCollector.log_event(
            db=self.db,
            student_id=student_id,
            session_id="system",
            event_type="ROADMAP_OPENED",
            resource_id=roadmap_id,
            metadata={"version": version, "actions_count": len(actions)}
        )

        self.db.commit()
        return new_roadmap
