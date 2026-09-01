/**
 * UPSC Mains Written Response & Rubric Studio Controller.
 */
const UPSCStudioController = {
  questions: [],
  selectedQuestion: null,
  timerSeconds: 0,
  timerInterval: null,

  async initStudio() {
    try {
      this.questions = await API.getUPSCQuestions();
      this.renderQuestionList();
    } catch (err) {
      console.error('Failed to load UPSC questions', err);
    }
  },

  renderQuestionList() {
    const listElem = document.getElementById('upscQuestionList');
    if (!listElem) return;

    if (this.questions.length === 0) {
      listElem.innerHTML = `<div style="color: var(--text-secondary); padding: 1rem;">No descriptive questions loaded.</div>`;
      return;
    }

    listElem.innerHTML = this.questions.map((q, i) => `
      <div class="glass-card" style="margin-bottom: 1rem; cursor: pointer; border-color: ${this.selectedQuestion && this.selectedQuestion.question_id === q.question_id ? 'var(--accent-primary)' : 'var(--border-color)'};" onclick="UPSCStudioController.selectQuestion(${i})">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span class="nba-tag">${q.paper || 'MAINS'}</span>
          <span class="reason-tag">Diff: ${Math.round(q.difficulty * 100)}%</span>
        </div>
        <div style="font-size: 0.95rem; font-weight: 600; line-height: 1.5;">${q.content}</div>
      </div>
    `).join('');

    if (!this.selectedQuestion && this.questions.length > 0) {
      this.selectQuestion(0);
    }
  },

  selectQuestion(index) {
    this.selectedQuestion = this.questions[index];
    this.renderQuestionList();

    const promptElem = document.getElementById('upscSelectedPrompt');
    const editorElem = document.getElementById('upscAnswerInput');
    const feedbackBox = document.getElementById('upscFeedbackBox');

    if (promptElem) promptElem.innerText = this.selectedQuestion.content;
    if (editorElem) editorElem.value = '';
    if (feedbackBox) feedbackBox.style.display = 'none';

    this.startWritingTimer();
  },

  startWritingTimer() {
    clearInterval(this.timerInterval);
    this.timerSeconds = 0;
    const timerDisplay = document.getElementById('upscWritingTimer');

    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
      const mins = Math.floor(this.timerSeconds / 60);
      const secs = this.timerSeconds % 60;
      if (timerDisplay) {
        timerDisplay.innerText = `⏱ ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      }
    }, 1000);
  },

  updateWordCount() {
    const editor = document.getElementById('upscAnswerInput');
    const countDisplay = document.getElementById('upscWordCount');
    if (!editor || !countDisplay) return;

    const words = editor.value.trim().split(/\s+/).filter(w => w.length > 0);
    countDisplay.innerText = `${words.length} Words`;
  },

  async submitAnswer() {
    if (!AppState.student) {
      alert('Please register or log in first.');
      return;
    }
    if (!this.selectedQuestion) return;

    const editor = document.getElementById('upscAnswerInput');
    const text = editor ? editor.value.trim() : '';

    if (text.length < 20) {
      alert('Please write a substantial response before submitting.');
      return;
    }

    clearInterval(this.timerInterval);

    try {
      const result = await API.submitUPSCAnswer(
        AppState.student.student_id,
        this.selectedQuestion.question_id,
        text,
        this.timerSeconds
      );
      this.renderRubricFeedback(result);
    } catch (err) {
      alert('Submission error: ' + err.message);
    }
  },

  renderRubricFeedback(result) {
    const box = document.getElementById('upscFeedbackBox');
    if (!box) return;

    const pillars = Object.entries(result.rubric_scores || {}).map(([key, val]) => `
      <div class="rubric-pillar">
        <div class="rubric-name">${key.replace(/_/g, ' ')}</div>
        <div class="rubric-score">${val}</div>
      </div>
    `).join('');

    box.innerHTML = `
      <h3 style="font-size: 1.2rem; margin-bottom: 0.75rem; color: #fff;">Evaluation Feedback & Rubric Scores</h3>
      <div style="display: flex; gap: 1.5rem; margin-bottom: 1rem;">
        <div>
          <span style="font-size: 0.8rem; color: var(--text-secondary);">TOTAL SCORE</span>
          <div style="font-size: 2rem; font-weight: 800; color: var(--accent-cyan);">${result.total_score} / ${result.max_score}</div>
        </div>
        <div>
          <span style="font-size: 0.8rem; color: var(--text-secondary);">EVALUATOR</span>
          <div style="font-size: 1rem; font-weight: 700; color: #fff; margin-top: 6px;">${result.evaluator_type}</div>
        </div>
      </div>
      <div class="rubric-grid">${pillars}</div>
      <div style="background: rgba(255,255,255,0.03); padding: 1rem; border-radius: var(--radius-sm); margin-top: 1rem; border: 1px solid var(--border-color); font-size: 0.9rem; line-height: 1.6;">
        ${result.ai_feedback_summary}
      </div>
    `;
    box.style.display = 'block';
  }
};
