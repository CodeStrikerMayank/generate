/**
 * Daily 3-Subject Assignment Engine Controller (v3.1)
 * Powered by 405k HuggingFace ExamBench Question Repository
 * Serves 20–25 daily questions per subject (Physics, Chemistry, Mathematics for JEE; PCB for NEET)
 */

const AssignmentController = {
  currentAssignment: null,
  activeSubject: null,
  currentQuestionIndex: 0,
  userResponses: new Map(),      // question_id -> option_id ("A", "B", "C", "D")
  markedForReview: new Set(),    // Set of question_id
  timeSpentMap: new Map(),       // question_id -> seconds
  timerInterval: null,
  totalSeconds: 0,
  saveTimeout: null,

  async init() {
    if (!AppState.student) {
      AppState.showDiagnosticGateway();
      return;
    }
    await this.loadTodayAssignment();
  },

  async loadTodayAssignment() {
    const container = document.getElementById('assignmentContainer');
    if (container) {
      container.innerHTML = `
        <div style="text-align:center;padding:4rem 1rem;">
          <div class="glow-pulse" style="font-size:2rem;margin-bottom:1rem;">⏳</div>
          <h3 style="font-size:1.15rem;font-weight:800;color:var(--text-primary);">Loading Today's 3-Subject Assignment...</h3>
          <p style="font-size:0.85rem;color:var(--text-secondary);margin-top:0.4rem;">
            Connecting to HuggingFace ExamBench repository & synthesizing stream questions.
          </p>
        </div>
      `;
    }

    try {
      const data = await API.getTodayAssignment(AppState.student.student_id, 20);
      this.currentAssignment = data;

      // Populate already saved responses if returning to an in-progress assignment
      this.userResponses.clear();
      this.markedForReview.clear();

      const subjects = data.subjects || [];
      if (!this.activeSubject || !subjects.includes(this.activeSubject)) {
        this.activeSubject = subjects[0] || 'Physics';
      }
      this.currentQuestionIndex = 0;

      for (const sub of subjects) {
        const qList = data.questions_by_subject[sub] || [];
        for (const q of qList) {
          if (q.student_answer) {
            this.userResponses.set(q.question_id, q.student_answer);
          }
          if (q.is_marked_review) {
            this.markedForReview.add(q.question_id);
          }
        }
      }

      this.startTimer();
      this.renderAssignmentWorkspace();
    } catch (err) {
      console.error('[AssignmentController] Error loading assignment:', err);
      if (container) {
        container.innerHTML = `
          <div class="glass-card" style="text-align:center;padding:3rem 1.5rem;max-width:550px;margin:2rem auto;">
            <div style="font-size:2.5rem;margin-bottom:1rem;">⚠️</div>
            <h3 style="font-size:1.1rem;font-weight:800;color:var(--accent-rose);">Assignment Load Error</h3>
            <p style="font-size:0.85rem;color:var(--text-secondary);margin:0.5rem 0 1.5rem;">${err.message}</p>
            <button class="btn-primary" onclick="AssignmentController.loadTodayAssignment()">
              🔄 Retry Connection
            </button>
          </div>
        `;
      }
    }
  },

  startTimer() {
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.totalSeconds++;
      const timerElem = document.getElementById('assignmentLiveTimer');
      if (timerElem) {
        const hrs = Math.floor(this.totalSeconds / 3600);
        const mins = Math.floor((this.totalSeconds % 3600) / 60);
        const secs = this.totalSeconds % 60;
        if (hrs > 0) {
          timerElem.innerText = `⏱ ${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        } else {
          timerElem.innerText = `⏱ ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
      }
    }, 1000);
  },

  switchSubject(subjectName) {
    if (this.activeSubject === subjectName) return;
    this.activeSubject = subjectName;
    this.currentQuestionIndex = 0;
    this.renderAssignmentWorkspace();
  },

  selectOption(questionId, optionId) {
    if (this.currentAssignment && this.currentAssignment.status === 'COMPLETED') {
      return; // Already finalized
    }

    if (this.userResponses.get(questionId) === optionId) {
      // Toggle off if already selected
      this.userResponses.delete(questionId);
    } else {
      this.userResponses.set(questionId, optionId);
    }

    this.debounceSaveProgress();
    this.renderQuestionCard();
    this.renderPalette();
    this.updateStatsBar();
  },

  toggleMarkReview(questionId) {
    if (this.markedForReview.has(questionId)) {
      this.markedForReview.delete(questionId);
    } else {
      this.markedForReview.add(questionId);
    }
    this.debounceSaveProgress();
    this.renderQuestionCard();
    this.renderPalette();
  },

  clearResponse(questionId) {
    this.userResponses.delete(questionId);
    this.debounceSaveProgress();
    this.renderQuestionCard();
    this.renderPalette();
    this.updateStatsBar();
  },

  prevQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.renderQuestionCard();
      this.renderPalette();
    }
  },

  nextQuestion() {
    const qList = this.getActiveSubjectQuestions();
    if (this.currentQuestionIndex < qList.length - 1) {
      this.currentQuestionIndex++;
      this.renderQuestionCard();
      this.renderPalette();
    } else {
      // Prompt move to next subject if not on last subject
      const subjects = this.currentAssignment.subjects || [];
      const curSubIdx = subjects.indexOf(this.activeSubject);
      if (curSubIdx >= 0 && curSubIdx < subjects.length - 1) {
        this.switchSubject(subjects[curSubIdx + 1]);
      }
    }
  },

  jumpToQuestion(subjectName, index) {
    if (this.activeSubject !== subjectName) {
      this.activeSubject = subjectName;
    }
    this.currentQuestionIndex = index;
    this.renderAssignmentWorkspace();
  },

  debounceSaveProgress() {
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.syncProgressToBackend();
    }, 1500);
  },

  async syncProgressToBackend() {
    if (!this.currentAssignment) return;
    try {
      const responses = [];
      for (const [qid, ans] of this.userResponses.entries()) {
        responses.push({
          question_id: qid,
          student_answer: ans,
          is_marked_review: this.markedForReview.has(qid),
          time_taken_seconds: this.timeSpentMap.get(qid) || 45
        });
      }
      await API.saveAssignmentProgress(this.currentAssignment.assignment_id, responses);
    } catch (e) {
      console.warn('[AssignmentController] Autosave warning:', e);
    }
  },

  getActiveSubjectQuestions() {
    if (!this.currentAssignment || !this.currentAssignment.questions_by_subject) return [];
    return this.currentAssignment.questions_by_subject[this.activeSubject] || [];
  },

  updateStatsBar() {
    const totalQ = this.currentAssignment ? this.currentAssignment.total_questions : 60;
    const answeredCount = this.userResponses.size;
    const pct = Math.round((answeredCount / Math.max(totalQ, 1)) * 100);

    const progressFill = document.getElementById('assignmentProgressFill');
    const progressLabel = document.getElementById('assignmentProgressLabel');
    if (progressFill) progressFill.style.width = `${pct}%`;
    if (progressLabel) progressLabel.innerText = `${answeredCount} / ${totalQ} Completed (${pct}%)`;
  },

  renderAssignmentWorkspace() {
    const container = document.getElementById('assignmentContainer');
    if (!container || !this.currentAssignment) return;

    const subjects = this.currentAssignment.subjects || [];
    const totalQ = this.currentAssignment.total_questions || 60;
    const answeredCount = this.userResponses.size;
    const pct = Math.round((answeredCount / Math.max(totalQ, 1)) * 100);
    const exam = this.currentAssignment.exam || 'JEE';
    const isCompleted = this.currentAssignment.status === 'COMPLETED';

    container.innerHTML = `
      <div style="max-width:1120px;margin:0 auto;display:flex;flex-direction:column;gap:1.25rem;">
        
        <!-- Header Banner & Progress -->
        <div class="glass-card" style="padding:1.25rem 1.5rem;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:1rem;border-left:4px solid var(--accent-neon);">
          <div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:0.35rem;">
              <span class="nba-tag" style="margin:0;background:rgba(99,102,241,0.18);color:var(--accent-neon);border:1px solid rgba(99,102,241,0.35);">
                📝 DAILY ASSIGNMENT
              </span>
              <span class="pyq-tag" style="background:rgba(56,189,248,0.12);color:var(--accent-cyan);border-color:rgba(56,189,248,0.3);">
                🌐 405k ExamBench Repository
              </span>
              <span class="badge-active" style="background:rgba(16,185,129,0.12);color:var(--accent-emerald);border-color:rgba(16,185,129,0.3);">
                ${exam === 'JEE' ? 'JEE Main (PCM Track)' : 'NEET-UG (PCB Track)'}
              </span>
              ${isCompleted ? '<span style="background:var(--accent-emerald);color:#000;padding:2px 8px;border-radius:100px;font-size:0.72rem;font-weight:800;">✅ SUBMITTED</span>' : ''}
            </div>
            <h2 style="font-size:1.35rem;font-weight:900;letter-spacing:-0.02em;margin-bottom:0.25rem;">
              ${this.currentAssignment.title}
            </h2>
            <div style="font-size:0.78rem;color:var(--text-muted);">
              Target: 20 Questions × 3 Core Subjects (${totalQ} Total Questions) • Adaptive Item Calibrations
            </div>
          </div>

          <div style="display:flex;align-items:center;gap:1rem;">
            <div style="text-align:right;">
              <div id="assignmentLiveTimer" style="font-size:1.25rem;font-weight:800;font-family:var(--font-mono);color:var(--accent-amber);">
                ⏱ 00:00
              </div>
              <div style="font-size:0.72rem;color:var(--text-faint);">Time Active Today</div>
            </div>
            <button class="btn-secondary" style="font-size:0.78rem;padding:0.45rem 0.85rem;" onclick="AssignmentController.showHistoryModal()" title="View your streak and past assignment records">
              📜 History & Streak
            </button>
          </div>
        </div>

        <!-- Overall Progress Bar -->
        <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:0.75rem 1.25rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem;font-size:0.78rem;font-weight:700;">
            <span style="color:var(--text-secondary);">Assignment Progress:</span>
            <span id="assignmentProgressLabel" style="color:var(--accent-neon);font-family:var(--font-mono);">${answeredCount} / ${totalQ} Completed (${pct}%)</span>
          </div>
          <div class="quiz-progress-track" style="margin:0;">
            <div id="assignmentProgressFill" class="quiz-progress-fill" style="width:${pct}%;background:linear-gradient(90deg, #6366f1, #38bdf8, #10b981);"></div>
          </div>
        </div>

        <!-- 3 Subject Switcher Tabs -->
        <div style="display:flex;gap:0.6rem;flex-wrap:wrap;">
          ${subjects.map(sub => {
            const subQs = this.currentAssignment.questions_by_subject[sub] || [];
            const subAnswered = subQs.filter(q => this.userResponses.has(q.question_id)).length;
            const isActive = (sub === this.activeSubject);
            const icon = (sub === 'Physics') ? '⚛️' : (sub === 'Chemistry') ? '🧪' : (sub === 'Mathematics') ? '📐' : '🧬';
            return `
              <button 
                class="btn-secondary ${isActive ? 'active' : ''}" 
                style="flex:1;min-width:180px;justify-content:center;padding:0.75rem 1rem;border-radius:var(--radius-md);${isActive ? 'background:rgba(99,102,241,0.2);border-color:var(--accent-neon);color:var(--text-primary);box-shadow:0 0 15px rgba(99,102,241,0.25);' : ''}"
                onclick="AssignmentController.switchSubject('${sub}')">
                <span style="font-size:1.1rem;margin-right:6px;">${icon}</span>
                <span style="font-weight:800;font-size:0.9rem;">${sub}</span>
                <span style="margin-left:auto;font-family:var(--font-mono);font-size:0.75rem;padding:2px 7px;border-radius:var(--radius-full);background:rgba(0,0,0,0.3);color:${subAnswered === subQs.length ? 'var(--accent-emerald)' : 'var(--text-muted)'};">
                  ${subAnswered}/${subQs.length}
                </span>
              </button>
            `;
          }).join('')}
        </div>

        <!-- Main Workspace Grid (Question Card + Navigation Palette) -->
        <div style="display:grid;grid-template-columns:1fr 310px;gap:1.25rem;align-items:start;" id="assignmentGridContainer">
          
          <!-- Left Column: Active Question -->
          <div id="assignmentQuestionCardContainer"></div>

          <!-- Right Column: Question Navigator Matrix -->
          <div class="glass-card" style="padding:1.25rem;position:sticky;top:1rem;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
              <div style="font-weight:800;font-size:0.88rem;color:var(--text-primary);">
                ${this.activeSubject} Palette
              </div>
              <span style="font-size:0.72rem;color:var(--text-muted);">
                20 Items
              </span>
            </div>

            <!-- Number grid -->
            <div id="assignmentPaletteGrid" style="display:grid;grid-template-columns:repeat(5, 1fr);gap:6px;margin-bottom:1.25rem;"></div>

            <!-- Legend -->
            <div style="font-size:0.72rem;color:var(--text-muted);display:flex;flex-direction:column;gap:5px;border-top:1px solid var(--border-subtle);padding-top:0.75rem;margin-bottom:1.25rem;">
              <div style="display:flex;align-items:center;gap:6px;">
                <span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:var(--accent-emerald);"></span>
                <span>Answered</span>
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:var(--accent-amber);"></span>
                <span>Marked for Review</span>
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:rgba(255,255,255,0.08);border:1px solid var(--border-subtle);"></span>
                <span>Not Answered</span>
              </div>
            </div>

            <!-- Submit Button -->
            ${!isCompleted ? `
              <button 
                class="btn-primary glow-pulse" 
                style="width:100%;justify-content:center;padding:0.85rem;font-weight:900;font-size:0.88rem;border-radius:var(--radius-sm);background:var(--grad-hero);"
                onclick="AssignmentController.promptSubmitAssignment()">
                🏁 Submit Daily Assignment
              </button>
            ` : `
              <div style="text-align:center;padding:0.75rem;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.3);border-radius:var(--radius-sm);color:var(--accent-emerald);font-size:0.82rem;font-weight:700;">
                ✅ Assignment Completed (${this.currentAssignment.score_percentage}%)
              </div>
            `}
          </div>

        </div>

      </div>
    `;

    this.renderQuestionCard();
    this.renderPalette();
  },

  renderQuestionCard() {
    const cardElem = document.getElementById('assignmentQuestionCardContainer');
    if (!cardElem) return;

    const qList = this.getActiveSubjectQuestions();
    if (qList.length === 0) {
      cardElem.innerHTML = `<div class="glass-card" style="padding:2rem;text-align:center;">No questions found for ${this.activeSubject}.</div>`;
      return;
    }

    const q = qList[this.currentQuestionIndex];
    if (!q) return;

    const selectedAns = this.userResponses.get(q.question_id);
    const isMarked = this.markedForReview.has(q.question_id);
    const isCompleted = this.currentAssignment.status === 'COMPLETED';

    const displayLabels = ['A', 'B', 'C', 'D'];
    let optionsHtml = '';
    if (q.options) {
      optionsHtml = q.options.map((opt, i) => {
        const isSel = (selectedAns === opt.id);
        const isCorrectAns = (q.correct_answer === opt.id);
        let extraClasses = '';
        let extraStyles = '';

        if (isCompleted) {
          if (isCorrectAns) {
            extraClasses = 'correct-opt';
            extraStyles = 'border-color:var(--accent-emerald);background:rgba(16,185,129,0.15);';
          } else if (isSel && !isCorrectAns) {
            extraClasses = 'wrong-opt';
            extraStyles = 'border-color:var(--accent-rose);background:rgba(244,63,94,0.15);';
          }
        } else if (isSel) {
          extraClasses = 'selected';
        }

        return `
          <div 
            class="option-item ${extraClasses}" 
            style="${extraStyles}"
            onclick="AssignmentController.selectOption('${q.question_id}', '${opt.id}')">
            <div class="opt-id">${displayLabels[i] || opt.id}</div>
            <div class="opt-text">${opt.text}</div>
            ${isCompleted && isCorrectAns ? '<span style="margin-left:auto;color:var(--accent-emerald);font-weight:800;">✓ Correct</span>' : ''}
            ${isCompleted && isSel && !isCorrectAns ? '<span style="margin-left:auto;color:var(--accent-rose);font-weight:800;">✗ Your Answer</span>' : ''}
          </div>
        `;
      }).join('');
    }

    // Explanation details if completed
    let explanationBlock = '';
    if (isCompleted && q.explanation) {
      explanationBlock = `
        <div style="margin-top:1.25rem;padding:1rem 1.25rem;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.25);border-radius:var(--radius-sm);">
          <div style="font-weight:800;font-size:0.85rem;color:var(--accent-neon);margin-bottom:0.4rem;">
            💡 ExamBench Verified Solution & Step-by-Step Derivation:
          </div>
          <div style="font-size:0.84rem;color:var(--text-secondary);line-height:1.6;white-space:pre-wrap;">${q.explanation}</div>
        </div>
      `;
    }

    cardElem.innerHTML = `
      <div class="glass-card" style="padding:1.5rem;">
        
        <!-- Question Meta Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:1rem;padding-bottom:0.75rem;border-bottom:1px solid var(--border-subtle);">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="font-weight:900;font-size:1rem;color:var(--text-primary);">
              ${this.activeSubject} — Q${this.currentQuestionIndex + 1} of ${qList.length}
            </span>
            <span class="pyq-tag">
              📌 ${q.chapter || 'Competitive Topic'}
            </span>
            <span class="badge-learn">
              ${(q.skill || 'CONCEPTUAL').toUpperCase()}
            </span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:0.75rem;color:var(--text-faint);font-family:var(--font-mono);">
              ID: ${q.question_id}
            </span>
          </div>
        </div>

        <!-- Question Body -->
        <div style="font-size:1.02rem;line-height:1.65;font-weight:500;color:var(--text-primary);margin-bottom:1.5rem;">
          ${q.content}
        </div>

        ${q.image_url ? `
          <div style="margin-bottom:1.5rem;text-align:center;background:rgba(255,255,255,0.03);padding:12px;border-radius:var(--radius-sm);border:1px solid rgba(255,255,255,0.08);">
            <img src="${q.image_url}" alt="Question Figure / Diagram" style="max-width:100%;max-height:400px;object-fit:contain;border-radius:6px;" loading="lazy" />
            <div style="font-size:0.75rem;color:var(--text-faint);margin-top:6px;">📷 Official Paper Problem Crop (Reja1/jee-neet-benchmark)</div>
          </div>
        ` : ''}

        <!-- Options Grid -->
        <div class="options-grid" style="margin-bottom:1.5rem;">
          ${optionsHtml}
        </div>

        ${explanationBlock}

        <!-- Bottom Controls -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-top:1.25rem;padding-top:1rem;border-top:1px solid var(--border-subtle);">
          <div style="display:flex;gap:6px;">
            <button class="btn-secondary" style="font-size:0.8rem;padding:0.45rem 0.85rem;" onclick="AssignmentController.prevQuestion()" ${this.currentQuestionIndex === 0 ? 'disabled' : ''}>
              ⬅️ Previous
            </button>
            <button class="btn-secondary" style="font-size:0.8rem;padding:0.45rem 0.85rem;" onclick="AssignmentController.nextQuestion()">
              Next ➡️
            </button>
          </div>

          <div style="display:flex;gap:6px;">
            ${!isCompleted ? `
              <button 
                class="btn-secondary" 
                style="font-size:0.8rem;padding:0.45rem 0.85rem;${isMarked ? 'background:rgba(245,158,11,0.2);border-color:var(--accent-amber);color:var(--accent-amber);' : ''}"
                onclick="AssignmentController.toggleMarkReview('${q.question_id}')">
                ${isMarked ? '★ Marked for Review' : '☆ Mark for Review'}
              </button>
              ${selectedAns ? `
                <button class="btn-secondary" style="font-size:0.8rem;padding:0.45rem 0.75rem;color:var(--text-muted);" onclick="AssignmentController.clearResponse('${q.question_id}')">
                  Clear
                </button>
              ` : ''}
            ` : ''}
          </div>
        </div>

      </div>
    `;
  },

  renderPalette() {
    const paletteGrid = document.getElementById('assignmentPaletteGrid');
    if (!paletteGrid) return;

    const qList = this.getActiveSubjectQuestions();
    paletteGrid.innerHTML = qList.map((q, idx) => {
      const isCurrent = (idx === this.currentQuestionIndex);
      const isAnswered = this.userResponses.has(q.question_id);
      const isMarked = this.markedForReview.has(q.question_id);

      let bg = 'rgba(255,255,255,0.05)';
      let border = '1px solid var(--border-subtle)';
      let color = 'var(--text-muted)';

      if (isMarked) {
        bg = 'rgba(245, 158, 11, 0.25)';
        border = '1px solid var(--accent-amber)';
        color = 'var(--accent-amber)';
      } else if (isAnswered) {
        bg = 'rgba(16, 185, 129, 0.25)';
        border = '1px solid var(--accent-emerald)';
        color = 'var(--accent-emerald)';
      }

      if (isCurrent) {
        border = '2px solid var(--accent-neon)';
      }

      return `
        <button 
          style="width:100%;height:38px;border-radius:var(--radius-sm);font-weight:800;font-size:0.82rem;font-family:var(--font-mono);background:${bg};border:${border};color:${color};cursor:pointer;transition:all 0.15s;"
          onclick="AssignmentController.jumpToQuestion('${this.activeSubject}', ${idx})">
          ${idx + 1}
        </button>
      `;
    }).join('');
  },

  promptSubmitAssignment() {
    if (!this.currentAssignment) return;

    const totalQ = this.currentAssignment.total_questions;
    const answeredCount = this.userResponses.size;
    const unansweredCount = totalQ - answeredCount;

    let confirmMsg = `Ready to submit your daily assignment?\n\n` +
      `• Total Questions: ${totalQ}\n` +
      `• Completed: ${answeredCount}\n` +
      `• Unanswered: ${unansweredCount}\n\n` +
      `Your responses will be graded and integrated into your Bayesian Knowledge Tracing & IRT profile.`;

    if (unansweredCount > 0) {
      confirmMsg += `\n\n⚠️ You still have ${unansweredCount} unanswered questions. Do you still wish to finalize?`;
    }

    if (confirm(confirmMsg)) {
      this.executeSubmission();
    }
  },

  async executeSubmission() {
    try {
      clearInterval(this.timerInterval);
      const responses = [];
      for (const [qid, ans] of this.userResponses.entries()) {
        responses.push({
          question_id: qid,
          student_answer: ans,
          is_marked_review: this.markedForReview.has(qid),
          time_taken_seconds: this.timeSpentMap.get(qid) || 50
        });
      }

      const result = await API.submitAssignment(
        this.currentAssignment.assignment_id,
        responses,
        this.totalSeconds
      );

      this.currentAssignment.status = 'COMPLETED';
      this.currentAssignment.score_percentage = result.score_percentage;
      this.currentAssignment.subject_scores = result.subject_scores;

      AppState._toast('🎉 Daily Assignment successfully submitted!', 'success');
      this.showResultModal(result);
      this.renderAssignmentWorkspace();
    } catch (err) {
      alert('Failed to submit assignment: ' + err.message);
    }
  },

  showResultModal(result) {
    let modal = document.getElementById('assignmentResultModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'assignmentResultModal';
      modal.className = 'modal-backdrop active';
      document.body.appendChild(modal);
    } else {
      modal.className = 'modal-backdrop active';
    }

    const subScores = result.subject_scores || {};
    const scorePct = result.score_percentage || 0;

    let subjectScoreHtml = Object.entries(subScores).map(([sub, stats]) => `
      <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:0.85rem 1rem;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem;">
          <div style="font-weight:800;font-size:0.92rem;color:var(--text-primary);">${sub}</div>
          <div style="font-family:var(--font-mono);font-weight:800;font-size:0.88rem;color:var(--accent-neon);">${stats.score_percentage}%</div>
        </div>
        <div style="font-size:0.75rem;color:var(--text-muted);">
          ${stats.correct} Correct / ${stats.total} Total (${stats.answered} Attempted)
        </div>
      </div>
    `).join('');

    modal.innerHTML = `
      <div class="modal-box" style="max-width:620px;">
        <div style="text-align:center;margin-bottom:1.5rem;">
          <div style="font-size:2.5rem;margin-bottom:0.5rem;">🎯</div>
          <h2 style="font-size:1.5rem;font-weight:900;letter-spacing:-0.02em;margin-bottom:0.25rem;">
            Daily Assignment Completed!
          </h2>
          <p style="font-size:0.85rem;color:var(--text-secondary);">
            Evaluated against the HuggingFace ExamBench standard.
          </p>
        </div>

        <!-- Overall Score Box -->
        <div style="background:linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(56,189,248,0.1) 100%);border:1px solid rgba(99,102,241,0.3);border-radius:var(--radius-md);padding:1.25rem;text-align:center;margin-bottom:1.25rem;">
          <div style="font-size:0.78rem;font-weight:700;color:var(--accent-cyan);letter-spacing:0.05em;text-transform:uppercase;">
            OVERALL SCORE
          </div>
          <div style="font-size:2.6rem;font-weight:900;font-family:var(--font-mono);color:var(--text-primary);margin:0.25rem 0;">
            ${scorePct}%
          </div>
          <div style="font-size:0.82rem;color:var(--text-muted);">
            ${result.correct_count} of ${result.total_questions} Questions Solved Correctly
          </div>
        </div>

        <!-- Subject Accuracies -->
        <div style="margin-bottom:1.5rem;">
          <div style="font-weight:800;font-size:0.85rem;margin-bottom:0.65rem;color:var(--text-secondary);">
            📊 3-Subject Performance Breakdown:
          </div>
          <div style="display:flex;flex-direction:column;gap:0.6rem;">
            ${subjectScoreHtml}
          </div>
        </div>

        <!-- Buttons -->
        <div style="display:flex;gap:0.65rem;">
          <button class="btn-secondary" style="flex:1;justify-content:center;padding:0.75rem;" onclick="document.getElementById('assignmentResultModal').classList.remove('active');AssignmentController.renderAssignmentWorkspace();">
            🔍 Review Explanations
          </button>
          <button class="btn-primary" style="flex:1;justify-content:center;padding:0.75rem;background:var(--grad-hero);" onclick="document.getElementById('assignmentResultModal').classList.remove('active');AppState.switchTab('dashboard');">
            📈 View Mastery Updates →
          </button>
        </div>
      </div>
    `;
  },

  async showHistoryModal() {
    let modal = document.getElementById('assignmentHistoryModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'assignmentHistoryModal';
      modal.className = 'modal-backdrop active';
      document.body.appendChild(modal);
    } else {
      modal.className = 'modal-backdrop active';
    }

    modal.innerHTML = `
      <div class="modal-box" style="max-width:680px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;">
          <div>
            <h3 style="font-size:1.25rem;font-weight:900;letter-spacing:-0.02em;">📜 Assignment History & Consistency</h3>
            <div style="font-size:0.78rem;color:var(--text-muted);">Daily assignments generated from HuggingFace ExamBench</div>
          </div>
          <button class="btn-secondary" style="padding:0.35rem 0.75rem;" onclick="document.getElementById('assignmentHistoryModal').classList.remove('active');">✕ Close</button>
        </div>
        <div id="assignmentHistoryList" style="text-align:center;padding:2rem;color:var(--text-secondary);">Loading history...</div>
      </div>
    `;

    try {
      const data = await API.getAssignmentHistory(AppState.student.student_id);
      const listElem = document.getElementById('assignmentHistoryList');
      if (!listElem) return;

      const history = data.history || [];
      if (history.length === 0) {
        listElem.innerHTML = `<div style="padding:2rem;color:var(--text-muted);">No past assignments recorded yet. Today is your day 1!</div>`;
        return;
      }

      listElem.innerHTML = `
        <div style="display:flex;align-items:center;gap:1.5rem;background:rgba(255,255,255,0.03);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:1rem;margin-bottom:1.25rem;">
          <div style="text-align:center;">
            <div style="font-size:2rem;font-weight:900;font-family:var(--font-mono);color:var(--accent-amber);">🔥 ${data.streak_days}</div>
            <div style="font-size:0.72rem;color:var(--text-muted);font-weight:700;">DAILY STREAK</div>
          </div>
          <div style="height:36px;width:1px;background:var(--border-subtle);"></div>
          <div style="text-align:center;">
            <div style="font-size:2rem;font-weight:900;font-family:var(--font-mono);color:var(--accent-emerald);">${data.total_assignments_completed}</div>
            <div style="font-size:0.72rem;color:var(--text-muted);font-weight:700;">COMPLETED</div>
          </div>
        </div>

        <div style="max-height:360px;overflow-y:auto;display:flex;flex-direction:column;gap:0.5rem;">
          ${history.map(h => `
            <div style="background:rgba(255,255,255,0.02);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:0.75rem 1rem;display:flex;justify-content:space-between;align-items:center;text-align:left;">
              <div>
                <div style="font-weight:800;font-size:0.85rem;color:var(--text-primary);">${h.title}</div>
                <div style="font-size:0.72rem;color:var(--text-muted);">${h.assignment_date} • ${h.exam} Stream</div>
              </div>
              <div style="text-align:right;">
                <div style="font-weight:800;font-family:var(--font-mono);color:${h.status === 'COMPLETED' ? 'var(--accent-emerald)' : 'var(--accent-amber)'};font-size:0.88rem;">
                  ${h.status === 'COMPLETED' ? `${h.score_percentage}%` : 'IN PROGRESS'}
                </div>
                <div style="font-size:0.72rem;color:var(--text-faint);">${h.completed_count}/${h.total_questions} Solved</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (e) {
      console.error(e);
    }
  }
};
