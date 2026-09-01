/**
 * Quiz & Assessment Testing Engine UI controller.
 */
const QuizController = {
  currentAttempt: null,
  currentIndex: 0,
  userResponses: new Map(),
  timerInterval: null,
  remainingSeconds: 0,

  async startTest(exam, type = 'DIAGNOSTIC', stage = 1, targetConcept = null) {
    if (!AppState.student) {
      alert('Please register or log in first.');
      return;
    }

    try {
      const data = await API.startAssessment(AppState.student.student_id, exam, type, stage, targetConcept);
      this.currentAttempt = data;
      this.currentIndex = 0;
      this.userResponses.clear();
      this.remainingSeconds = data.duration_minutes * 60;

      AppState.switchTab('assessment');
      this.renderQuizArena();
      this.startTimer();
    } catch (err) {
      alert('Error starting assessment: ' + err.message);
    }
  },

  startTimer() {
    clearInterval(this.timerInterval);
    const timerElem = document.getElementById('quizTimer');

    this.timerInterval = setInterval(() => {
      this.remainingSeconds--;
      if (this.remainingSeconds <= 0) {
        clearInterval(this.timerInterval);
        alert('Time is up! Submitting your assessment automatically.');
        this.submitQuiz(true);
        return;
      }

      const mins = Math.floor(this.remainingSeconds / 60);
      const secs = this.remainingSeconds % 60;
      if (timerElem) {
        timerElem.innerText = `⏱ ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      }
    }, 1000);
  },

  renderQuizArena() {
    const container = document.getElementById('quizArena');
    if (!container || !this.currentAttempt) return;

    const q = this.currentAttempt.questions[this.currentIndex];
    const total = this.currentAttempt.questions.length;
    const selectedAns = this.userResponses.get(q.question_id) || null;

    let optionsHtml = '';
    if (q.options) {
      optionsHtml = q.options.map(opt => `
        <div class="option-item ${selectedAns === opt.id ? 'selected' : ''}" onclick="QuizController.selectOption('${opt.id}')">
          <div class="opt-id">${opt.id}</div>
          <div class="opt-text">${opt.text}</div>
        </div>
      `).join('');
    }

    container.innerHTML = `
      <div class="quiz-container">
        <div class="quiz-header">
          <div>
            <span class="nba-tag">${this.currentAttempt.title}</span>
            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">
              Question ${this.currentIndex + 1} of ${total} • Subject: ${q.subject} • Concept: ${q.concept_id}
            </div>
          </div>
          <div id="quizTimer" class="quiz-timer">⏱ --:--</div>
        </div>

        <div class="glass-card question-card">
          <div class="q-meta">
            <span class="badge-learn">${q.skill.toUpperCase()}</span>
            <span class="reason-tag">Difficulty: ${Math.round(q.difficulty * 100)}%</span>
            <span class="reason-tag">Est. Time: ${q.estimated_time}s</span>
          </div>
          <div class="q-text">${q.content}</div>
          <div class="option-list">
            ${optionsHtml}
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <button class="btn-secondary" onclick="QuizController.prevQuestion()" ${this.currentIndex === 0 ? 'disabled' : ''}>
            ← Previous
          </button>
          <div style="display: flex; gap: 0.5rem;">
            ${this.currentAttempt.questions.map((_, i) => `
              <button class="exam-pill-btn ${i === this.currentIndex ? 'active' : ''}" onclick="QuizController.jumpTo(${i})">
                ${i + 1}
              </button>
            `).join('')}
          </div>
          ${this.currentIndex < total - 1 ? `
            <button class="btn-primary" onclick="QuizController.nextQuestion()">Next →</button>
          ` : `
            <button class="btn-primary" style="background: linear-gradient(135deg, #10b981, #059669);" onclick="QuizController.submitQuiz(false)">
              Submit Test ✓
            </button>
          `}
        </div>
      </div>
    `;
  },

  selectOption(optId) {
    const q = this.currentAttempt.questions[this.currentIndex];
    this.userResponses.set(q.question_id, optId);
    this.renderQuizArena();
  },

  nextQuestion() {
    if (this.currentIndex < this.currentAttempt.questions.length - 1) {
      this.currentIndex++;
      this.renderQuizArena();
    }
  },

  prevQuestion() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.renderQuizArena();
    }
  },

  jumpTo(index) {
    this.currentIndex = index;
    this.renderQuizArena();
  },

  async submitQuiz(isAuto = false) {
    clearInterval(this.timerInterval);
    const responsesPayload = this.currentAttempt.questions.map(q => ({
      question_id: q.question_id,
      student_answer: this.userResponses.get(q.question_id) || null,
      time_taken_seconds: q.estimated_time,
      confidence_estimate: 0.75
    }));

    try {
      const result = await API.submitAssessment(this.currentAttempt.attempt_id, responsesPayload);
      this.renderResultModal(result);
      // Refresh user roadmap and stats
      AppState.refreshAllData();
    } catch (err) {
      alert('Submission error: ' + err.message);
    }
  },

  renderResultModal(result) {
    const modal = document.getElementById('resultModal');
    const content = document.getElementById('resultModalContent');
    if (!modal || !content) return;

    let itemsHtml = result.items_feedback.map(item => `
      <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 1rem; margin-bottom: 0.75rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <span style="font-weight: 700; color: ${item.is_correct ? 'var(--accent-success)' : 'var(--accent-danger)'}">
            ${item.is_correct ? '✓ Correct' : '✗ Incorrect'}
          </span>
          <span class="reason-tag">${item.error_type ? item.error_type.replace('_', ' ') : 'Mastered'}</span>
        </div>
        <div style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 0.4rem;">
          Your Answer: <strong>${item.student_answer || 'Skipped'}</strong> • Correct: <strong>${item.correct_answer}</strong>
        </div>
        <div style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5;">
          ${item.explanation}
        </div>
        ${item.distractor_note ? `
          <div style="font-size: 0.8rem; color: #fca5a5; margin-top: 0.35rem;">
            💡 Diagnostic Note: ${item.distractor_note}
          </div>
        ` : ''}
      </div>
    `).join('');

    content.innerHTML = `
      <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Assessment Completed!</h2>
      <div style="display: flex; gap: 1.5rem; margin: 1.25rem 0; padding: 1rem; background: rgba(99,102,241,0.1); border-radius: var(--radius-sm); border: 1px solid var(--border-highlight);">
        <div>
          <div style="font-size: 0.8rem; color: var(--text-secondary);">SCORE</div>
          <div style="font-size: 1.8rem; font-weight: 800; color: #fff;">${result.score_percentage}%</div>
        </div>
        <div>
          <div style="font-size: 0.8rem; color: var(--text-secondary);">ACCURACY</div>
          <div style="font-size: 1.8rem; font-weight: 800; color: var(--accent-success);">${result.correct_count} / ${result.total_questions}</div>
        </div>
        <div>
          <div style="font-size: 0.8rem; color: var(--text-secondary);">ROADMAP STATUS</div>
          <div style="font-size: 1rem; font-weight: 700; color: var(--accent-cyan); margin-top: 0.4rem;">Recalibrated & Updated</div>
        </div>
      </div>
      <h3 style="font-size: 1.1rem; margin-bottom: 0.75rem;">Question Feedback & Error Diagnostics:</h3>
      ${itemsHtml}
      <div style="text-align: right; margin-top: 1.5rem;">
        <button class="btn-primary" onclick="document.getElementById('resultModal').classList.remove('active'); AppState.switchTab('roadmap');">
          View Updated Roadmap →
        </button>
      </div>
    `;

    modal.classList.add('active');
  }
};
