/**
 * Master Application Controller — Adaptive Student Intelligence Engine
 * JEE Main & NEET | Hyper-Realistic Gen-Z Mobile-First UI
 */
const AppState = {
  student: null,
  currentExam: 'JEE',
  gatewaySelectedTrack: 'JEE',
  graphView: null,

  async init() {
    this.graphView = new KnowledgeGraphView('graphCanvas');

    let storedStudentId = localStorage.getItem('adaptive_student_id');
    if (!storedStudentId) {
      this.showDiagnosticGateway();
    } else {
      try {
        this.student = await API.getProfile(storedStudentId);
        this.updateHeaderProfile();
        await this.refreshAllData();

        // Check if student has taken at least 1 assessment
        const history = await API.getAssessmentHistory(storedStudentId);
        if (!history || history.length === 0) {
          // Compulsory quiz not yet completed
          this.showDiagnosticGateway();
        }
      } catch (err) {
        console.warn('Profile load failed, re-onboarding:', err);
        localStorage.removeItem('adaptive_student_id');
        this.showDiagnosticGateway();
      }
    }

    AIAssistantController.renderChat();
  },

  showDiagnosticGateway() {
    const modal = document.getElementById('onboardingModal');
    if (modal) {
      modal.classList.add('active');
      this.selectGatewayTrack(this.currentExam || 'JEE');
    }
  },

  showOnboardingModal() {
    this.showDiagnosticGateway();
  },

  selectGatewayTrack(track) {
    this.gatewaySelectedTrack = track;
    const jeeCard = document.getElementById('trackCardJEE');
    const neetCard = document.getElementById('trackCardNEET');
    if (jeeCard) jeeCard.classList.toggle('active', track === 'JEE');
    if (neetCard) neetCard.classList.toggle('active', track === 'NEET');
  },

  async startCompulsoryDiagnostic() {
    let name = document.getElementById('onboardName')?.value.trim();
    if (!name) {
      name = 'Aspirant ' + Math.floor(100 + Math.random() * 900);
    }
    const track = this.gatewaySelectedTrack || 'JEE';
    const email = `aspirant_${Date.now()}_${Math.floor(Math.random()*1000)}@adaptive.local`;

    const btn = document.getElementById('onboardSubmitBtn');
    if (btn) {
      btn.disabled = true;
      btn.innerText = '⚡ Initializing Diagnostic AI Engine…';
    }

    try {
      let reg;
      try {
        reg = await API.register({
          name,
          email,
          password: 'student_pass',
          target_exam: track,
          daily_available_hours: 4.0
        });
      } catch (e) {
        // Fallback or retry with new email
        const fallbackEmail = `user_${Date.now()}@adaptive.local`;
        reg = await API.register({
          name,
          email: fallbackEmail,
          password: 'student_pass',
          target_exam: track,
          daily_available_hours: 4.0
        });
      }

      this.student = reg;
      this.currentExam = track;
      localStorage.setItem('adaptive_student_id', reg.student_id);

      const modal = document.getElementById('onboardingModal');
      if (modal) modal.classList.remove('active');

      this.updateHeaderProfile();
      this._toast(`🚀 Welcome ${name}! Compulsory Diagnostic Started.`, 'success');

      // Immediately launch the compulsory diagnostic assessment
      await QuizController.startTest(track, 'DIAGNOSTIC', 1);

    } catch (err) {
      this._toast('Error starting diagnostic: ' + err.message, 'error');
      if (btn) {
        btn.disabled = false;
        btn.innerText = '🚀 Launch Compulsory Diagnostic Quiz →';
      }
    }
  },

  updateHeaderProfile() {
    if (!this.student) return;
    const nameElem = document.getElementById('userNameDisplay');
    const examBadge = document.getElementById('userExamBadge');
    const avatar = document.getElementById('userAvatarDisplay');
    if (nameElem) nameElem.innerText = this.student.name;
    if (examBadge) examBadge.innerText = this.student.target_exam === 'JEE' ? 'JEE Main' : 'NEET-UG';
    if (avatar) avatar.innerText = this.student.name.charAt(0).toUpperCase();
    this.currentExam = this.student.target_exam || 'JEE';
    document.body.className = (this.currentExam === 'NEET' ? 'theme-neet' : 'theme-jee');
    document.querySelectorAll('.exam-pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.exam === this.currentExam);
    });
  },

  async switchExam(examId) {
    this.currentExam = examId;
    document.body.className = (examId === 'NEET' ? 'theme-neet' : 'theme-jee');
    document.querySelectorAll('.exam-pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.exam === examId);
    });
    await this.refreshAllData();
  },

  switchTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.bottom-nav-item').forEach(el => el.classList.remove('active'));
    const targetPane = document.getElementById(`pane_${tabId}`);
    const targetNav = document.getElementById(`nav_${tabId}`);
    const targetBottom = document.getElementById(`bnav_${tabId}`);
    if (targetPane) targetPane.classList.add('active');
    if (targetNav) targetNav.classList.add('active');
    if (targetBottom) targetBottom.classList.add('active');
    if (tabId === 'graph' && this.graphView) { setTimeout(() => this.graphView.resize(), 50); }
  },

  async refreshAllData() {
    if (!this.student) return;
    const studentId = this.student.student_id;

    // Run all fetches in parallel — each failure is handled independently
    const [profile, roadmapData, nextAction, graphData, weaknesses, telemetry] = await Promise.allSettled([
      API.getProfile(studentId),
      API.getActiveRoadmap(studentId),
      API.getNextAction(studentId),       // May 404 — that's OK
      API.getKnowledgeGraph(this.currentExam, studentId),
      API.getWeaknesses(studentId),
      API.getTelemetryStream(studentId)
    ]);

    // ── 1. Profile & ML Stats ──
    if (profile.status === 'fulfilled') {
      this.student = profile.value;
      const mastery = Math.round((this.student.overall_mastery || 0) * 100);
      const confidence = Math.round((this.student.overall_confidence || 0) * 100);
      this._setEl('overallMasteryVal', `${mastery}%`);
      this._setEl('overallConfidenceVal', `${confidence}%`);
      if (typeof RoadmapVisualizer !== 'undefined') {
        RoadmapVisualizer.renderDashboardProgressRing('dashboardProgressRingContainer', mastery);
      }
    }

    // ── 2. Roadmap & NBA ──
    const roadmap = roadmapData.status === 'fulfilled' ? roadmapData.value : null;
    const nba = nextAction.status === 'fulfilled' ? nextAction.value : null;
    RoadmapController.renderRoadmapView(roadmap, nba);
    if (roadmap && roadmap.actions && typeof RoadmapVisualizer !== 'undefined') {
      RoadmapVisualizer.renderNextThreeActions('dashboardNextActionsContainer', roadmap.actions);
    }

    // ── 3. Knowledge Graph ──
    if (graphData.status === 'fulfilled') {
      if (this.graphView) this.graphView.loadGraphData(graphData.value);
      const nodes = graphData.value.nodes || [];
      const masteredNodes = nodes.filter(n => (n.mastery || 0) > 0);
      const avgMastery = masteredNodes.length > 0
        ? masteredNodes.reduce((acc, n) => acc + n.mastery, 0) / masteredNodes.length : 0;
      const bktElem = document.getElementById('bktProbabilityVal');
      const irtElem = document.getElementById('irtAbilityVal');
      if (bktElem) bktElem.innerText = `${Math.round(avgMastery * 100)}%`;
      if (irtElem) {
        const theta = (avgMastery - 0.5) * 4.0;
        irtElem.innerText = (theta >= 0 ? '+' : '') + theta.toFixed(2);
      }
    }

    // ── 4. Weaknesses ──
    if (weaknesses.status === 'fulfilled') {
      this.renderWeaknessesList(weaknesses.value);
    } else {
      this._setEl('weaknessRankingList', `<div style="color:var(--text-secondary);padding:1rem;">Take a quiz to reveal your weakness profile.</div>`);
    }

    // ── 5. Telemetry ──
    if (telemetry.status === 'fulfilled') {
      this.renderTelemetryStream(telemetry.value);
    } else {
      this._setEl('telemetryStreamContainer', `<div style="color:var(--text-secondary);padding:1rem;">No telemetry events yet.</div>`);
    }
  },

  renderWeaknessesList(weaknesses) {
    const listElem = document.getElementById('weaknessRankingList');
    if (!listElem) return;
    if (!weaknesses || weaknesses.length === 0) {
      listElem.innerHTML = `<div style="color:var(--text-secondary);padding:1rem;text-align:center;">
        <div style="font-size:2rem;margin-bottom:0.5rem;">🌟</div>
        No critical weaknesses! Keep taking quizzes to map your profile.
      </div>`;
      return;
    }
    listElem.innerHTML = weaknesses.slice(0, 5).map((w, idx) => `
      <div class="weakness-item">
        <div class="weakness-rank">${idx + 1}</div>
        <div class="weakness-body">
          <div class="weakness-name">${w.concept_name} <span class="weakness-sub">${w.subject}</span></div>
          <div class="weakness-reasons">${(w.reasons || []).map(r => `<span class="reason-tag">${r}</span>`).join('')}</div>
        </div>
        <div class="weakness-score" style="color:${w.mastery < 0.35 ? 'var(--accent-rose)' : w.mastery < 0.6 ? 'var(--accent-amber)' : 'var(--accent-emerald)'};">
          ${Math.round(w.mastery * 100)}%
        </div>
      </div>
    `).join('');
  },

  renderTelemetryStream(events) {
    const streamElem = document.getElementById('telemetryStreamContainer');
    if (!streamElem) return;
    if (!events || events.length === 0) {
      streamElem.innerHTML = `<div style="color:var(--text-secondary);padding:1rem;">No telemetry events recorded yet.</div>`;
      return;
    }
    streamElem.innerHTML = events.slice(0, 12).map(e => `
      <div class="telemetry-row">
        <span class="telem-time">${new Date(e.timestamp).toLocaleTimeString()}</span>
        <span class="telem-dot">•</span>
        <strong class="telem-type">${e.event_type}</strong>
        ${e.resource_id ? `<span class="telem-resource">[${e.resource_id.slice(0,14)}]</span>` : ''}
      </div>
    `).join('');
  },

  _setEl(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  },

  _toast(msg, type = 'info') {
    const colors = { success: '#10b981', warn: '#f59e0b', error: '#f43f5e', info: '#6366f1' };
    const toast = document.createElement('div');
    toast.className = 'app-toast';
    toast.style.cssText = `position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:${colors[type]};color:#fff;padding:10px 20px;border-radius:100px;font-size:0.88rem;font-weight:700;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.4);animation:toastIn 0.3s ease;`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
};

window.addEventListener('DOMContentLoaded', () => { AppState.init(); });
