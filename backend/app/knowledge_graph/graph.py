import networkx as nx
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.models.schema import Concept, Prerequisite, Subject, Chapter, Topic

class CurriculumGraph:
    """
    NetworkX-based Knowledge Graph representing curriculum concepts and prerequisite dependencies.
    """
    def __init__(self, db: Session, exam_id: Optional[str] = None):
        self.db = db
        self.exam_id = exam_id
        self.graph = nx.DiGraph()
        self._build_graph()

    def _build_graph(self):
        # Query concepts filtered by exam if specified
        query = self.db.query(Concept)
        if self.exam_id:
            query = query.join(Topic).join(Chapter).join(Subject).filter(Subject.exam_id == self.exam_id)

        concepts = query.all()
        for c in concepts:
            sub_name = c.topic.chapter.subject.name if (c.topic and c.topic.chapter and c.topic.chapter.subject) else "General"
            ch_name = c.topic.chapter.name if (c.topic and c.topic.chapter) else "General"
            ch_id = c.topic.chapter_id if c.topic else "ch_gen"
            top_name = c.topic.name if c.topic else "General"

            self.graph.add_node(
                c.concept_id,
                name=c.name,
                subject=sub_name,
                chapter_id=ch_id,
                chapter_name=ch_name,
                topic_id=c.topic_id,
                topic_name=top_name,
                estimated_minutes=c.estimated_minutes,
                exam_relevance=c.exam_relevance,
                difficulty_weight=c.difficulty_weight,
                description=c.description
            )

        # Query prerequisites
        concept_ids = set(self.graph.nodes())
        prereqs = self.db.query(Prerequisite).all()
        for p in prereqs:
            if p.from_concept_id in concept_ids and p.to_concept_id in concept_ids:
                self.graph.add_edge(
                    p.from_concept_id,
                    p.to_concept_id,
                    strength=p.strength,
                    relationship=p.relationship_type,
                    description=p.description
                )

    def get_direct_prerequisites(self, concept_id: str) -> List[str]:
        """Returns direct prerequisite parent nodes for a concept."""
        if concept_id not in self.graph:
            return []
        return list(self.graph.predecessors(concept_id))

    def get_all_prerequisites(self, concept_id: str) -> List[str]:
        """Returns all ancestral prerequisite nodes in topological order."""
        if concept_id not in self.graph:
            return []
        ancestors = nx.ancestors(self.graph, concept_id)
        if not ancestors:
            return []
        # Return ancestors sorted in topological order
        subgraph = self.graph.subgraph(ancestors | {concept_id})
        try:
            topo = list(nx.topological_sort(subgraph))
            return [node for node in topo if node != concept_id]
        except nx.NetworkXUnfeasible:
            return list(ancestors)

    def get_dependents(self, concept_id: str) -> List[str]:
        """Returns downstream concept nodes that depend on this concept."""
        if concept_id not in self.graph:
            return []
        return list(self.graph.successors(concept_id))

    def get_all_dependents(self, concept_id: str) -> List[str]:
        """Returns all descendant concepts in the prerequisite graph."""
        if concept_id not in self.graph:
            return []
        return list(nx.descendants(self.graph, concept_id))

    def get_prerequisite_impact(self, concept_id: str) -> float:
        """Calculates impact score (0.1 to 1.0) based on how many concepts this unlocks."""
        if concept_id not in self.graph:
            return 0.5
        descendants = nx.descendants(self.graph, concept_id)
        total_nodes = len(self.graph.nodes)
        if total_nodes <= 1:
            return 0.5
        direct_out = len(list(self.graph.successors(concept_id)))
        downstream_ratio = len(descendants) / max(total_nodes - 1, 1)
        impact = 0.4 * min(direct_out / 3.0, 1.0) + 0.6 * downstream_ratio
        return round(min(max(impact, 0.1), 1.0), 3)

    def export_graph_json(self, student_masteries: Optional[Dict[str, float]] = None) -> Dict[str, Any]:
        """Exports nodes and edges formatted for visual graph rendering (e.g. Vis.js / Canvas)."""
        nodes = []
        edges = []
        masteries = student_masteries or {}

        for node_id, data in self.graph.nodes(data=True):
            m = masteries.get(node_id, 0.0)
            status = "mastered" if m >= 0.70 else ("developing" if m >= 0.40 else "weak")
            nodes.append({
                "id": node_id,
                "label": data.get("name", node_id),
                "mastery": m,
                "status": status,
                "subject": data.get("subject", "General"),
                "chapter_id": data.get("chapter_id", "ch_gen"),
                "chapter_name": data.get("chapter_name", "General"),
                "topic_id": data.get("topic_id", "top_gen"),
                "topic_name": data.get("topic_name", "General"),
                "exam_relevance": data.get("exam_relevance", 0.8),
                "difficulty_weight": data.get("difficulty_weight", 0.5),
                "estimated_minutes": data.get("estimated_minutes", 45)
            })

        for u, v, data in self.graph.edges(data=True):
            edges.append({
                "from": u,
                "to": v,
                "strength": data.get("strength", 1.0),
                "relationship": data.get("relationship", "prerequisite")
            })

        return {
            "exam": self.exam_id or "ALL",
            "nodes": nodes,
            "edges": edges
        }
