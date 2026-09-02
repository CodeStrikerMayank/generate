/**
 * Supporting Features Controller
 * Platform Upgrade v3.0:
 * 1. Spaced-Repetition Review Queue (Ebbinghaus Decay)
 * 2. Error-Pattern Trend Analytics
 * 3. Printable / Exportable Report Card
 */
const SupportingFeatures = {
  async showReviewQueueModal() {
    if (!AppState.student) return;
    const modal = document.getElementById('supportingModal');
    const content = document.getElementById('supportingModalContent');
    if (!modal || !content) return;

    content.innerHTML = '<div style="text-align:center;padding:2rem;">⏳ Loading Memory Retention Queue...</div>';
    modal.classList.add('active');

    try {
      const data = await API.getReviewQueue(AppState.student.student_id);
      const queue = data.queue || [];

      let itemsHtml = queue.length === 0 ? `
        <div style="text-align:center;padding:2rem;color:var(--text-muted);">
          🎉 <strong>Zero Retention Gaps!</strong><br>
          All practiced concepts are currently above the 65% Ebbinghaus retention threshold.
        </div>
      ` : queue.map(item => `
        <div class="glass-card" style="padding:0.85rem 1rem;display:flex;align-items:center;justify-content:space-between;margin-bottom:0.65rem;border-left:3px solid ${item.urgency === 'HIGH' ? 'var(--accent-rose)' : 'var(--accent-amber)'};">
          <div>
            <div style="font-size:0.9rem;font-weight:800;color:#fff;">${item.concept_name}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">
              ${item.subject} • Practiced ${item.days_since_practice} days ago • Forgetting Risk: <strong style="color:var(--accent-rose);">${item.forgetting_risk}%</strong>
            </div>
            <div style="display:flex;align-items:center;gap:0.5rem;margin-top:0.4rem;">
              <span style="font-size:0.72rem;color:var(--text-secondary);">Retention R(t):</span>
              <div class="skill-meter-track" style="width:120px;margin:0;">
                <div class="skill-meter-fill" style="width:${item.retention_score}%;background:${item.urgency === 'HIGH' ? 'var(--accent-rose)' : 'var(--accent-amber)'};"></div>
              </div>
              <span style="font-size:0.72rem;font-weight:700;">${item.retention_score}%</span>
            </div>
          </div>
          <button class="btn-primary" style="padding:5px 12px;font-size:0.78rem;" onclick="SupportingFeatures.closeModal();QuizController.startTest('${AppState.currentExam}','RETENTION_TEST',2,'${item.concept_id}')">
            Review Now →
          </button>
        </div>
      `).join('');

      content.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
          <div>
            <h3 style="font-size:1.25rem;font-weight:800;">🔄 Spaced-Repetition Review Queue</h3>
            <div style="font-size:0.8rem;color:var(--text-secondary);">Calculated via Ebbinghaus exponential decay $R(t) = e^{-t/S}$</div>
          </div>
          <button class="btn-secondary" style="padding:4px 8px;font-size:0.85rem;" onclick="SupportingFeatures.closeModal()">✕ Close</button>
        </div>
        <div style="max-height:60vh;overflow-y:auto;padding-right:4px;">
          ${itemsHtml}
        </div>
      `;
    } catch (err) {
      content.innerHTML = `<div style="color:var(--accent-rose);padding:1rem;">Error: ${err.message}</div>`;
    }
  },

  async showErrorTrendsModal() {
    if (!AppState.student) return;
    const modal = document.getElementById('supportingModal');
    const content = document.getElementById('supportingModalContent');
    if (!modal || !content) return;

    content.innerHTML = '<div style="text-align:center;padding:2rem;">⏳ Aggregating Cognitive Error Trends...</div>';
    modal.classList.add('active');

    try {
      const data = await API.getErrorTrends(AppState.student.student_id);
      const byType = data.by_error_type || {};
      const bySub = data.by_subject || {};

      const typeBars = Object.entries(byType).map(([etype, count]) => `
        <div style="margin-bottom:0.75rem;">
          <div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:3px;">
            <span>${etype.replace(/_/g, ' ')}</span>
            <strong>${count} occurrences</strong>
          </div>
          <div class="skill-meter-track" style="margin:0;">
            <div class="skill-meter-fill" style="width:${Math.min(count * 25, 100)}%;background:var(--accent-rose);"></div>
          </div>
        </div>
      `).join('') || '<div style="color:var(--text-muted);font-size:0.85rem;">No errors logged yet!</div>';

      const subBars = Object.entries(bySub).map(([sub, count]) => `
        <div style="margin-bottom:0.75rem;">
          <div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:3px;">
            <span>${sub}</span>
            <strong>${count} errors</strong>
          </div>
          <div class="skill-meter-track" style="margin:0;">
            <div class="skill-meter-fill" style="width:${Math.min(count * 25, 100)}%;background:var(--accent-amber);"></div>
          </div>
        </div>
      `).join('') || '<div style="color:var(--text-muted);font-size:0.85rem;">No errors logged yet!</div>';

      content.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
          <div>
            <h3 style="font-size:1.25rem;font-weight:800;">📉 Cognitive Error Trends & Biases</h3>
            <div style="font-size:0.8rem;color:var(--text-secondary);">Identified from distractors chosen during diagnostic & drill testing</div>
          </div>
          <button class="btn-secondary" style="padding:4px 8px;font-size:0.85rem;" onclick="SupportingFeatures.closeModal()">✕ Close</button>
        </div>

        <div class="grid-2" style="gap:1rem;margin-bottom:1rem;">
          <div class="glass-card" style="padding:1rem;">
            <div style="font-weight:700;font-size:0.88rem;margin-bottom:0.75rem;color:var(--accent-rose);">Breakdown by Error Classification</div>
            ${typeBars}
          </div>
          <div class="glass-card" style="padding:1rem;">
            <div style="font-weight:700;font-size:0.88rem;margin-bottom:0.75rem;color:var(--accent-amber);">Breakdown by Subject Tendency</div>
            ${subBars}
          </div>
        </div>
      `;
    } catch (err) {
      content.innerHTML = `<div style="color:var(--accent-rose);padding:1rem;">Error: ${err.message}</div>`;
    }
  },

  async showReportCardModal() {
    if (!AppState.student) return;
    const modal = document.getElementById('supportingModal');
    const content = document.getElementById('supportingModalContent');
    if (!modal || !content) return;

    content.innerHTML = '<div style="text-align:center;padding:2rem;">⏳ Generating Academic Report Card...</div>';
    modal.classList.add('active');

    try {
      const data = await API.getReportCard(AppState.student.student_id);
      const student = data.student;
      const perf = data.overall_performance;
      const subBreakdown = data.subject_breakdown || [];
      const weak = data.weak_concepts || [];
      const strong = data.strong_concepts || [];

      content.innerHTML = `
        <div class="printable-report-card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid var(--border-subtle);padding-bottom:1rem;margin-bottom:1rem;">
            <div>
              <div style="font-size:0.75rem;font-weight:700;letter-spacing:1px;color:var(--accent-cyan);text-transform:uppercase;">OFFICIAL PERFORMANCE AUDIT</div>
              <h2 style="font-size:1.6rem;font-weight:900;color:#fff;">${student.name}</h2>
              <div style="font-size:0.85rem;color:var(--text-secondary);">Target: <strong>${student.exam === 'JEE' ? 'JEE Main 2026' : 'NEET-UG 2026'}</strong> • Generated: ${data.generated_at}</div>
            </div>
            <div class="no-print" style="display:flex;gap:0.5rem;">
              <button class="btn-primary" style="padding:6px 14px;font-size:0.85rem;" onclick="window.print()">🖨️ Print / Save as PDF</button>
              <button class="btn-secondary" style="padding:6px 10px;font-size:0.85rem;" onclick="SupportingFeatures.closeModal()">✕ Close</button>
            </div>
          </div>

          <!-- Overall Performance Row -->
          <div class="grid-4" style="gap:0.75rem;margin-bottom:1.25rem;">
            <div class="glass-card" style="padding:0.75rem;text-align:center;">
              <div style="font-size:0.72rem;color:var(--text-muted);">SYLLABUS MASTERY</div>
              <div style="font-size:1.35rem;font-weight:900;color:var(--accent-primary);">${perf.syllabus_mastery_pct}%</div>
            </div>
            <div class="glass-card" style="padding:0.75rem;text-align:center;">
              <div style="font-size:0.72rem;color:var(--text-muted);">IRT LATENT ABILITY</div>
              <div style="font-size:1.35rem;font-weight:900;color:var(--accent-purple);">${perf.irt_ability_theta >= 0 ? '+' : ''}${perf.irt_ability_theta}</div>
            </div>
            <div class="glass-card" style="padding:0.75rem;text-align:center;">
              <div style="font-size:0.72rem;color:var(--text-muted);">CONCEPTS MASTERED</div>
              <div style="font-size:1.35rem;font-weight:900;color:var(--accent-emerald);">${perf.strong_concepts_count}</div>
            </div>
            <div class="glass-card" style="padding:0.75rem;text-align:center;">
              <div style="font-size:0.72rem;color:var(--text-muted);">CRITICAL GAPS</div>
              <div style="font-size:1.35rem;font-weight:900;color:var(--accent-rose);">${perf.weak_gaps_count}</div>
            </div>
          </div>

          <!-- Subject Breakdown -->
          <h4 style="font-size:0.95rem;font-weight:800;margin-bottom:0.6rem;color:#f8fafc;">Subject Mastery Breakdown</h4>
          <div style="margin-bottom:1.25rem;">
            ${subBreakdown.map(s => `
              <div style="margin-bottom:0.6rem;">
                <div style="display:flex;justify-content:space-between;font-size:0.84rem;margin-bottom:3px;">
                  <span style="font-weight:700;">${s.subject}</span>
                  <span>${s.average_mastery_pct}% (${s.concepts_evaluated} evaluated)</span>
                </div>
                <div class="skill-meter-track" style="margin:0;">
                  <div class="skill-meter-fill" style="width:${s.average_mastery_pct}%;background:${s.average_mastery_pct >= 70 ? 'var(--accent-emerald)' : (s.average_mastery_pct < 50 ? 'var(--accent-rose)' : 'var(--accent-amber)')};"></div>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Gaps & Strengths -->
          <div class="grid-2" style="gap:1rem;margin-bottom:1rem;">
            <div class="glass-card" style="padding:0.85rem;">
              <div style="font-size:0.82rem;font-weight:800;color:var(--accent-rose);margin-bottom:0.4rem;">⚠️ Priority Repair Gaps</div>
              ${weak.length === 0 ? '<div style="font-size:0.78rem;color:var(--text-muted);">No critical gaps identified.</div>' : weak.map(w => `
                <div style="font-size:0.78rem;color:var(--text-secondary);margin-bottom:3px;">• ${w.concept_name} (${w.subject}) — ${w.mastery_pct}%</div>
              `).join('')}
            </div>
            <div class="glass-card" style="padding:0.85rem;">
              <div style="font-size:0.82rem;font-weight:800;color:var(--accent-emerald);margin-bottom:0.4rem;">🟢 Confirmed Masteries</div>
              ${strong.length === 0 ? '<div style="font-size:0.78rem;color:var(--text-muted);">Take quizzes to establish confirmed masteries.</div>' : strong.map(s => `
                <div style="font-size:0.78rem;color:var(--text-secondary);margin-bottom:3px;">• ${s.concept_name} (${s.subject}) — ${s.mastery_pct}%</div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      content.innerHTML = `<div style="color:var(--accent-rose);padding:1rem;">Error: ${err.message}</div>`;
    }
  },

  closeModal() {
    const modal = document.getElementById('supportingModal');
    if (modal) modal.classList.remove('active');
  }
};
