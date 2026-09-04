/**
 * Master Application Controller — Adaptive Student Intelligence Engine v4.0
 * JEE Main & NEET | Admin-Gated | Hyper-Realistic Gen-Z Mobile-First UI
 */
const AppState = {
  student: null,
  currentExam: 'JEE',
  gatewaySelectedTrack: 'JEE',
  graphView: null,
  _liveClockInterval: null,
  _kpiAnimInterval: null,

  async init() {
    this.graphView = new KnowledgeGraphView('graphCanvas');
    this._startLiveClock();

    // ── GATE 1: Admin must be authenticated first ──
    if (!AdminAuth.check()) return;  // AdminAuth.check() calls showLauncherScreen on success

    // ── GATE 2: Student session ──
    const storedStudentId = localStorage.getItem('adaptive_student_id');
    if (!storedStudentId) {
      this.showLauncherScreen();
      return;
    }

    try {
      this.student = await API.getProfile(storedStudentId);
      this.updateHeaderProfile();
      this._showStudentHeader(true);
      await this.refreshAllData();
      const history = await API.getAssessmentHistory(storedStudentId);
      if (!history || history.length === 0) {
        this.showDiagnosticGateway();
      }
    } catch (err) {
      console.warn('Profile load failed:', err);
      localStorage.removeItem('adaptive_student_id');
      this.showLauncherScreen();
    }

    AIAssistantController.renderChat();
  },

  // ─── Launcher (post-admin-login) ───────────────────────────
  showLauncherScreen() {
    // Set dynamic username in launcher welcome
    const currentUser = (typeof AdminAuth !== 'undefined' && AdminAuth.getLoggedInUser)
      ? AdminAuth.getLoggedInUser() : null;
    const usernameEl = document.getElementById('launcherUsername');
    if (usernameEl) usernameEl.innerText = currentUser
      ? currentUser.charAt(0).toUpperCase() + currentUser.slice(1)
      : 'Operator';

    // Hide the main app, show the launcher
    const launcher = document.getElementById('launcherModal');
    if (launcher) launcher.classList.add('active');
    // Close any open modals
    ['onboardingModal','resultModal','supportingModal','adminPanelModal'].forEach(id => {
      const m = document.getElementById(id);
      if (m) m.classList.remove('active');
    });
    this._showStudentHeader(false);
  },

  closeLauncher() {
    const launcher = document.getElementById('launcherModal');
    if (launcher) launcher.classList.remove('active');
  },

  // ─── Logout ────────────────────────────────────────────────
  logout() {
    localStorage.removeItem('adaptive_student_id');
    this.student = null;
    this._showStudentHeader(false);
    this.showLauncherScreen();
    this._toast('👋 Logged out. You can create a new account or re-enter.', 'info');
  },

  // ─── Diagnostic Gateway (onboarding modal) ─────────────────
  showDiagnosticGateway() {
    this.closeLauncher();
    const modal = document.getElementById('onboardingModal');
    if (modal) {
      modal.classList.add('active');
      this.selectGatewayTrack(this.currentExam || 'JEE');
    }
  },

  showOnboardingModal() { this.showDiagnosticGateway(); },

  selectGatewayTrack(track) {
    this.gatewaySelectedTrack = track;
    document.getElementById('trackCardJEE')?.classList.toggle('active', track === 'JEE');
    document.getElementById('trackCardNEET')?.classList.toggle('active', track === 'NEET');
  },

  // ─── Guest Account (instant) ────────────────────────────────
  async createGuestAccount() {
    this.closeLauncher();
    const guestName = 'Guest_' + Math.floor(1000 + Math.random() * 9000);
    const el = document.getElementById('onboardName');
    if (el) el.value = guestName;
    this.gatewaySelectedTrack = 'JEE';
    this.showDiagnosticGateway();
  },

  // ─── New Student Account ───────────────────────────────────
  newStudentAccount() {
    this.closeLauncher();
    const el = document.getElementById('onboardName');
    if (el) el.value = '';
    this.showDiagnosticGateway();
  },

  // ─── Start Compulsory Diagnostic ──────────────────────────
  async startCompulsoryDiagnostic() {
    let name = document.getElementById('onboardName')?.value.trim();
    if (!name) name = 'Aspirant_' + Math.floor(100 + Math.random() * 900);
    const track = this.gatewaySelectedTrack || 'JEE';
    const email = `aspirant_${Date.now()}_${Math.floor(Math.random()*1000)}@adaptive.local`;

    const btn = document.getElementById('onboardSubmitBtn');
    if (btn) { btn.disabled = true; btn.innerText = '⚡ Initializing Diagnostic AI Engine…'; }

    try {
      let reg;
      try {
        reg = await API.register({ name, email, password: 'student_pass', target_exam: track, daily_available_hours: 4.0 });
      } catch {
        reg = await API.register({ name, email: `user_${Date.now()}@adaptive.local`, password: 'student_pass', target_exam: track, daily_available_hours: 4.0 });
      }

      this.student = reg;
      this.currentExam = track;
      localStorage.setItem('adaptive_student_id', reg.student_id);

      document.getElementById('onboardingModal')?.classList.remove('active');
      this.updateHeaderProfile();
      this._showStudentHeader(true);
      this._toast(`🚀 Welcome ${name}! Compulsory Diagnostic Starting…`, 'success');
      await QuizController.startTest(track, 'DIAGNOSTIC', 1);
      AIAssistantController.renderChat();
    } catch (err) {
      this._toast('Error starting diagnostic: ' + err.message, 'error');
      if (btn) { btn.disabled = false; btn.innerText = '🚀 Launch Compulsory Diagnostic Quiz →'; }
    }
  },

  // ─── Header / Profile ─────────────────────────────────────
  updateHeaderProfile() {
    if (!this.student) return;
    const el = id => document.getElementById(id);
    if (el('userNameDisplay')) el('userNameDisplay').innerText = this.student.name;
    if (el('userExamBadge')) el('userExamBadge').innerText = this.student.target_exam === 'JEE' ? 'JEE Main' : 'NEET-UG';
    if (el('userAvatarDisplay')) el('userAvatarDisplay').innerText = this.student.name.charAt(0).toUpperCase();
    this.currentExam = this.student.target_exam || 'JEE';
    document.body.className = (this.currentExam === 'NEET' ? 'theme-neet' : 'theme-jee');
    document.querySelectorAll('.exam-pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.exam === this.currentExam);
    });
  },

  _showStudentHeader(visible) {
    const els = document.querySelectorAll('.student-session-only');
    els.forEach(el => el.style.display = visible ? '' : 'none');
    const logoutBtn = document.getElementById('headerLogoutBtn');
    if (logoutBtn) logoutBtn.style.display = visible ? 'flex' : 'none';
  },

  // ─── Exam Switcher ────────────────────────────────────────
  async switchExam(examId) {
    this.currentExam = examId;
    document.body.className = (examId === 'NEET' ? 'theme-neet' : 'theme-jee');
    document.querySelectorAll('.exam-pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.exam === examId);
    });
    await this.refreshAllData();
  },

  // ─── Tab Switcher ────────────────────────────────────────
  switchTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.bottom-nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`pane_${tabId}`)?.classList.add('active');
    document.getElementById(`nav_${tabId}`)?.classList.add('active');
    document.getElementById(`bnav_${tabId}`)?.classList.add('active');
    if (tabId === 'graph' && this.graphView) setTimeout(() => this.graphView.resize(), 50);
    if (tabId === 'assignment' && typeof AssignmentController !== 'undefined') {
      AssignmentController.init();
    }
  },

  // ─── Live Clock ───────────────────────────────────────────
  _startLiveClock() {
    const tick = () => {
      const el = document.getElementById('liveClock');
      if (!el) return;
      const now = new Date();
      el.innerText = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };
    tick();
    this._liveClockInterval = setInterval(tick, 1000);
  },

  // ─── Animated KPI Counter ────────────────────────────────
  _animateCount(id, target, suffix = '%', duration = 800) {
    const el = document.getElementById(id);
    if (!el) return;
    const start = parseFloat(el.innerText) || 0;
    const diff = target - start;
    const steps = 30;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      const val = start + diff * (step / steps);
      el.innerText = (diff >= 0 ? '' : '') + val.toFixed(0) + suffix;
      if (step >= steps) { el.innerText = target.toFixed(0) + suffix; clearInterval(interval); }
    }, duration / steps);
  },

  // ─── Refresh All Data ─────────────────────────────────────
  async refreshAllData() {
    if (!this.student) return;
    const studentId = this.student.student_id;

    // Show shimmer loading state
    this._setEl('overallMasteryVal', `<span class="shimmer-text">—%</span>`);
    this._setEl('overallConfidenceVal', `<span class="shimmer-text">—%</span>`);

    const [profile, roadmapData, nextAction, graphData, weaknesses, telemetry] = await Promise.allSettled([
      API.getProfile(studentId),
      API.getActiveRoadmap(studentId),
      API.getNextAction(studentId),
      API.getKnowledgeGraph(this.currentExam, studentId),
      API.getWeaknesses(studentId),
      API.getTelemetryStream(studentId)
    ]);

    // ── 1. Profile & ML Stats ──
    if (profile.status === 'fulfilled') {
      this.student = profile.value;
      const mastery = Math.round((this.student.overall_mastery || 0) * 100);
      const confidence = Math.round((this.student.overall_confidence || 0) * 100);
      this._animateCount('overallMasteryVal', mastery, '%');
      this._animateCount('overallConfidenceVal', confidence, '%');
      if (typeof RoadmapVisualizer !== 'undefined') {
        RoadmapVisualizer.renderDashboardProgressRing('dashboardProgressRingContainer', mastery);
      }
    }

    // ── 2. Roadmap & NBA ──
    const roadmap = roadmapData.status === 'fulfilled' ? roadmapData.value : null;
    const nba = nextAction.status === 'fulfilled' ? nextAction.value : null;
    RoadmapController.renderRoadmapView(roadmap, nba);
    if (roadmap?.actions && typeof RoadmapVisualizer !== 'undefined') {
      RoadmapVisualizer.renderNextThreeActions('dashboardNextActionsContainer', roadmap.actions);
    }

    // ── 3. Knowledge Graph ──
    if (graphData.status === 'fulfilled') {
      if (this.graphView) this.graphView.loadGraphData(graphData.value);
      const nodes = graphData.value.nodes || [];
      const masteredNodes = nodes.filter(n => (n.mastery || 0) > 0);
      const avgMastery = masteredNodes.length > 0
        ? masteredNodes.reduce((acc, n) => acc + n.mastery, 0) / masteredNodes.length : 0;
      const bktPct = Math.round(avgMastery * 100);
      const theta = (avgMastery - 0.5) * 4.0;
      this._animateCount('bktProbabilityVal', bktPct, '%');
      const irtEl = document.getElementById('irtAbilityVal');
      if (irtEl) irtEl.innerText = (theta >= 0 ? '+' : '') + theta.toFixed(2);
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
      <div class="weakness-item" style="animation:fadeInUp 0.3s ease ${idx * 0.08}s both;">
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
    toast.style.cssText = `position:fixed;bottom:90px;left:50%;transform:translateX(-50%) translateY(0);background:${colors[type]};color:#fff;padding:10px 22px;border-radius:100px;font-size:0.88rem;font-weight:700;z-index:99999;box-shadow:0 4px 24px rgba(0,0,0,0.5);white-space:nowrap;animation:toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1);`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(-50%) translateY(20px)'; toast.style.transition = 'all 0.3s ease'; setTimeout(() => toast.remove(), 300); }, 3000);
  }
};

window.addEventListener('DOMContentLoaded', () => { AppState.init(); });
