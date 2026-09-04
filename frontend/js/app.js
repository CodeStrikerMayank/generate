/**
 * Master Application Controller — Adaptive Student Intelligence Engine v4.3
 * JEE Main, NEET-UG & UPSC CSE | 2-Step Auth Portal | Feature Gate Lock | Quiz Fullscreen
 */
const AppState = {
  student: null,
  currentExam: 'JEE',
  lockedExam: null,
  lockedSubjects: [],
  isExamLocked: false,
  hasCompletedFirstQuiz: false,
  targetDomain: 'JEE',
  activeUserProfile: { role: 'STUDENT', name: 'Aspirant', age: '17' },
  graphView: null,
  _liveClockInterval: null,
  _kpiAnimInterval: null,
  _quizFullscreen: false,

  async init() {
    this.graphView = new KnowledgeGraphView('graphCanvas');
    this._startLiveClock();

    // ── GATE 1: User Identity Portal (2-Step: Credentials → Role) ──
    if (!AdminAuth.check()) return;

    // ── GATE 2: Student session with locked exam & subjects ──
    const storedStudentId = localStorage.getItem('adaptive_student_id');
    const storedLockedExam = localStorage.getItem('adaptive_locked_exam');
    const storedSubjects = localStorage.getItem('adaptive_locked_subjects');
    this.hasCompletedFirstQuiz = localStorage.getItem('adaptive_has_first_quiz') === '1';

    if (storedSubjects) {
      try { this.lockedSubjects = JSON.parse(storedSubjects); } catch { this.lockedSubjects = []; }
    }

    if (!storedStudentId) {
      this.showDomainSelectScreen();
      return;
    }

    try {
      this.student = await API.getProfile(storedStudentId);
      this.currentExam = storedLockedExam || this.student.target_exam || 'JEE';
      this.lockedExam = this.currentExam;
      this.isExamLocked = true;
      this.updateHeaderProfile();
      this._showStudentHeader(true);
      this.buildExamNav(this.currentExam);   // ← exam-specific sidebar/bottom nav
      await this.refreshAllData();

      if (this.currentExam === 'UPSC') {
        this.switchTab('upsc');
      } else {
        const history = await API.getAssessmentHistory(storedStudentId);
        if (!history || history.length === 0) {
          // First quiz not done yet — trigger diagnostic immediately
          this.hasCompletedFirstQuiz = false;
          await QuizController.startTest(this.currentExam, 'DIAGNOSTIC', 1);
        } else {
          this.hasCompletedFirstQuiz = true;
          localStorage.setItem('adaptive_has_first_quiz', '1');
          this.switchTab('dashboard');
        }
      }
    } catch (err) {
      console.warn('Profile load failed:', err);
      localStorage.removeItem('adaptive_student_id');
      localStorage.removeItem('adaptive_locked_exam');
      localStorage.removeItem('adaptive_locked_subjects');
      this.showDomainSelectScreen();
    }

    AIAssistantController.renderChat();
  },

  // ─── Build Exam-Specific Nav (Hides irrelevant tabs) ──────────
  buildExamNav(examId) {
    // Map: each nav id → which exams show it
    const NAV_VISIBILITY = {
      'nav_dashboard':   ['JEE','NEET','UPSC'],
      'nav_quiz':        ['JEE','NEET','UPSC'],
      'nav_assignment':  ['JEE','NEET'],
      'nav_roadmap':     ['JEE','NEET','UPSC'],
      'nav_ai':          ['JEE','NEET','UPSC'],
      'nav_graph':       ['JEE','NEET'],
      'nav_upsc':        ['UPSC'],
      // Bottom nav
      'bnav_dashboard':  ['JEE','NEET','UPSC'],
      'bnav_quiz':       ['JEE','NEET','UPSC'],
      'bnav_assignment': ['JEE','NEET'],
      'bnav_roadmap':    ['JEE','NEET','UPSC'],
      'bnav_ai':         ['JEE','NEET','UPSC'],
    };
    for (const [navId, allowedExams] of Object.entries(NAV_VISIBILITY)) {
      const el = document.getElementById(navId);
      if (el) el.style.display = allowedExams.includes(examId) ? '' : 'none';
    }
  },

  // ─── Screen 2: Domain & Subject Customization Panel ─────────
  showDomainSelectScreen(userProfile) {
    if (userProfile) {
      this.activeUserProfile = userProfile;
    } else if (typeof AdminAuth !== 'undefined' && AdminAuth.getUserProfile) {
      this.activeUserProfile = AdminAuth.getUserProfile();
    }

    const nameEl = document.getElementById('domainProfileName');
    const ageEl = document.getElementById('domainProfileAge');
    const roleEl = document.getElementById('domainProfileRole');
    if (nameEl) nameEl.innerText = this.activeUserProfile.name || 'Aspirant';
    if (ageEl) ageEl.innerText = this.activeUserProfile.age || '17';
    if (roleEl) roleEl.innerText = (this.activeUserProfile.role || 'STUDENT').toUpperCase();

    const launcher = document.getElementById('launcherModal');
    if (launcher) launcher.classList.add('active');
    ['onboardingModal','resultModal','supportingModal','adminPanelModal','systemBufferingOverlay','portalAuthOverlay'].forEach(id => {
      const m = document.getElementById(id);
      if (m && id !== 'launcherModal') m.classList.remove('active');
    });
    this._showStudentHeader(false);
  },

  showLauncherScreen() {
    this.showDomainSelectScreen();
  },

  closeLauncher() {
    const launcher = document.getElementById('launcherModal');
    if (launcher) launcher.classList.remove('active');
  },

  setTargetDomain(domain) {
    this.targetDomain = domain;
    ['JEE', 'NEET', 'UPSC'].forEach(d => {
      const card = document.getElementById(`domainCard_${d}`);
      if (card) card.classList.toggle('active-domain', d === domain);
    });
  },

  getSelectedSubjectsForDomain(domain) {
    let selector = 'input[name="subject_jee"]:checked';
    if (domain === 'NEET') selector = 'input[name="subject_neet"]:checked';
    else if (domain === 'UPSC') selector = 'input[name="subject_upsc"]:checked';

    const checkedNodes = document.querySelectorAll(selector);
    const subjects = Array.from(checkedNodes).map(cb => cb.value);
    return subjects.length > 0 ? subjects : (domain === 'JEE' ? ['Physics','Chemistry','Mathematics'] : domain === 'NEET' ? ['Biology','Physics','Chemistry'] : ['General Studies','CSAT','Mains Written']);
  },

  // ─── Calibrate Engine & Lock Domain ───────────────────────
  async calibrateAndLockDomain() {
    const examId = this.targetDomain || 'JEE';
    const subjects = this.getSelectedSubjectsForDomain(examId);
    const name = this.activeUserProfile.name || 'Aspirant';
    const age = this.activeUserProfile.age || '17';
    const role = this.activeUserProfile.role || 'STUDENT';

    this.closeLauncher();

    const examTitles = {
      JEE: 'JEE Main & Advanced',
      NEET: 'NEET-UG Medical',
      UPSC: 'UPSC Civil Services'
    };
    const examTitle = examTitles[examId] || examId;

    // 1. Show Ultra-Aesthetic Sci-Fi HUD Buffering Animation
    this._showBufferingOverlay({ examId, examTitle, subjects, name, age, role });

    // 2. Perform cybernetic calibration steps with animated progress bar and logs
    await this._runBufferingCalibrationSequence({ examId, examTitle, subjects, name, age, role });

    // 3. Register or setup student in backend
    try {
      const email = `candidate_${Date.now()}_${Math.floor(Math.random() * 1000)}@adaptive.local`;
      let reg;
      try {
        reg = await API.register({ name, email, password: 'student_pass', target_exam: examId, daily_available_hours: 4.0 });
      } catch {
        reg = await API.register({ name, email: `user_${Date.now()}@adaptive.local`, password: 'student_pass', target_exam: examId, daily_available_hours: 4.0 });
      }

      this.student = reg;
      this.currentExam = examId;
      this.lockedExam = examId;
      this.lockedSubjects = subjects;
      this.isExamLocked = true;
      localStorage.setItem('adaptive_student_id', reg.student_id);
      localStorage.setItem('adaptive_locked_exam', examId);
      localStorage.setItem('adaptive_locked_subjects', JSON.stringify(subjects));

      this.updateHeaderProfile();
      this._showStudentHeader(true);

      // Hide buffering overlay
      this._hideBufferingOverlay();

      this._toast(`🔒 Engine locked to ${examTitle} (${subjects.join(', ')})! Welcome ${name}.`, 'success');

      // 4. Navigate into tailored workspace
      if (examId === 'UPSC') {
        this.switchTab('upsc');
      } else {
        await this.refreshAllData();
        const history = await API.getAssessmentHistory(reg.student_id);
        if (!history || history.length === 0) {
          await QuizController.startTest(examId, 'DIAGNOSTIC', 1);
        } else {
          this.switchTab('dashboard');
        }
      }

      AIAssistantController.renderChat();
    } catch (err) {
      this._hideBufferingOverlay();
      this._toast('Error calibrating stream: ' + err.message, 'error');
      this.showDomainSelectScreen();
    }
  },

  // Backwards compatibility alias
  selectAndLockExam(examId) {
    this.setTargetDomain(examId);
    return this.calibrateAndLockDomain();
  },

  // ─── Ultra-Aesthetic Sci-Fi HUD Buffering Controls ────────
  _showBufferingOverlay({ examId, examTitle, subjects, name, age, role }) {
    const overlay = document.getElementById('systemBufferingOverlay');
    const targetText = document.getElementById('bufferingTargetExamText');
    const candDisp = document.getElementById('buffCandidateDisp');
    const domDisp = document.getElementById('buffDomainDisp');
    const bar = document.getElementById('bufferingProgressBar');
    const status = document.getElementById('bufferingStatusText');
    const pct = document.getElementById('bufferingPctText');

    if (targetText) targetText.innerText = `${examTitle} (${subjects.join(', ')})`;
    if (candDisp) candDisp.innerText = `${name} (${role}, Age ${age})`;
    if (domDisp) domDisp.innerText = `${examTitle}`;
    if (bar) bar.style.width = '0%';
    if (status) status.innerText = 'Initializing cognitive neural parameters…';
    if (pct) pct.innerText = '0%';

    if (overlay) overlay.classList.add('active');
  },

  _hideBufferingOverlay() {
    const overlay = document.getElementById('systemBufferingOverlay');
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.classList.remove('active');
        overlay.style.opacity = '';
      }, 400);
    }
  },

  async _runBufferingCalibrationSequence({ examId, examTitle, subjects, name, age, role }) {
    const bar = document.getElementById('bufferingProgressBar');
    const status = document.getElementById('bufferingStatusText');
    const pct = document.getElementById('bufferingPctText');

    const steps = [
      { progress: 18, log: `[0.10s] IDENTITY_VERIFIED // Aspirant: ${name} (${role}, Age: ${age}) authenticated`, delay: 360 },
      { progress: 42, log: `[0.45s] DOMAIN_MOUNT // Initializing ${examTitle} curriculum vector matrix…`, delay: 380 },
      { progress: 68, log: `[0.85s] SUBJECT_SCOPE // Binding target focus modules: [${subjects.join(', ')}]…`, delay: 380 },
      { progress: 88, log: `[1.30s] VAULT_LINK // Mounting 405k ExamBench items & authentic paper crops…`, delay: 360 },
      { progress: 100, log: `[1.75s] COGNITIVE_LOCK // BKT/IRT tensors calibrated. Session locked to ${examId}!`, delay: 320 }
    ];

    for (const s of steps) {
      if (bar) bar.style.width = `${s.progress}%`;
      if (pct) pct.innerText = `${s.progress}%`;
      if (status) status.innerText = s.log;
      await new Promise(resolve => setTimeout(resolve, s.delay));
    }
  },

  // ─── Logout (Clears Lock & Returns to Auth Portal) ─────────
  logout() {
    localStorage.removeItem('adaptive_student_id');
    localStorage.removeItem('adaptive_locked_exam');
    localStorage.removeItem('adaptive_locked_subjects');
    this.student = null;
    this.lockedExam = null;
    this.lockedSubjects = [];
    this.isExamLocked = false;
    this._showStudentHeader(false);
    if (typeof AdminAuth !== 'undefined' && AdminAuth.returnToAuthPortal) {
      AdminAuth.returnToAuthPortal();
    } else {
      this.showDomainSelectScreen();
    }
    this._toast('👋 Logged out. Choose your identity to initiate a new session.', 'info');
  },

  promptLogoutToSwitch() {
    if (confirm(`Switching domains requires ending your current session and re-authenticating.\n\nLogout now to select a new identity and domain?`)) {
      this.logout();
    }
  },

  // ─── Header / Profile ─────────────────────────────────────
  updateHeaderProfile() {
    if (!this.student) return;
    const el = id => document.getElementById(id);
    if (el('userNameDisplay')) el('userNameDisplay').innerText = this.student.name;
    if (el('userExamBadge')) {
      if (this.currentExam === 'JEE') el('userExamBadge').innerText = 'JEE Main';
      else if (this.currentExam === 'NEET') el('userExamBadge').innerText = 'NEET-UG';
      else if (this.currentExam === 'UPSC') el('userExamBadge').innerText = 'UPSC CSE';
    }
    if (el('userAvatarDisplay')) el('userAvatarDisplay').innerText = this.student.name.charAt(0).toUpperCase();

    // Locked Indicator Header
    const lockedTitle = el('lockedExamTitle');
    if (lockedTitle) {
      const subjStr = this.lockedSubjects.length ? ` (${this.lockedSubjects.join(', ')})` : '';
      if (this.currentExam === 'JEE') lockedTitle.innerText = `LOCKED: JEE Main${subjStr}`;
      else if (this.currentExam === 'NEET') lockedTitle.innerText = `LOCKED: NEET-UG${subjStr}`;
      else if (this.currentExam === 'UPSC') lockedTitle.innerText = `LOCKED: UPSC CSE${subjStr}`;
    }
    const lockedIndicator = el('examLockedIndicator');
    if (lockedIndicator) lockedIndicator.style.display = 'inline-flex';

    // Apply exam theme class
    document.body.className = '';
    if (this.currentExam === 'NEET') document.body.classList.add('theme-neet');
    else if (this.currentExam === 'UPSC') document.body.classList.add('theme-upsc');
    // JEE uses default — no extra class needed
  },

  _showStudentHeader(visible) {
    const els = document.querySelectorAll('.student-session-only');
    els.forEach(el => el.style.display = visible ? '' : 'none');
    const logoutBtn = document.getElementById('headerLogoutBtn');
    if (logoutBtn) logoutBtn.style.display = visible ? 'flex' : 'none';
    const lockedIndicator = document.getElementById('examLockedIndicator');
    if (lockedIndicator) lockedIndicator.style.display = visible ? 'inline-flex' : 'none';
  },

  // ─── Exam Switcher (STRICT LOCK ENFORCEMENT) ───────────────
  async switchExam(examId) {
    if (this.isExamLocked && examId !== this.lockedExam) {
      const examTitles = {
        JEE: 'JEE Main (PCM)',
        NEET: 'NEET-UG (PCB)',
        UPSC: 'UPSC Civil Services'
      };
      this._toast(`🔒 Session is locked to ${examTitles[this.lockedExam] || this.lockedExam}. To switch exams, please Logout.`, 'warning');
      return;
    }
    this.currentExam = examId;
    this.updateHeaderProfile();
    if (examId === 'UPSC') {
      this.switchTab('upsc');
    } else {
      await this.refreshAllData();
    }
  },

  // ─── Tab Switcher (with first-quiz feature gate) ─────────
  switchTab(tabId) {
    // ── Feature Gate: Block all non-quiz tabs until first quiz complete ──
    const GATED_TABS = ['roadmap','graph','ai','assignment','upsc'];
    if (!this.hasCompletedFirstQuiz && GATED_TABS.includes(tabId) && this.student) {
      this._toast('🔒 Complete your first diagnostic quiz to unlock all features!', 'warn');
      this._showFirstQuizGate();
      return;
    }
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
    if (tabId === 'upsc' && typeof UPSCController !== 'undefined') {
      UPSCController.init();
    }
  },

  // ─── First-Quiz Gate Overlay ─────────────────────────────
  _showFirstQuizGate() {
    const pane = document.getElementById('pane_quiz');
    if (!pane) return;
    const gateEl = document.getElementById('firstQuizGateOverlay');
    if (gateEl) { gateEl.style.display = 'flex'; return; }
    // Show quiz pane with a nice info card
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
    pane.classList.add('active');
    document.getElementById('nav_quiz')?.classList.add('active');
    document.getElementById('bnav_quiz')?.classList.add('active');
  },

  markFirstQuizComplete() {
    this.hasCompletedFirstQuiz = true;
    localStorage.setItem('adaptive_has_first_quiz', '1');
    const gate = document.getElementById('firstQuizGateOverlay');
    if (gate) gate.style.display = 'none';
    this._toast('🎉 First quiz complete! All features are now unlocked.', 'success');
  },

  // ─── Quiz Fullscreen Mode ────────────────────────────────
  enterQuizFullscreen() {
    document.body.classList.add('quiz-fullscreen');
    this._quizFullscreen = true;
    const exitBtn = document.getElementById('quizExitFullscreenBtn');
    if (exitBtn) exitBtn.style.display = 'flex';
    // Request browser fullscreen if supported
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch (_) {}
  },

  exitQuizFullscreen() {
    document.body.classList.remove('quiz-fullscreen');
    this._quizFullscreen = false;
    try {
      if (document.exitFullscreen && document.fullscreenElement) document.exitFullscreen();
    } catch (_) {}
    const exitBtn = document.getElementById('quizExitFullscreenBtn');
    if (exitBtn) exitBtn.style.display = 'none';
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
    const styles = {
      success: 'background:rgba(74,222,128,0.12);border:1px solid rgba(74,222,128,0.3);color:#4ade80;',
      warn:    'background:rgba(250,204,21,0.12);border:1px solid rgba(250,204,21,0.3);color:#facc15;',
      error:   'background:rgba(248,113,113,0.12);border:1px solid rgba(248,113,113,0.3);color:#f87171;',
      info:    'background:rgba(100,255,218,0.08);border:1px solid rgba(100,255,218,0.25);color:#64ffda;'
    };
    const style = styles[type] || styles.info;
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed;bottom:90px;left:50%;transform:translateX(-50%) translateY(0);${style}backdrop-filter:blur(16px);padding:10px 22px;border-radius:100px;font-size:0.88rem;font-weight:700;z-index:99999;box-shadow:0 4px 24px rgba(0,0,0,0.5);white-space:nowrap;animation:toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1);font-family:'Outfit',sans-serif;`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(-50%) translateY(20px)'; toast.style.transition = 'all 0.3s ease'; setTimeout(() => toast.remove(), 300); }, 3200);
  }
};

window.AppState = AppState;
window.addEventListener('DOMContentLoaded', () => { AppState.init(); });

