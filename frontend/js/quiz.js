/**
 * Quiz & Assessment Testing Engine UI Controller
 * Adaptive Student Intelligence & Dynamic Roadmap Engine
 * JEE Main & NEET — PYQ Adapted Assessments & AI Skill Extraction
 */
const QuizController = {
  currentAttempt: null,
  currentIndex: 0,
  userResponses: new Map(),
  _shuffledOptions: new Map(), // question_id → shuffled option array
  timerInterval: null,
  remainingSeconds: 0,
  keyHandlerBound: false,

  /** Shuffle an array using Fisher-Yates (seeded by questionId for stability within a session) */
  _shuffleArray(arr, seed) {
    const a = [...arr];
    let s = seed;
    for (let i = a.length - 1; i > 0; i--) {
      s = ((s * 1664525 + 1013904223) >>> 0);
      const j = s % (i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  /** Get or create the shuffled options for a question (stable within a session) */
  _getShuffledOptions(q) {
    if (!q.options) return [];
    if (!this._shuffledOptions.has(q.question_id)) {
      // Seed from question_id string hash for session-stable shuffling
      const seed = q.question_id.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 17);
      this._shuffledOptions.set(q.question_id, this._shuffleArray(q.options, seed));
    }
    return this._shuffledOptions.get(q.question_id);
  },

  /** Map difficulty [0..1] to a toughness label + color */
  _getToughnessInfo(difficulty) {
    if (difficulty < 0.25) return { label: '🟢 Easy', color: 'var(--accent-emerald)', meter: 1 };
    if (difficulty < 0.45) return { label: '🔵 Medium', color: 'var(--accent-cyan)', meter: 2 };
    if (difficulty < 0.65) return { label: '🟡 Hard', color: 'var(--accent-amber)', meter: 3 };
    if (difficulty < 0.82) return { label: '🔴 Expert', color: 'var(--accent-rose)', meter: 4 };
    return { label: '☠️ Nightmare', color: '#e879f9', meter: 5 };
  },

  async startTest(exam, type = 'DIAGNOSTIC', stage = 1, targetConcept = null) {
    if (!AppState.student) {
      AppState.showDiagnosticGateway();
      return;
    }

    try {
      const data = await API.startAssessment(AppState.student.student_id, exam, type, stage, targetConcept);
      this.currentAttempt = data;
      this.currentIndex = 0;
      this.userResponses.clear();
      this._shuffledOptions.clear(); // Reset shuffles for new attempt
      this.remainingSeconds = (data.duration_minutes || 20) * 60;

      AppState.switchTab('quiz');
      AppState.enterQuizFullscreen();   // ← lock screen + fullscreen during quiz
      this.bindKeyboardShortcuts();
      this.renderQuizArena();
      this.startTimer();
    } catch (err) {
      alert('Error starting assessment: ' + err.message);
    }
  },

  async startDrill(subject, chapterId = null) {
    if (!AppState.student) return;
    try {
      const modal = document.getElementById('resultModal');
      if (modal) modal.classList.remove('active');

      const data = await API.startDrill(AppState.student.student_id, AppState.currentExam, subject, chapterId);
      this.currentAttempt = data;
      this.currentIndex = 0;
      this.userResponses.clear();
      this._shuffledOptions.clear();
      this.remainingSeconds = (data.duration_minutes || 15) * 60;

      AppState.switchTab('quiz');
      AppState.enterQuizFullscreen();
      this.bindKeyboardShortcuts();
      this.renderQuizArena();
      this.startTimer();
      AppState._toast(`🎯 Started Topic Drill for ${subject}!`, 'info');
    } catch (err) {
      alert('Error starting topic drill: ' + err.message);
    }
  },

  async startFullScan() {
    if (!AppState.student) return;
    try {
      const modal = document.getElementById('resultModal');
      if (modal) modal.classList.remove('active');

      const data = await API.startFullScan(AppState.student.student_id, AppState.currentExam);
      this.currentAttempt = data;
      this.currentIndex = 0;
      this.userResponses.clear();
      this._shuffledOptions.clear();
      this.remainingSeconds = (data.duration_minutes || 40) * 60;

      AppState.switchTab('quiz');
      AppState.enterQuizFullscreen();
      this.bindKeyboardShortcuts();
      this.renderQuizArena();
      this.startTimer();
      AppState._toast(`🔬 Started Full Syllabus Deep Scan (15 Qs)!`, 'info');
    } catch (err) {
      alert('Error starting full scan: ' + err.message);
    }
  },

  async startAdvancedChallenge(subject = null) {
    if (!AppState.student) return;
    try {
      const modal = document.getElementById('resultModal');
      if (modal) modal.classList.remove('active');

      const data = await API.startAdvanced(AppState.student.student_id, AppState.currentExam, subject);
      this.currentAttempt = data;
      this.currentIndex = 0;
      this.userResponses.clear();
      this._shuffledOptions.clear();
      this.remainingSeconds = (data.duration_minutes || 20) * 60;

      AppState.switchTab('quiz');
      AppState.enterQuizFullscreen();
      this.bindKeyboardShortcuts();
      this.renderQuizArena();
      this.startTimer();
      AppState._toast(`🏆 Started Tier 4 Advanced Mastery Challenge!`, 'success');
    } catch (err) {
      alert('Error starting advanced challenge: ' + err.message);
    }
  },

  bindKeyboardShortcuts() {
    if (this.keyHandlerBound) return;
    window.addEventListener('keydown', (e) => {
      // Only process when quiz tab is active and attempt exists
      const pane = document.getElementById('pane_assessment');
      if (!pane || !pane.classList.contains('active') || !this.currentAttempt) return;

      // Avoid typing inside inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      const q = this.currentAttempt.questions[this.currentIndex];
      if (!q || !q.options) return;

      // Option selection via 1-4 (maps to shuffled positions) or A-D (maps to original IDs)
      const key = e.key.toUpperCase();
      const shuffled = this._getShuffledOptions(q);
      if (['1', '2', '3', '4'].includes(key)) {
        const idx = parseInt(key, 10) - 1;
        if (shuffled[idx]) this.selectOption(shuffled[idx].id);
      } else if (['A', 'B', 'C', 'D'].includes(key)) {
        const found = shuffled.find((opt, i) => String.fromCharCode(65 + i) === key);
        if (found) this.selectOption(found.id);
      } else if (e.key === 'ArrowRight') {
        this.nextQuestion();
      } else if (e.key === 'ArrowLeft') {
        this.prevQuestion();
      }
    });
    this.keyHandlerBound = true;
  },

  startTimer() {
    clearInterval(this.timerInterval);
    const timerElem = document.getElementById('quizTimer');

    this.timerInterval = setInterval(() => {
      this.remainingSeconds--;
      if (this.remainingSeconds <= 0) {
        clearInterval(this.timerInterval);
        alert('Time is up! Submitting your diagnostic assessment automatically.');
        this.submitQuiz(true);
        return;
      }

      const mins = Math.floor(this.remainingSeconds / 60);
      const secs = this.remainingSeconds % 60;
      if (timerElem) {
        timerElem.innerText = `⏱ ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        if (this.remainingSeconds < 180) {
          timerElem.style.color = 'var(--accent-rose)';
        } else {
          timerElem.style.color = 'var(--text-primary)';
        }
      }
    }, 1000);
  },

  renderQuizArena() {
    const container = document.getElementById('quizArena');
    if (!container || !this.currentAttempt) return;

    const q = this.currentAttempt.questions[this.currentIndex];
    const total = this.currentAttempt.questions.length;
    const selectedAns = this.userResponses.get(q.question_id) || null;
    const progressPct = Math.round(((this.currentIndex + 1) / total) * 100);
    const toughness = this._getToughnessInfo(q.difficulty || 0.5);
    const displayLabels = ['A','B','C','D','E'];

    let optionsHtml = '';
    if (q.options) {
      const shuffled = this._getShuffledOptions(q);
      optionsHtml = shuffled.map((opt, i) => `
        <div class="option-item ${selectedAns === opt.id ? 'selected' : ''}" onclick="QuizController.selectOption('${opt.id}')">
          <div class="opt-id">${displayLabels[i]}</div>
          <div class="opt-text">${opt.text}</div>
          <span style="margin-left:auto;font-size:0.68rem;color:var(--text-faint);font-family:var(--font-mono);">[${i+1}]</span>
        </div>
      `).join('');
    }

    const paperTag = q.paper ? q.paper.replace(/_/g, ' ') : 'PYQ';
    const isLast = (this.currentIndex === total - 1);
    const allAnswered = this.currentAttempt.questions.every(item => this.userResponses.has(item.question_id));

    container.innerHTML = `
      <div class="quiz-container" style="max-width:860px;margin:0 auto;">
        <!-- Header Row -->
        <div class="quiz-header" style="padding:0.75rem 0 0.5rem 0;">
          <div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <span class="nba-tag" style="margin:0;">${this.currentAttempt.title}</span>
              <span class="subject-pill ${q.subject}">${q.subject}</span>
              <span class="pyq-tag">📌 ${paperTag} (Data-Adapted)</span>
            </div>
            <div style="font-size:0.82rem;color:var(--text-secondary);margin-top:6px;">
              Question ${this.currentIndex + 1} of ${total} • Concept: <code style="color:var(--accent-cyan);">${q.concept_id}</code>
            </div>
          </div>
          <div id="quizTimer" class="quiz-timer" style="font-size:1.1rem;font-weight:700;font-family:var(--font-mono);">⏱ --:--</div>
        </div>

        <!-- Progress Bar -->
        <div class="quiz-progress-track">
          <div class="quiz-progress-fill" style="width:${progressPct}%;"></div>
        </div>

        <!-- Main Question Card -->
        <div class="glass-card question-card" style="margin-bottom:1.25rem;">
          <div class="q-meta" style="margin-bottom:0.85rem;display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
            <span class="badge-learn">${q.skill.toUpperCase()}</span>
            <span class="toughness-badge" style="background:rgba(0,0,0,0.3);border:1px solid ${toughness.color};color:${toughness.color};padding:2px 9px;border-radius:100px;font-size:0.72rem;font-weight:800;letter-spacing:0.04em;">${toughness.label}</span>
            <span class="reason-tag">⏱ Est. ${q.estimated_time}s</span>
            <span class="reason-tag">📊 ${Math.round(q.difficulty * 100)}% difficulty</span>
            <span style="margin-left:auto;display:flex;gap:2px;align-items:center;" title="Toughness level ${toughness.meter}/5">
              ${[1,2,3,4,5].map(n => `<span style="width:7px;height:14px;border-radius:2px;background:${n <= toughness.meter ? toughness.color : 'rgba(255,255,255,0.1)'};"></span>`).join('')}
            </span>
          </div>

          <div class="q-text" style="font-size:1.05rem;line-height:1.6;margin-bottom:1.25rem;white-space:pre-line;font-weight:500;">
            ${q.content}
          </div>

          ${q.image_url ? `
            <div class="q-image-container" style="margin-bottom:1.25rem;text-align:center;background:rgba(255,255,255,0.03);padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,0.08);">
              <img src="${q.image_url}" alt="Official Exam Question Problem Crop" style="max-width:100%;max-height:420px;object-fit:contain;border-radius:6px;" loading="lazy" />
              <div style="font-size:0.75rem;color:var(--text-faint);margin-top:6px;display:flex;align-items:center;justify-content:center;gap:5px;">
                <span>📷</span><span>Official Problem Diagram / Original Crop (Reja1/jee-neet-benchmark)</span>
              </div>
            </div>
          ` : ''}

          <div class="option-list">
            ${optionsHtml}
          </div>
        </div>

        <!-- Navigation Row -->
        <div style="display:flex;justify-content:space-between;align-items:center;gap:0.75rem;flex-wrap:wrap;">
          <button class="btn-secondary" onclick="QuizController.prevQuestion()" ${this.currentIndex === 0 ? 'disabled' : ''}>
            ← Previous
          </button>

          <!-- Question Pills -->
          <div style="display:flex;gap:0.35rem;flex-wrap:wrap;justify-content:center;">
            ${this.currentAttempt.questions.map((item, i) => {
              const isAnswered = this.userResponses.has(item.question_id);
              const isCurr = (i === this.currentIndex);
              let pillClass = 'exam-pill-btn';
              if (isCurr) pillClass += ' active';
              return `
                <button class="${pillClass}" style="${isAnswered && !isCurr ? 'border-color:var(--accent-emerald);color:var(--accent-emerald);' : ''}" onclick="QuizController.jumpTo(${i})" title="${item.subject}">
                  ${i + 1}${isAnswered ? '✓' : ''}
                </button>
              `;
            }).join('')}
          </div>

          <div style="display:flex;gap:0.5rem;">
            ${!isLast ? `
              <button class="btn-primary" onclick="QuizController.nextQuestion()">Next →</button>
            ` : ''}
            <button class="btn-primary" style="background:var(--grad-emerald);" onclick="QuizController.submitQuiz(false)">
              ${allAnswered ? 'Submit Diagnostic Assessment ✓' : 'Finish & Submit Test ✓'}
            </button>
          </div>
        </div>
      </div>
    `;
  },

  selectOption(optId) {
    if (!this.currentAttempt) return;
    const q = this.currentAttempt.questions[this.currentIndex];
    this.userResponses.set(q.question_id, optId);
    this.renderQuizArena();
  },

  nextQuestion() {
    if (this.currentAttempt && this.currentIndex < this.currentAttempt.questions.length - 1) {
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
    if (this.currentAttempt && index >= 0 && index < this.currentAttempt.questions.length) {
      this.currentIndex = index;
      this.renderQuizArena();
    }
  },

  async submitQuiz(isAuto = false) {
    clearInterval(this.timerInterval);
    if (!this.currentAttempt) return;

    const responsesPayload = this.currentAttempt.questions.map(q => ({
      question_id: q.question_id,
      student_answer: this.userResponses.get(q.question_id) || null,
      time_taken_seconds: q.estimated_time,
      confidence_estimate: 0.75
    }));

    try {
      const result = await API.submitAssessment(this.currentAttempt.attempt_id, responsesPayload);
      AppState.exitQuizFullscreen();          // ← unlock screen when done
      this.renderResultModal(result);
      AppState.markFirstQuizComplete();       // ← unlock all tabs after first quiz
      // Refresh dashboard, roadmap, graph
      await AppState.refreshAllData();
    } catch (err) {
      alert('Submission error: ' + err.message);
    }
  },

  renderResultModal(result) {
    const modal = document.getElementById('resultModal');
    const content = document.getElementById('resultModalContent');
    if (!modal || !content) return;

    // 1. Calculate subject breakdown
    const subjectStats = {};
    const qMap = {};
    if (this.currentAttempt && this.currentAttempt.questions) {
      this.currentAttempt.questions.forEach(q => { qMap[q.question_id] = q; });
    }

    result.items_feedback.forEach(item => {
      const q = qMap[item.question_id] || {};
      const sub = q.subject || 'General';
      if (!subjectStats[sub]) {
        subjectStats[sub] = { total: 0, correct: 0, subject: sub };
      }
      subjectStats[sub].total++;
      if (item.is_correct) subjectStats[sub].correct++;
    });

    const subjectColors = {
      'Physics': 'var(--accent-cyan)',
      'Chemistry': 'var(--accent-emerald)',
      'Mathematics': 'var(--accent-purple)',
      'Biology': 'var(--accent-amber)'
    };

    let subjectBarsHtml = Object.values(subjectStats).map(st => {
      const pct = Math.round((st.correct / Math.max(st.total, 1)) * 100);
      const col = subjectColors[st.subject] || 'var(--accent-primary)';
      let statusLabel = pct >= 75 ? '🟢 High Mastery' : (pct >= 50 ? '🟡 Moderate Mastery' : '🔴 Prerequisite Gap');
      return `
        <div style="margin-bottom:0.75rem;">
          <div class="skill-meter-row">
            <span style="font-weight:700;color:${col};">${st.subject}</span>
            <span style="font-size:0.75rem;color:var(--text-muted);">${statusLabel}</span>
            <span style="font-family:var(--font-mono);font-weight:700;">${st.correct}/${st.total} (${pct}%)</span>
          </div>
          <div class="skill-meter-track" style="margin:0;">
            <div class="skill-meter-fill" style="width:${pct}%;background:${col};"></div>
          </div>
        </div>
      `;
    }).join('');

    // 2. Cognitive Error Diagnoses
    const errorTypesCount = {};
    result.items_feedback.forEach(item => {
      if (!item.is_correct && item.error_type) {
        errorTypesCount[item.error_type] = (errorTypesCount[item.error_type] || 0) + 1;
      }
    });
    const errorEntries = Object.entries(errorTypesCount);

    let errorSummaryHtml = '';
    if (errorEntries.length > 0) {
      errorSummaryHtml = `
        <div style="background:rgba(244,63,94,0.08);border:1px solid rgba(244,63,94,0.25);border-radius:var(--radius-sm);padding:0.75rem 1rem;margin:1rem 0;">
          <div style="font-size:0.82rem;font-weight:800;color:var(--accent-rose);margin-bottom:4px;">
            ⚠️ Identified Cognitive Error Patterns:
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${errorEntries.map(([err, count]) => `
              <span class="reason-tag" style="background:rgba(244,63,94,0.15);color:var(--accent-rose);border-color:rgba(244,63,94,0.3);">
                ${err.replace(/_/g, ' ')} (${count})
              </span>
            `).join('')}
          </div>
        </div>
      `;
    } else {
      errorSummaryHtml = `
        <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:var(--radius-sm);padding:0.75rem 1rem;margin:1rem 0;">
          <div style="font-size:0.82rem;font-weight:800;color:var(--accent-emerald);">
            🎉 Flawless Execution! No critical error patterns detected.
          </div>
        </div>
      `;
    }

    // 3. Question-by-question feedback
    let itemsHtml = result.items_feedback.map((item, idx) => `
      <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:0.85rem 1rem;margin-bottom:0.65rem;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.35rem;">
          <span style="font-weight:800;font-size:0.85rem;color:${item.is_correct ? 'var(--accent-emerald)' : 'var(--accent-rose)'};">
            Q${idx+1}: ${item.is_correct ? '✓ Correct' : '✗ Incorrect'}
          </span>
          <span class="reason-tag" style="margin:0;">${item.error_type ? item.error_type.replace(/_/g, ' ') : 'Mastered'}</span>
        </div>
        <div style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:0.3rem;">
          Your Answer: <strong>${item.student_answer || 'Skipped'}</strong> • Correct: <strong style="color:var(--accent-emerald);">${item.correct_answer}</strong>
        </div>
        <div style="font-size:0.8rem;color:var(--text-muted);line-height:1.45;">
          ${item.explanation}
        </div>
        ${item.distractor_note ? `
          <div style="font-size:0.78rem;color:#fca5a5;margin-top:0.3rem;">
            💡 <em>Diagnostic Note: ${item.distractor_note}</em>
          </div>
        ` : ''}
      </div>
    `).join('');

    // Estimate IRT theta
    const thetaEst = (result.updated_masteries && result.updated_masteries.length > 0)
      ? (result.updated_masteries.reduce((a, b) => a + (b.irt_ability || 0), 0) / result.updated_masteries.length).toFixed(2)
      : '+0.00';

    content.innerHTML = `
      <div style="text-align:center;margin-bottom:1.25rem;">
        <div class="onboard-logo" style="width:48px;height:48px;font-size:1.5rem;margin-bottom:0.5rem;">🧠</div>
        <h2 style="font-size:1.5rem;font-weight:900;margin-bottom:0.25rem;">AI Cognitive Skills Extracted!</h2>
        <p style="color:var(--text-secondary);font-size:0.84rem;">
          Baseline diagnostic complete. Your responses have calibrated your Latent Ability and Prerequisite Graph.
        </p>
      </div>

      <!-- KPI Grid -->
      <div class="grid-4" style="margin-bottom:1rem;">
        <div class="glass-card stat-card" style="padding:0.75rem;">
          <div class="stat-label">Score</div>
          <div class="stat-val" style="font-size:1.35rem;color:#fff;">${result.score_percentage}%</div>
          <div class="stat-sub">${result.correct_count} of ${result.total_questions} correct</div>
        </div>
        <div class="glass-card stat-card" style="padding:0.75rem;">
          <div class="stat-label">Latent Ability (θ)</div>
          <div class="stat-val" style="font-size:1.35rem;color:var(--accent-cyan);">${thetaEst > 0 ? '+' : ''}${thetaEst}</div>
          <div class="stat-sub">Item Response Theory</div>
        </div>
        <div class="glass-card stat-card" style="padding:0.75rem;">
          <div class="stat-label">Total Time</div>
          <div class="stat-val" style="font-size:1.35rem;color:var(--accent-purple);">${Math.round(result.time_taken_seconds)}s</div>
          <div class="stat-sub">Avg ~${Math.round(result.time_taken_seconds / Math.max(result.total_questions,1))}s/q</div>
        </div>
        <div class="glass-card stat-card" style="padding:0.75rem;">
          <div class="stat-label">Roadmap Engine</div>
          <div class="stat-val" style="font-size:1.15rem;color:var(--accent-emerald);">Ready</div>
          <div class="stat-sub">Personalized Sequence</div>
        </div>
      </div>

      <!-- Subject Skill Profile -->
      <div class="glass-card" style="padding:1rem;margin-bottom:1rem;">
        <div style="font-size:0.88rem;font-weight:800;margin-bottom:0.65rem;color:var(--text-primary);">
          📊 Subject-by-Subject Skill Breakdown
        </div>
        ${subjectBarsHtml}
      </div>

      <!-- Cognitive Error Analysis -->
      ${errorSummaryHtml}

      <!-- Detailed Question Feedback -->
      <details style="margin:1rem 0;">
        <summary style="cursor:pointer;font-size:0.85rem;font-weight:700;color:var(--accent-neon);margin-bottom:0.5rem;">
          🔍 View Detailed Question-by-Question Solutions & Error Notes
        </summary>
        <div style="max-height:260px;overflow-y:auto;padding-right:4px;">
          ${itemsHtml}
        </div>
      </details>

      <!-- Tier 2 & Tier 3 Diagnostics Triggers -->
      ${result.weak_subjects && result.weak_subjects.length > 0 ? `
        <div style="background:rgba(244,63,94,0.08);border:1px solid rgba(244,63,94,0.25);border-radius:var(--radius-sm);padding:0.85rem 1rem;margin:1rem 0;">
          <div style="font-weight:800;font-size:0.85rem;color:var(--accent-rose);margin-bottom:0.5rem;">
            ⚠️ Weak Subject Identified (&lt;60% Accuracy) — Recommended Drill:
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
            ${result.weak_subjects.map(w => `
              <button class="btn-primary" style="background:var(--grad-rose);padding:0.45rem 0.85rem;font-size:0.8rem;border-radius:var(--radius-sm);" onclick="QuizController.startDrill('${w.subject}')">
                🎯 Launch 5-Q Drill: ${w.subject} (${w.accuracy_pct}%) →
              </button>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Tier 4 Advanced Challenge Trigger (if score >= 80%) -->
      ${(result.score_percentage >= 80 || result.advanced_challenge_eligible) ? `
        <div style="background:linear-gradient(135deg, rgba(168,85,247,0.12) 0%, rgba(99,102,241,0.1) 100%);border:1px solid rgba(168,85,247,0.35);border-radius:var(--radius-sm);padding:0.9rem 1rem;margin:1rem 0;">
          <div style="display:flex;align-items:center;gap:6px;font-weight:800;font-size:0.88rem;color:var(--accent-purple);margin-bottom:0.35rem;">
            <span>🏆</span> High Mastery Achieved (${result.score_percentage}%) — Tier 4 Challenge Unlocked!
          </div>
          <p style="font-size:0.78rem;color:var(--text-secondary);margin-bottom:0.65rem;line-height:1.45;">
            You have conquered standard-tier questions. Test your problem-solving against high-difficulty problems (0.75 – 0.92) designed to boost your Latent Ability (θ).
          </p>
          <button class="btn-primary glow-pulse" style="background:linear-gradient(135deg, #a855f7 0%, #6366f1 100%);padding:0.55rem 1rem;font-size:0.82rem;border-radius:var(--radius-sm);" onclick="QuizController.startAdvancedChallenge()">
            ⚡ Launch Tier 4 Advanced Mastery Challenge (6 Qs) →
          </button>
        </div>
      ` : ''}

      <div style="display:flex;gap:0.5rem;margin-top:0.75rem;">
        <button class="btn-secondary" style="flex:1;justify-content:center;font-size:0.85rem;padding:0.75rem;" onclick="QuizController.startFullScan()">
          🔬 15-Q Full Syllabus Scan
        </button>
        <button class="btn-primary glow-pulse" style="flex:2;justify-content:center;padding:0.75rem;font-size:0.95rem;background:var(--grad-hero);" onclick="QuizController.closeAndOpenRoadmap()">
          🗺️ Unlock My Personalized Roadmap →
        </button>
      </div>
    `;

    modal.classList.add('active');
  },

  closeAndOpenRoadmap() {
    const modal = document.getElementById('resultModal');
    if (modal) modal.classList.remove('active');

    AppState.switchTab('roadmap');
    AppState._toast('🗺️ Your custom AI study roadmap is active!', 'success');

    // Smooth scroll to roadmap
    const timeline = document.getElementById('roadmapTimelineContainer');
    if (timeline) {
      timeline.scrollIntoView({ behavior: 'smooth' });
    }
  }
};
