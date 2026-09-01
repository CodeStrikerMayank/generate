from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.knowledge_graph.graph import CurriculumGraph
from backend.app.models.schema import StudentConceptMastery

class PrerequisiteResolver:
    """
    Analyzes prerequisite dependency chains to detect root-cause knowledge deficiencies.
    Prevents assigning advanced practice when foundational parent concepts are broken.
    """
    def __init__(self, db: Session, graph: CurriculumGraph):
        self.db = db
        self.graph = graph

    def analyze_prerequisite_chain(
        self,
        student_id: str,
        target_concept_id: str,
        mastery_threshold: float = 0.60
    ) -> Dict[str, Any]:
        """
        Traces the topological prerequisite chain for a target concept and evaluates
        the student's mastery of all foundational ancestors.
        """
        ancestors = self.graph.get_all_prerequisites(target_concept_id)
        if not ancestors:
            return {
                "target_concept_id": target_concept_id,
                "has_prerequisite_gaps": False,
                "broken_prerequisites": [],
                "recommended_first_concept": target_concept_id,
                "prerequisite_chain": []
            }

        # Query student masteries for all nodes in the chain
        mastery_records = self.db.query(StudentConceptMastery).filter(
            StudentConceptMastery.student_id == student_id,
            StudentConceptMastery.concept_id.in_(ancestors + [target_concept_id])
        ).all()
        mastery_map = {m.concept_id: m.mastery for m in mastery_records}

        broken_prereqs = []
        for anc_id in ancestors:
            m = mastery_map.get(anc_id, 0.0)
            if m < mastery_threshold:
                node_data = self.graph.graph.nodes.get(anc_id, {})
                broken_prereqs.append({
                    "concept_id": anc_id,
                    "name": node_data.get("name", anc_id),
                    "mastery": round(m, 3),
                    "required_threshold": mastery_threshold
                })

        has_gaps = len(broken_prereqs) > 0
        recommended_first = broken_prereqs[0]["concept_id"] if has_gaps else target_concept_id

        chain_summary = []
        for cid in ancestors + [target_concept_id]:
            node_data = self.graph.graph.nodes.get(cid, {})
            chain_summary.append({
                "concept_id": cid,
                "name": node_data.get("name", cid),
                "mastery": round(mastery_map.get(cid, 0.0), 3),
                "is_gap": mastery_map.get(cid, 0.0) < mastery_threshold
            })

        return {
            "target_concept_id": target_concept_id,
            "has_prerequisite_gaps": has_gaps,
            "broken_prerequisites": broken_prereqs,
            "recommended_first_concept": recommended_first,
            "prerequisite_chain": chain_summary
        }
