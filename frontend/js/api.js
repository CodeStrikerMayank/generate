/**
 * API client library for the Adaptive Student Intelligence & Roadmap Platform (JEE Main & NEET).
 */
const API_BASE = '/api';

const API = {
  async register(data) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Registration failed');
    return res.json();
  },

  async login(data) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Login failed');
    return res.json();
  },

  async getProfile(studentId) {
    const res = await fetch(`${API_BASE}/auth/profile/${studentId}`);
    if (!res.ok) throw new Error('Failed to load student profile');
    return res.json();
  },

  async getCurriculumTree(examId, studentId) {
    const url = `${API_BASE}/curriculum/tree/${examId}${studentId ? '?student_id=' + studentId : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load curriculum');
    return res.json();
  },

  async getKnowledgeGraph(examId, studentId) {
    const url = `${API_BASE}/curriculum/graph/${examId}${studentId ? '?student_id=' + studentId : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load knowledge graph');
    return res.json();
  },

  async getActiveRoadmap(studentId) {
    const res = await fetch(`${API_BASE}/roadmap/active/${studentId}`);
    if (!res.ok) throw new Error('Failed to load active roadmap');
    return res.json();
  },

  async getNextAction(studentId) {
    const res = await fetch(`${API_BASE}/roadmap/next-action/${studentId}`);
    if (res.status === 404) return null; // No action available yet — normal state
    if (!res.ok) throw new Error('Failed to load next best action');
    return res.json();
  },

  async getWeaknesses(studentId) {
    const res = await fetch(`${API_BASE}/roadmap/weaknesses/${studentId}`);
    if (!res.ok) throw new Error('Failed to load weaknesses');
    return res.json();
  },

  async getPriorities(studentId) {
    const res = await fetch(`${API_BASE}/roadmap/priorities/${studentId}`);
    if (!res.ok) throw new Error('Failed to load priorities');
    return res.json();
  },

  async regenerateRoadmap(studentId) {
    const res = await fetch(`${API_BASE}/roadmap/regenerate/${studentId}`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to regenerate roadmap');
    return res.json();
  },

  async startAssessment(studentId, exam, assessmentType = 'DIAGNOSTIC', stage = 1, targetConceptId = null) {
    const res = await fetch(`${API_BASE}/assessments/start?student_id=${studentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exam,
        assessment_type: assessmentType,
        stage,
        duration_minutes: 20,
        target_concept_id: targetConceptId
      })
    });
    if (!res.ok) throw new Error('Failed to start assessment');
    return res.json();
  },

  async startDrill(studentId, exam, subject, chapterId = null) {
    const url = `${API_BASE}/assessments/start-drill?student_id=${studentId}&subject=${encodeURIComponent(subject)}&exam=${exam}${chapterId ? '&chapter_id=' + encodeURIComponent(chapterId) : ''}`;
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to start topic drill');
    return res.json();
  },

  async startFullScan(studentId, exam) {
    const url = `${API_BASE}/assessments/start-full-scan?student_id=${studentId}&exam=${exam}`;
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to start full scan');
    return res.json();
  },

  async startAdvanced(studentId, exam, subject = null) {
    const url = `${API_BASE}/assessments/start-advanced?student_id=${studentId}&exam=${exam}${subject ? '&subject=' + encodeURIComponent(subject) : ''}`;
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to start advanced challenge');
    return res.json();
  },

  async submitAssessment(attemptId, responses) {
    const res = await fetch(`${API_BASE}/assessments/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attempt_id: attemptId,
        responses
      })
    });
    if (!res.ok) throw new Error('Failed to submit assessment');
    return res.json();
  },

  async getAssessmentHistory(studentId) {
    const res = await fetch(`${API_BASE}/assessments/history/${studentId}`);
    if (!res.ok) throw new Error('Failed to fetch history');
    return res.json();
  },

  async chatAI(studentId, prompt, conceptId = null) {
    const res = await fetch(`${API_BASE}/ai/chat/${studentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        concept_id: conceptId,
        include_student_state: true
      })
    });
    if (!res.ok) throw new Error('AI service error');
    return res.json();
  },

  async generatePracticeQuestion(exam, subject, chapter, conceptId, difficulty = 0.6) {
    const res = await fetch(`${API_BASE}/ai/generate-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exam,
        subject,
        chapter,
        concept_id: conceptId,
        difficulty
      })
    });
    if (!res.ok) throw new Error('Failed to generate practice question');
    return res.json();
  },

  async getTelemetryStream(studentId) {
    const res = await fetch(`${API_BASE}/telemetry/stream/${studentId}`);
    if (!res.ok) throw new Error('Failed to load telemetry');
    return res.json();
  },

  async getReviewQueue(studentId) {
    const res = await fetch(`${API_BASE}/supporting/review-queue/${studentId}`);
    if (!res.ok) throw new Error('Failed to load review queue');
    return res.json();
  },

  async getErrorTrends(studentId) {
    const res = await fetch(`${API_BASE}/supporting/error-trends/${studentId}`);
    if (!res.ok) throw new Error('Failed to load error trends');
    return res.json();
  },

  async getReportCard(studentId) {
    const res = await fetch(`${API_BASE}/supporting/report-card/${studentId}`);
    if (!res.ok) throw new Error('Failed to load report card');
    return res.json();
  }
};
