/**
 * Master Application Controller with Mobile & Gen-Z Onboarding (JEE Main & NEET).
 */
const AppState = {
  student: null,
  currentExam: 'JEE',
  graphView: null,

  async init() {
    this.graphView = new KnowledgeGraphView('graphCanvas');

    let storedStudentId = localStorage.getItem('adaptive_student_id');
    if (!storedStudentId) {
      this.showOnboardingModal();
    } else {
      try {
        this.student = await API.getProfile(storedStudentId);
        this.updateHeaderProfile();
        await this.refreshAllData();
      } catch (err) {
        localStorage.removeItem('adaptive_student_id');
        this.showOnboardingModal();
      }
    }

    AIAssistantController.renderChat();
  },

  showOnboardingModal() {
    const modal = document.getElementById('onboardingModal');
    if (modal) modal.classList.add('active');
  },

  validateEmailInput(val) {
    const indicator = document.getElementById('emailValidateBadge');
    const isValid = val.includes('@') && val.includes('.') && val.length > 5;
    if (indicator) {
      indicator.innerText = isValid ? '✓ Valid @' : '⚠️ Enter valid @ email';
      indicator.style.color = isValid ? 'var(--accent-emerald)' : 'var(--accent-amber)';
    }
    return isValid;
  },

  async completeOnboarding() {
    const name = document.getElementById('onboardName')?.value.trim();
    const email = document.getElementById('onboardEmail')?.value.trim();
    const exam = document.getElementById('onboardExam')?.value || 'JEE';

    if (!name || name.length < 2) {
      alert('Please enter your name.');
      return;
    }
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address with @ symbol.');
      return;
    }

    try {
      const reg = await API.register({
        name,
        email,
        password: 'student_pass',
        target_exam: exam,
        daily_available_hours: 4.0
      });
      this.student = reg;
      this.currentExam = exam;
      localStorage.setItem('adaptive_student_id', reg.student_id);

      // Compulsory First Roadmap Generation on Onboarding
      await API.regenerateRoadmap(reg.student_id);

      const modal = document.getElementById('onboardingModal');
      if (modal) modal.classList.remove('active');

      this.updateHeaderProfile();
      await this.refreshAllData();

      // Show welcome toast / switch to roadmap
      this.switchTab('roadmap');
    } catch (err) {
      alert('Registration error: ' + err.message);
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

    document.querySelectorAll('.exam-pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.exam === this.currentExam);
    });
  },

  async switchExam(examId) {
    this.currentExam = examId;
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

    if (tabId === 'graph' && this.graphView) {
      setTimeout(() => this.graphView.resize(), 50);
    }
  },

  async refreshAllData() {
    if (!this.student) return;
    const studentId = this.student.student_id;

    try {
      // 1. Fetch Profile & Masteries
      this.student = await API.getProfile(studentId);
      document.getElementById('overallMasteryVal').innerText = `${Math.round(this.student.overall_mastery * 100)}%`;
      document.getElementById('overallConfidenceVal').innerText = `${Math.round(this.student.overall_confidence * 100)}%`;

      // 2. Fetch Active Roadmap & Next Action
      const roadmapData = await API.getActiveRoadmap(studentId);
      const nextAction = await API.getNextAction(studentId);
      RoadmapController.renderRoadmapView(roadmapData, nextAction);

      // 3. Fetch Knowledge Graph & Compute BKT / IRT stats
      const graphData = await API.getKnowledgeGraph(this.currentExam, studentId);
      if (this.graphView) this.graphView.loadGraphData(graphData);

      // 4. Fetch Weaknesses & Priorities
      const weaknesses = await API.getWeaknesses(studentId);
      this.renderWeaknessesList(weaknesses);

      // Compute average IRT & BKT
      const nodes = graphData.nodes || [];
      const masteredNodes = nodes.filter(n => (n.mastery || 0) > 0);
      const avgMastery = masteredNodes.length > 0 ? masteredNodes.reduce((acc, n) => acc + n.mastery, 0) / masteredNodes.length : 0;
      
      const bktElem = document.getElementById('bktProbabilityVal');
      const irtElem = document.getElementById('irtAbilityVal');
      if (bktElem) bktElem.innerText = `${Math.round(avgMastery * 100)}%`;
      if (irtElem) {
        const theta = (avgMastery - 0.5) * 4.0;
        irtElem.innerText = (theta >= 0 ? '+' : '') + theta.toFixed(2);
      }

      // 5. Fetch Telemetry Stream
      const stream = await API.getTelemetryStream(studentId);
      this.renderTelemetryStream(stream);

    } catch (err) {
      console.error('Error refreshing app data:', err);
    }
  },

  renderWeaknessesList(weaknesses) {
    const listElem = document.getElementById('weaknessRankingList');
    if (!listElem) return;

    if (!weaknesses || weaknesses.length === 0) {
      listElem.innerHTML = `<div style="color: var(--text-secondary); padding: 1rem;">No critical weaknesses identified. Great progress!</div>`;
      return;
    }

    listElem.innerHTML = weaknesses.slice(0, 5).map((w, idx) => `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 0.85rem; border-bottom: 1px solid var(--border-color);">
        <div>
          <div style="font-weight: 700; font-size: 0.92rem;">${idx + 1}. ${w.concept_name} <span style="font-size: 0.75rem; color: var(--text-secondary);">(${w.subject})</span></div>
          <div style="font-size: 0.78rem; color: #fca5a5; margin-top: 3px;">${(w.reasons || []).join(' • ')}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 800; color: var(--accent-rose);">${Math.round(w.mastery * 100)}%</div>
          <div style="font-size: 0.7rem; color: var(--text-muted);">${w.weakness_type.replace(/_/g, ' ')}</div>
        </div>
      </div>
    `).join('');
  },

  renderTelemetryStream(events) {
    const streamElem = document.getElementById('telemetryStreamContainer');
    if (!streamElem) return;

    if (!events || events.length === 0) {
      streamElem.innerHTML = `<div style="color: var(--text-secondary); padding: 1rem;">No telemetry events recorded.</div>`;
      return;
    }

    streamElem.innerHTML = events.slice(0, 8).map(e => `
      <div style="font-family: var(--font-mono); font-size: 0.75rem; padding: 0.35rem 0; border-bottom: 1px solid rgba(255,255,255,0.04); color: var(--text-secondary);">
        <span style="color: var(--accent-cyan);">${new Date(e.timestamp).toLocaleTimeString()}</span> • 
        <strong style="color: #fff;">${e.event_type}</strong> 
        ${e.resource_id ? `[${e.resource_id}]` : ''}
      </div>
    `).join('');
  }
};

window.addEventListener('DOMContentLoaded', () => {
  AppState.init();
});
