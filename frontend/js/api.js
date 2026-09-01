/**
 * API client library for the Adaptive Student Intelligence & Roadmap Platform.
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

  async getUPSCQuestions() {
    const res = await fetch(`${API_BASE}/upsc/questions`);
    if (!res.ok) throw new Error('Failed to fetch UPSC questions');
    return res.json();
  },

  async submitUPSCAnswer(studentId, questionId, answerText, timeTakenSec) {
    const res = await fetch(`${API_BASE}/upsc/submit/${studentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question_id: questionId,
        answer_text: answerText,
        time_taken_seconds: timeTakenSec
      })
    });
    if (!res.ok) throw new Error('Failed to submit UPSC answer');
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
  }
};
