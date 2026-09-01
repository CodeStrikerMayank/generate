from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from backend.app.database.connection import get_db
from backend.app.models.schema import Exam, Subject, Chapter, Topic, Concept, Prerequisite, StudentConceptMastery
from backend.app.knowledge_graph.graph import CurriculumGraph

router = APIRouter(prefix="/curriculum", tags=["Curriculum & Knowledge Graph"])

@router.get("/exams")
def get_all_exams(db: Session = Depends(get_db)):
    exams = db.query(Exam).all()
    return [{"exam_id": e.exam_id, "name": e.name, "tracks": e.tracks} for e in exams]

@router.get("/tree/{exam_id}")
def get_curriculum_tree(
    exam_id: str,
    student_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    exam = db.query(Exam).filter(Exam.exam_id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found.")

    mastery_map = {}
    if student_id:
        masteries = db.query(StudentConceptMastery).filter(StudentConceptMastery.student_id == student_id).all()
        mastery_map = {m.concept_id: {"mastery": m.mastery, "confidence": m.confidence} for m in masteries}

    tree = {
        "exam_id": exam.exam_id,
        "name": exam.name,
        "tracks": exam.tracks,
        "subjects": []
    }

    subjects = db.query(Subject).filter(Subject.exam_id == exam_id).all()
    for sub in subjects:
        sub_data = {"subject_id": sub.subject_id, "name": sub.name, "chapters": []}
        for ch in sub.chapters:
            ch_data = {"chapter_id": ch.chapter_id, "name": ch.name, "topics": []}
            for tp in ch.topics:
                tp_data = {"topic_id": tp.topic_id, "name": tp.name, "concepts": []}
                for con in tp.concepts:
                    m_info = mastery_map.get(con.concept_id, {"mastery": 0.0, "confidence": 0.10})
                    tp_data["concepts"].append({
                        "concept_id": con.concept_id,
                        "name": con.name,
                        "estimated_minutes": con.estimated_minutes,
                        "exam_relevance": con.exam_relevance,
                        "difficulty_weight": con.difficulty_weight,
                        "description": con.description,
                        "mastery": m_info["mastery"],
                        "confidence": m_info["confidence"]
                    })
                ch_data["topics"].append(tp_data)
            sub_data["chapters"].append(ch_data)
        tree["subjects"].append(sub_data)

    return tree

@router.get("/graph/{exam_id}")
def get_knowledge_graph(
    exam_id: str,
    student_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    graph = CurriculumGraph(db, exam_id=exam_id)
    mastery_dict = {}
    if student_id:
        masteries = db.query(StudentConceptMastery).filter(StudentConceptMastery.student_id == student_id).all()
        mastery_dict = {m.concept_id: m.mastery for m in masteries}

    return graph.export_graph_json(student_masteries=mastery_dict)
