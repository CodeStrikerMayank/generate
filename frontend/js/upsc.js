/**
 * UPSC Civil Services Subsystem Controller
 * Provides:
 *  1. Prelims MCQ Testing Arena with instant answer explanations & scoring
 *  2. Mains Analytical Answer-Writing Workspace with live word counter, timer,
 *     and AI Multi-Dimensional Rubric Evaluation (Understanding, Structure, Content, Policy, Critical Balance)
 *  3. Historical Submissions Tracker with rubric breakdown
 */

const UPSCController = {
  activeSubTab: 'mains', // 'mains' or 'prelims'
  mainsPrompts: [],
  selectedPrompt: null,
  mainsTimerSeconds: 0,
  mainsTimerInterval: null,
  mainsHistory: [],

  // Prelims Quiz state
  prelimsQuestions: [],
  prelimsCurrentIdx: 0,
  prelimsResponses: new Map(), // question_id -> option_id
  prelimsSubmitted: false,

  async init() {
    if (!AppState.student) return;
    try {
      await Promise.all([
        this.loadMainsPrompts(),
        this.loadPrelimsQuestions(),
        this.loadHistory()
      ]);
      this.render();
    } catch (e) {
      console.error('[UPSCController] Init error:', e);
    }
  },

  async loadMainsPrompts() {
    try {
      this.mainsPrompts = await API.getUPSCMainsPrompts();
      if (this.mainsPrompts.length > 0 && !this.selectedPrompt) {
        this.selectedPrompt = this.mainsPrompts[0];
      }
    } catch (e) {
      console.error('[UPSCController] Error loading mains prompts:', e);
    }
  },

  async loadPrelimsQuestions() {
    try {
      this.prelimsQuestions = await API.getUPSCQuestions();
      this.prelimsCurrentIdx = 0;
      this.prelimsResponses.clear();
      this.prelimsSubmitted = false;
    } catch (e) {
      console.error('[UPSCController] Error loading prelims questions:', e);
    }
  },

  async loadHistory() {
    if (!AppState.student) return;
    try {
      this.mainsHistory = await API.getUPSCHistory(AppState.student.student_id);
    } catch (e) {
      console.error('[UPSCController] Error loading history:', e);
    }
  },

  switchSubTab(tab) {
    this.activeSubTab = tab;
    this.render();
  },

  selectPrompt(promptId) {
    const p = this.mainsPrompts.find(item => item.question_id === promptId);
    if (p) {
      this.selectedPrompt = p;
      this.renderMainsWorkspace();
      this.startMainsTimer();
    }
  },

  startMainsTimer() {
    if (this.mainsTimerInterval) clearInterval(this.mainsTimerInterval);
    this.mainsTimerSeconds = 0;
    this.mainsTimerInterval = setInterval(() => {
      this.mainsTimerSeconds++;
      const timerElem = document.getElementById('upscMainsTimer');
      if (timerElem) {
        const mins = Math.floor(this.mainsTimerSeconds / 60);
        const secs = this.mainsTimerSeconds % 60;
        timerElem.innerText = `⏱ ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      }
    }, 1000);
  },

  updateWordCount() {
    const textarea = document.getElementById('upscAnswerInput');
    const countBadge = document.getElementById('upscWordCountBadge');
    if (!textarea || !countBadge || !this.selectedPrompt) return;

    const text = textarea.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const limit = this.selectedPrompt.word_limit || 250;
    const pct = Math.min(Math.round((words / limit) * 100), 120);

    let color = 'var(--text-secondary)';
    if (words > 0 && words < limit * 0.5) {
      color = 'var(--accent-amber)';
    } else if (words >= limit * 0.8 && words <= limit * 1.1) {
      color = 'var(--accent-emerald)';
    } else if (words > limit * 1.15) {
      color = 'var(--accent-rose)';
    }

    countBadge.innerHTML = `<span style="color:${color};font-weight:700;">${words}</span> / ${limit} words (${pct}%)`;
  },

  async submitMainsAnswer() {
    if (!AppState.student) return;
    const textarea = document.getElementById('upscAnswerInput');
    if (!textarea) return;

    const text = textarea.value.trim();
    if (!text || text.split(/\s+/).length < 25) {
      AppState._toast('⚠️ Please write at least 25 words before submitting for evaluation.', 'warning');
      return;
    }

    const submitBtn = document.getElementById('btnSubmitMains');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Evaluating via UPSC Rubrics...';
    }

    try {
      const result = await API.evaluateUPSCWritten(
        AppState.student.student_id,
        this.selectedPrompt.question_id,
        text,
        this.mainsTimerSeconds
      );

      clearInterval(this.mainsTimerInterval);
      this.displayEvaluationModal(result);
      await this.loadHistory();
      this.renderHistory();
      AppState._toast('✨ Mains Answer successfully evaluated!', 'success');
    } catch (e) {
      alert('Evaluation error: ' + e.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = '📤 Submit & Run AI Rubric Evaluation';
      }
    }
  },

  displayEvaluationModal(result) {
    let modal = document.getElementById('upscEvaluationModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'upscEvaluationModal';
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
    }

    const rubrics = result.rubric_scores || {};
    const criteriaLabels = {
      understanding: { name: 'Core Understanding & Word Limit', max: 3.0 },
      structure: { name: 'Structural Flow & Paragraphing', max: 3.0 },
      content_depth: { name: 'Syllabus Dimensions & Depth', max: 3.0 },
      policy_context: { name: 'Constitutional / Statutory Context', max: 3.0 },
      critical_balance: { name: 'Critical Balance & Way Forward', max: 3.0 }
    };

    const rubricRows = Object.entries(criteriaLabels).map(([key, info]) => {
      const score = rubrics[key] !== undefined ? rubrics[key] : 2.0;
      const pct = Math.round((score / info.max) * 100);
      let barColor = pct >= 80 ? 'var(--accent-emerald)' : (pct >= 50 ? 'var(--accent-amber)' : 'var(--accent-rose)');
      return `
        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;font-size:0.84rem;margin-bottom:4px;">
            <span style="font-weight:600;color:var(--text-primary);">${info.name}</span>
            <span style="font-weight:800;font-family:var(--font-mono);color:${barColor};">${score.toFixed(1)} / ${info.max.toFixed(1)}</span>
          </div>
          <div style="height:7px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:${barColor};border-radius:4px;transition:width 0.5s ease;"></div>
          </div>
        </div>
      `;
    }).join('');

    modal.innerHTML = `
      <div class="glass-card modal-dialog" style="max-width:680px;padding:2rem;position:relative;">
        <button class="modal-close-btn" onclick="document.getElementById('upscEvaluationModal').classList.remove('active')">✕</button>
        
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:1rem;">
          <span style="font-size:1.6rem;">🏛️</span>
          <div>
            <h3 style="font-size:1.3rem;font-weight:900;margin:0;">UPSC Civil Services Answer Evaluation</h3>
            <div style="font-size:0.78rem;color:var(--text-muted);">${this.selectedPrompt ? this.selectedPrompt.paper : 'GS Mains'}</div>
          </div>
        </div>

        <!-- Score Banner -->
        <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.3);border-radius:var(--radius-sm);padding:1rem 1.25rem;margin-bottom:1.5rem;">
          <div>
            <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;font-weight:700;">Final Assessed Score</div>
            <div style="font-size:2rem;font-weight:900;color:var(--accent-neon);font-family:var(--font-mono);">
              ${result.total_score} <span style="font-size:1rem;color:var(--text-secondary);font-weight:600;">/ ${result.max_score} Marks</span>
            </div>
          </div>
          <div style="text-align:right;">
            <span class="badge-active" style="background:rgba(16,185,129,0.15);color:var(--accent-emerald);font-size:0.8rem;padding:4px 10px;">
              ${Math.round((result.total_score / result.max_score) * 100)}% Proficiency
            </span>
            <div style="font-size:0.75rem;color:var(--text-faint);margin-top:4px;">${result.word_count} Words • ${Math.round(result.time_taken_seconds / 60)} min</div>
          </div>
        </div>

        <!-- Multi-Dimensional Rubric Bars -->
        <div style="margin-bottom:1.5rem;">
          <h4 style="font-size:0.92rem;font-weight:800;color:var(--text-primary);margin-bottom:0.75rem;text-transform:uppercase;letter-spacing:0.04em;">
            Multi-Dimensional Rubric Scores
          </h4>
          ${rubricRows}
        </div>

        <!-- Qualitative Examiner Feedback -->
        <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:1rem 1.25rem;margin-bottom:1.5rem;">
          <div style="font-weight:800;font-size:0.85rem;color:var(--accent-amber);margin-bottom:0.4rem;">
            🔍 Examiner Qualitative Appraisal:
          </div>
          <div style="font-size:0.84rem;color:var(--text-secondary);line-height:1.6;">
            ${result.ai_feedback_summary}
          </div>
        </div>

        <button class="btn-primary" style="width:100%;justify-content:center;padding:0.85rem;" onclick="document.getElementById('upscEvaluationModal').classList.remove('active')">
          Done & Return to Workspace
        </button>
      </div>
    `;

    modal.classList.add('active');
  },

  // Prelims Handlers
  selectPrelimsOption(optId) {
    if (this.prelimsSubmitted) return;
    const q = this.prelimsQuestions[this.prelimsCurrentIdx];
    if (!q) return;

    this.prelimsResponses.set(q.question_id, optId);
    this.renderPrelimsQuestion();
  },

  prevPrelimsQuestion() {
    if (this.prelimsCurrentIdx > 0) {
      this.prelimsCurrentIdx--;
      this.renderPrelimsQuestion();
    }
  },

  nextPrelimsQuestion() {
    if (this.prelimsCurrentIdx < this.prelimsQuestions.length - 1) {
      this.prelimsCurrentIdx++;
      this.renderPrelimsQuestion();
    }
  },

  submitPrelimsQuiz() {
    this.prelimsSubmitted = true;
    let correct = 0;
    this.prelimsQuestions.forEach(q => {
      if (this.prelimsResponses.get(q.question_id) === q.correct_answer) {
        correct++;
      }
    });

    AppState._toast(`🎯 Prelims Quiz submitted! Score: ${correct}/${this.prelimsQuestions.length}`, 'success');
    this.renderPrelimsQuestion();
  },

  render() {
    const container = document.getElementById('pane_upsc');
    if (!container) return;

    container.innerHTML = `
      <div style="max-width:1160px;margin:0 auto;display:flex;flex-direction:column;gap:1.5rem;">
        
        <!-- Header Banner -->
        <div class="glass-card" style="padding:1.5rem 2rem;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:1.5rem;border-left:4px solid var(--accent-amber);">
          <div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:0.4rem;">
              <span class="nba-tag" style="background:rgba(245,158,11,0.15);color:var(--accent-amber);border:1px solid rgba(245,158,11,0.3);margin:0;">
                🏛️ UNION PUBLIC SERVICE COMMISSION
              </span>
              <span class="badge-active" style="background:rgba(56,189,248,0.15);color:var(--accent-cyan);border:1px solid rgba(56,189,248,0.3);">
                Civil Services Examination (CSE)
              </span>
            </div>
            <h2 style="font-size:1.6rem;font-weight:900;letter-spacing:-0.02em;margin-bottom:0.25rem;">
              Civil Services Intelligence & Assessment Suite
            </h2>
            <div style="font-size:0.84rem;color:var(--text-secondary);">
              Dual-mode testing engine: Prelims Multi-Choice Mastery & Mains Descriptive Analytical Answer Evaluation.
            </div>
          </div>

          <!-- Tab Selector Buttons -->
          <div style="display:flex;background:rgba(0,0,0,0.4);padding:4px;border-radius:var(--radius-sm);border:1px solid var(--border-subtle);gap:4px;">
            <button 
              class="btn-tab ${this.activeSubTab === 'mains' ? 'active' : ''}" 
              style="padding:0.6rem 1.25rem;border-radius:4px;font-weight:700;font-size:0.85rem;background:${this.activeSubTab === 'mains' ? 'var(--accent-amber)' : 'transparent'};color:${this.activeSubTab === 'mains' ? '#000' : 'var(--text-secondary)'};border:none;cursor:pointer;"
              onclick="UPSCController.switchSubTab('mains')">
              ✍️ Mains Written Arena
            </button>
            <button 
              class="btn-tab ${this.activeSubTab === 'prelims' ? 'active' : ''}" 
              style="padding:0.6rem 1.25rem;border-radius:4px;font-weight:700;font-size:0.85rem;background:${this.activeSubTab === 'prelims' ? 'var(--accent-cyan)' : 'transparent'};color:${this.activeSubTab === 'prelims' ? '#000' : 'var(--text-secondary)'};border:none;cursor:pointer;"
              onclick="UPSCController.switchSubTab('prelims')">
              🎯 Prelims MCQ Quiz
            </button>
          </div>
        </div>

        <!-- Sub-tab Content Area -->
        <div id="upscSubTabContent">
          ${this.activeSubTab === 'mains' ? this.getMainsTemplate() : this.getPrelimsTemplate()}
        </div>

        <!-- Previous Submissions History -->
        <div class="glass-card" style="padding:1.5rem;">
          <h3 style="font-size:1.1rem;font-weight:800;margin-bottom:1rem;display:flex;align-items:center;gap:8px;">
            <span>📜</span> Recent Mains Written Submissions & Evaluations
          </h3>
          <div id="upscHistoryContainer">
            ${this.getHistoryHtml()}
          </div>
        </div>

      </div>
    `;

    if (this.activeSubTab === 'mains') {
      this.startMainsTimer();
      this.updateWordCount();
    } else {
      this.renderPrelimsQuestion();
    }
  },

  getMainsTemplate() {
    const prompt = this.selectedPrompt || (this.mainsPrompts.length > 0 ? this.mainsPrompts[0] : null);
    if (!prompt) {
      return `<div class="glass-card" style="padding:2rem;text-align:center;">Loading UPSC Mains analytical prompts...</div>`;
    }

    const promptTabs = this.mainsPrompts.map(p => `
      <button 
        class="prompt-pill ${p.question_id === prompt.question_id ? 'active' : ''}"
        style="padding:0.5rem 0.9rem;font-size:0.78rem;font-weight:700;border-radius:var(--radius-sm);border:1px solid ${p.question_id === prompt.question_id ? 'var(--accent-amber)' : 'var(--border-subtle)'};background:${p.question_id === prompt.question_id ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.02)'};color:${p.question_id === prompt.question_id ? 'var(--accent-amber)' : 'var(--text-secondary)'};cursor:pointer;"
        onclick="UPSCController.selectPrompt('${p.question_id}')">
        ${p.paper.split(' ')[0]} ${p.paper.split(' ')[1] || ''}: Q${p.question_id.slice(-2)}
      </button>
    `).join('');

    return `
      <div style="display:grid;grid-template-columns:1fr 340px;gap:1.5rem;align-items:start;">
        
        <!-- Left: Writing Workspace -->
        <div class="glass-card" style="padding:1.75rem;display:flex;flex-direction:column;gap:1.25rem;">
          
          <!-- Prompt Selector Pills -->
          <div style="display:flex;gap:8px;flex-wrap:wrap;padding-bottom:1rem;border-bottom:1px solid var(--border-subtle);">
            ${promptTabs}
          </div>

          <!-- Active Question Card -->
          <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(245,158,11,0.25);border-radius:var(--radius-sm);padding:1.25rem;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
              <span class="badge-learn" style="background:rgba(245,158,11,0.2);color:var(--accent-amber);border:none;">
                ${prompt.paper}
              </span>
              <div style="display:flex;gap:8px;align-items:center;">
                <span class="reason-tag" style="background:rgba(0,0,0,0.3);color:var(--text-primary);font-weight:700;">
                  Marks: ${prompt.marks}
                </span>
                <span class="reason-tag" style="background:rgba(0,0,0,0.3);color:var(--text-primary);font-weight:700;">
                  Limit: ${prompt.word_limit} words
                </span>
              </div>
            </div>
            <div style="font-size:1.05rem;font-weight:600;line-height:1.6;color:var(--text-primary);">
              "${prompt.question_text}"
            </div>
          </div>

          <!-- Answer Textarea -->
          <div style="display:flex;flex-direction:column;gap:6px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <label style="font-size:0.85rem;font-weight:700;color:var(--text-secondary);">Your Descriptive Answer:</label>
              <div style="display:flex;gap:12px;align-items:center;">
                <div id="upscMainsTimer" style="font-size:0.85rem;font-family:var(--font-mono);font-weight:700;color:var(--accent-amber);">⏱ 00:00</div>
                <div id="upscWordCountBadge" style="font-size:0.82rem;font-family:var(--font-mono);color:var(--text-muted);">0 / ${prompt.word_limit} words</div>
              </div>
            </div>
            <textarea 
              id="upscAnswerInput" 
              class="upsc-answer-textarea" 
              rows="15" 
              placeholder="Structure your answer clearly: Introduction (origin/doctrine/context), Body (dimensions, constitutional articles, analytical pros & cons), and Conclusion (forward-looking balance)..." 
              style="width:100%;padding:1rem;background:rgba(15,23,42,0.6);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);color:var(--text-primary);font-size:0.95rem;line-height:1.7;resize:vertical;font-family:var(--font-sans);"
              oninput="UPSCController.updateWordCount()"></textarea>
          </div>

          <!-- Action Buttons -->
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
            <div style="font-size:0.75rem;color:var(--text-faint);">
              💡 Scored against: Understanding, Structure, Content Depth, Policy & Balance.
            </div>
            <button 
              id="btnSubmitMains" 
              class="btn-primary" 
              style="background:var(--accent-amber);color:#000;font-weight:800;padding:0.85rem 1.5rem;border-radius:var(--radius-sm);border:none;cursor:pointer;"
              onclick="UPSCController.submitMainsAnswer()">
              📤 Submit & Run AI Rubric Evaluation
            </button>
          </div>

        </div>

        <!-- Right: Rubric Guidelines & Key Dimensions -->
        <div style="display:flex;flex-direction:column;gap:1.25rem;">
          
          <div class="glass-card" style="padding:1.25rem;">
            <h4 style="font-size:0.88rem;font-weight:800;color:var(--accent-amber);text-transform:uppercase;margin-bottom:0.75rem;">
              🎯 Key Dimensions Expected
            </h4>
            <ul style="padding-left:1.2rem;font-size:0.82rem;color:var(--text-secondary);line-height:1.6;margin:0;">
              ${prompt.key_dimensions ? prompt.key_dimensions.map(d => `<li style="margin-bottom:4px;">${d}</li>`).join('') : ''}
            </ul>
          </div>

          <div class="glass-card" style="padding:1.25rem;">
            <h4 style="font-size:0.88rem;font-weight:800;color:var(--accent-cyan);text-transform:uppercase;margin-bottom:0.75rem;">
              📐 Recommended Structure
            </h4>
            <div style="font-size:0.82rem;color:var(--text-secondary);line-height:1.6;">
              ${prompt.recommended_structure || 'Intro -> Arguments For -> Counterpoints -> Balanced Conclusion.'}
            </div>
          </div>

          <div class="glass-card" style="padding:1.25rem;">
            <h4 style="font-size:0.88rem;font-weight:800;color:var(--text-primary);text-transform:uppercase;margin-bottom:0.75rem;">
              ⚖️ Evaluation Rubrics (/15)
            </h4>
            <div style="font-size:0.78rem;color:var(--text-muted);display:flex;flex-direction:column;gap:6px;">
              <div>• <b>Understanding & Brevity:</b> 3.0 pts</div>
              <div>• <b>Structure & Flow:</b> 3.0 pts</div>
              <div>• <b>Content Depth & Facts:</b> 3.0 pts</div>
              <div>• <b>Constitutional Context:</b> 3.0 pts</div>
              <div>• <b>Critical Balance:</b> 3.0 pts</div>
            </div>
          </div>

        </div>

      </div>
    `;
  },

  getPrelimsTemplate() {
    return `
      <div id="upscPrelimsContainer" class="glass-card" style="padding:1.75rem;">
        <!-- Question card rendered here dynamically -->
      </div>
    `;
  },

  renderPrelimsQuestion() {
    const container = document.getElementById('upscPrelimsContainer');
    if (!container) return;

    if (this.prelimsQuestions.length === 0) {
      container.innerHTML = `<div style="text-align:center;padding:2rem;">Loading UPSC Prelims questions...</div>`;
      return;
    }

    const q = this.prelimsQuestions[this.prelimsCurrentIdx];
    const total = this.prelimsQuestions.length;
    const selected = this.prelimsResponses.get(q.question_id);
    const displayLabels = ['A', 'B', 'C', 'D'];

    let optionsHtml = '';
    if (q.options) {
      const optsArray = Array.isArray(q.options) 
        ? q.options 
        : Object.entries(q.options).map(([k, v]) => ({ id: k, text: v }));

      optionsHtml = optsArray.map((opt, i) => {
        const isSel = (selected === opt.id);
        let border = isSel ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)';
        let bg = isSel ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.02)';

        if (this.prelimsSubmitted) {
          if (opt.id === q.correct_answer) {
            border = '1px solid var(--accent-emerald)';
            bg = 'rgba(16,185,129,0.15)';
          } else if (isSel && opt.id !== q.correct_answer) {
            border = '1px solid var(--accent-rose)';
            bg = 'rgba(244,63,94,0.15)';
          }
        }

        return `
          <div 
            class="prelims-opt-item" 
            style="display:flex;align-items:flex-start;gap:12px;padding:0.85rem 1rem;border-radius:var(--radius-sm);border:${border};background:${bg};cursor:pointer;margin-bottom:8px;transition:all 0.2s ease;"
            onclick="UPSCController.selectPrelimsOption('${opt.id}')">
            <span style="font-weight:800;font-family:var(--font-mono);color:${isSel ? 'var(--accent-cyan)' : 'var(--text-muted)'};">[${displayLabels[i] || opt.id}]</span>
            <span style="font-size:0.92rem;color:var(--text-primary);line-height:1.5;">${opt.text}</span>
          </div>
        `;
      }).join('');
    }

    container.innerHTML = `
      <div style="max-width:860px;margin:0 auto;">
        
        <!-- Top bar -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;padding-bottom:0.75rem;border-bottom:1px solid var(--border-subtle);">
          <div style="display:flex;gap:8px;align-items:center;">
            <span class="nba-tag" style="margin:0;background:rgba(56,189,248,0.15);color:var(--accent-cyan);border-color:rgba(56,189,248,0.3);">
              PRELIMS GS-I
            </span>
            <span class="pyq-tag">${q.subject || 'General Studies'}</span>
            <span class="reason-tag">Q ${this.prelimsCurrentIdx + 1} of ${total}</span>
          </div>
          <div style="font-size:0.75rem;color:var(--text-faint);font-family:var(--font-mono);">
            ID: ${q.question_id}
          </div>
        </div>

        <!-- Question Body -->
        <div style="font-size:1.02rem;line-height:1.65;font-weight:500;color:var(--text-primary);margin-bottom:1.5rem;white-space:pre-line;">
          ${q.content}
        </div>

        ${q.image_url ? `
          <div style="margin-bottom:1.5rem;text-align:center;background:rgba(255,255,255,0.03);padding:12px;border-radius:var(--radius-sm);border:1px solid rgba(255,255,255,0.08);">
            <img src="${q.image_url}" alt="Diagram" style="max-width:100%;max-height:380px;object-fit:contain;border-radius:6px;" loading="lazy" />
          </div>
        ` : ''}

        <!-- Options -->
        <div style="margin-bottom:1.5rem;">
          ${optionsHtml}
        </div>

        <!-- Explanation if submitted -->
        ${this.prelimsSubmitted && q.explanation ? `
          <div style="margin-bottom:1.5rem;padding:1rem 1.25rem;background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.25);border-radius:var(--radius-sm);">
            <div style="font-weight:800;font-size:0.85rem;color:var(--accent-cyan);margin-bottom:0.35rem;">
              💡 UPSC Official Explanation:
            </div>
            <div style="font-size:0.84rem;color:var(--text-secondary);line-height:1.6;">${q.explanation}</div>
          </div>
        ` : ''}

        <!-- Nav Controls -->
        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:1rem;border-top:1px solid var(--border-subtle);">
          <button 
            class="btn-secondary" 
            style="padding:0.65rem 1.25rem;" 
            onclick="UPSCController.prevPrelimsQuestion()" 
            ${this.prelimsCurrentIdx === 0 ? 'disabled' : ''}>
            ← Previous
          </button>

          <div style="display:flex;gap:8px;">
            ${!this.prelimsSubmitted ? `
              <button 
                class="btn-primary" 
                style="background:var(--accent-cyan);color:#000;font-weight:800;padding:0.65rem 1.25rem;" 
                onclick="UPSCController.submitPrelimsQuiz()">
                🏁 Submit Prelims Quiz
              </button>
            ` : ''}
          </div>

          <button 
            class="btn-secondary" 
            style="padding:0.65rem 1.25rem;" 
            onclick="UPSCController.nextPrelimsQuestion()" 
            ${this.prelimsCurrentIdx === total - 1 ? 'disabled' : ''}>
            Next →
          </button>
        </div>

      </div>
    `;
  },

  getHistoryHtml() {
    if (!this.mainsHistory || this.mainsHistory.length === 0) {
      return `<div style="font-size:0.82rem;color:var(--text-muted);text-align:center;padding:1rem;">No previous UPSC written submissions found. Write and submit your first answer above!</div>`;
    }

    return this.mainsHistory.map(item => `
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;padding:0.85rem 1rem;background:rgba(255,255,255,0.02);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);margin-bottom:8px;">
        <div>
          <div style="font-weight:700;font-size:0.88rem;color:var(--text-primary);margin-bottom:2px;">
            ${item.question_title}
          </div>
          <div style="font-size:0.75rem;color:var(--text-muted);">
            ${item.paper} • ${item.word_count} words • ${item.created_at}
          </div>
        </div>
        <div style="text-align:right;">
          <span style="font-weight:800;font-size:1.1rem;color:var(--accent-neon);font-family:var(--font-mono);">
            ${item.total_score} / ${item.max_score}
          </span>
          <div style="font-size:0.72rem;color:var(--text-faint);">Civil Services Score</div>
        </div>
      </div>
    `).join('');
  },

  renderHistory() {
    const container = document.getElementById('upscHistoryContainer');
    if (container) {
      container.innerHTML = this.getHistoryHtml();
    }
  }
};

window.UPSCController = UPSCController;
