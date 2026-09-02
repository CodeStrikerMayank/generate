/**
 * Dynamic Roadmap & Next-Best-Action UI controller.
 * Enhanced with topic importance ribbons, JEE/NEET weightage info, and priority suggestions.
 */

/** JEE/NEET topic importance data — weightage, PYQ frequency, prerequisite count */
const TOPIC_IMPORTANCE = {
  // Physics
  phy_mechanics:          { marks: '20-24', pct: '14%', pyqFreq: 'Very High', prereqs: 4, isPYQFav: true, isHighWt: true },
  phy_electrostatics:     { marks: '12-16', pct: '9%',  pyqFreq: 'High',      prereqs: 2, isPYQFav: true, isHighWt: true },
  phy_current_electricity:{ marks: '8-12',  pct: '7%',  pyqFreq: 'High',      prereqs: 3, isPYQFav: false, isHighWt: false },
  phy_waves:              { marks: '8-12',  pct: '7%',  pyqFreq: 'Medium',    prereqs: 2, isPYQFav: false, isHighWt: false },
  phy_optics:             { marks: '12-16', pct: '9%',  pyqFreq: 'High',      prereqs: 1, isPYQFav: true,  isHighWt: true },
  phy_modern:             { marks: '8-12',  pct: '7%',  pyqFreq: 'Medium',    prereqs: 2, isPYQFav: false, isHighWt: false },
  phy_friction:           { marks: '4-8',   pct: '4%',  pyqFreq: 'Medium',    prereqs: 1, isPYQFav: false, isHighWt: false },
  // Chemistry
  chem_organic_basics:    { marks: '16-20', pct: '12%', pyqFreq: 'Very High', prereqs: 3, isPYQFav: true, isHighWt: true },
  chem_physical:          { marks: '12-16', pct: '9%',  pyqFreq: 'High',      prereqs: 2, isPYQFav: true, isHighWt: false },
  chem_inorganic:         { marks: '8-12',  pct: '7%',  pyqFreq: 'Medium',    prereqs: 1, isPYQFav: false, isHighWt: false },
  chem_electronic_effects:{ marks: '8-12',  pct: '7%',  pyqFreq: 'High',      prereqs: 2, isPYQFav: true, isHighWt: false },
  chem_equilibrium:       { marks: '8-12',  pct: '6%',  pyqFreq: 'Medium',    prereqs: 3, isPYQFav: false, isHighWt: false },
  // Mathematics
  math_calculus:          { marks: '20-28', pct: '18%', pyqFreq: 'Very High', prereqs: 5, isPYQFav: true, isHighWt: true },
  math_limits:            { marks: '8-12',  pct: '7%',  pyqFreq: 'High',      prereqs: 2, isPYQFav: true, isHighWt: false },
  math_algebra:           { marks: '12-16', pct: '10%', pyqFreq: 'High',      prereqs: 2, isPYQFav: false, isHighWt: true },
  math_coordinate:        { marks: '12-16', pct: '9%',  pyqFreq: 'High',      prereqs: 1, isPYQFav: true,  isHighWt: false },
  math_probability:       { marks: '4-8',   pct: '5%',  pyqFreq: 'Medium',    prereqs: 1, isPYQFav: false, isHighWt: false },
  math_vectors:           { marks: '8-12',  pct: '7%',  pyqFreq: 'High',      prereqs: 2, isPYQFav: false, isHighWt: false },
  // Biology (NEET)
  bio_cell_biology:       { marks: '12-16', pct: '8%',  pyqFreq: 'Very High', prereqs: 2, isPYQFav: true, isHighWt: true },
  bio_genetics:           { marks: '16-20', pct: '11%', pyqFreq: 'Very High', prereqs: 3, isPYQFav: true, isHighWt: true },
  bio_mendelian_laws:     { marks: '8-12',  pct: '6%',  pyqFreq: 'High',      prereqs: 2, isPYQFav: true, isHighWt: false },
  bio_plant_physiology:   { marks: '8-12',  pct: '6%',  pyqFreq: 'Medium',    prereqs: 1, isPYQFav: false, isHighWt: false },
  bio_human_physiology:   { marks: '12-16', pct: '9%',  pyqFreq: 'High',      prereqs: 2, isPYQFav: true, isHighWt: false },
  bio_evolution:          { marks: '4-8',   pct: '4%',  pyqFreq: 'Low',       prereqs: 0, isPYQFav: false, isHighWt: false },
};

/** Get importance info for a concept, with smart fallback */
function _getTopicImportance(conceptId, subject) {
  if (TOPIC_IMPORTANCE[conceptId]) return TOPIC_IMPORTANCE[conceptId];
  // Smart fallback based on subject
  const defaults = {
    Physics:     { marks: '8-12',  pct: '7%',  pyqFreq: 'Medium', prereqs: 1, isPYQFav: false, isHighWt: false },
    Chemistry:   { marks: '8-12',  pct: '6%',  pyqFreq: 'Medium', prereqs: 1, isPYQFav: false, isHighWt: false },
    Mathematics: { marks: '8-12',  pct: '7%',  pyqFreq: 'Medium', prereqs: 2, isPYQFav: false, isHighWt: false },
    Biology:     { marks: '4-8',   pct: '5%',  pyqFreq: 'Medium', prereqs: 1, isPYQFav: false, isHighWt: false },
  };
  return defaults[subject] || defaults['Physics'];
}

/** Render importance ribbon badges for a roadmap step */
function _renderImportanceBadges(imp) {
  const badges = [];
  if (imp.isHighWt)  badges.push(`<span class="importance-badge hw">🔥 High Weightage</span>`);
  if (imp.isPYQFav)  badges.push(`<span class="importance-badge pyq">🎯 PYQ Favourite</span>`);
  if (imp.prereqs > 2) badges.push(`<span class="importance-badge pre">📌 Prereq for ${imp.prereqs} Topics</span>`);
  if (imp.pyqFreq === 'Very High') badges.push(`<span class="importance-badge vhf">⚡ Very Frequent in Exams</span>`);
  return badges.join('');
}

const RoadmapController = {
  renderRoadmapView(roadmapData, nextAction) {
    const heroElem = document.getElementById('nbaHeroContainer');
    const listElem = document.getElementById('roadmapTimelineContainer');
    const infoElem = document.getElementById('roadmapInfoPanel');

    // ── Hero / NBA Card ──
    if (heroElem) {
      if (nextAction && nextAction.concept_name) {
        const imp = _getTopicImportance(nextAction.concept_id, nextAction.subject);
        heroElem.innerHTML = `
          <div class="nba-hero" style="margin-bottom:1rem;">
            <span class="nba-tag">⚡ Next Best Action</span>
            <h2 class="nba-title">${nextAction.action_type.replace(/_/g,' ')}: ${nextAction.concept_name}</h2>
            <p class="nba-desc">${nextAction.explanation_summary || 'Focus on this concept to maximize your rank improvement.'}</p>
            <div class="importance-ribbon">${_renderImportanceBadges(imp)}</div>
            <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:1.1rem;flex-wrap:wrap;gap:0.75rem;">
              <div class="nba-meta-row">
                <div class="meta-item">⏱ ${nextAction.estimated_minutes || 30} mins</div>
                <div class="meta-item">🎯 ${nextAction.target_questions_count || 5} Qs</div>
                <div class="meta-item">📊 Diff: ${Math.round((nextAction.target_difficulty || 0.5) * 100)}%</div>
                <div class="meta-item">📚 ${nextAction.subject || 'General'}</div>
                <div class="meta-item" style="color:var(--accent-amber);">📝 ${imp.marks} marks</div>
                <div class="meta-item" style="color:var(--accent-purple);">📰 ${imp.pct} of paper</div>
              </div>
              <button class="btn-primary" onclick="QuizController.startTest('${AppState.currentExam}','${nextAction.action_type}',2,'${nextAction.concept_id}')">
                Launch Practice →
              </button>
            </div>
          </div>
        `;
      } else {
        heroElem.innerHTML = `
          <div class="nba-hero" style="margin-bottom:1rem;">
            <span class="nba-tag">🚀 Roadmap Ready</span>
            <h2 class="nba-title">Take Your First Diagnostic to Activate the Engine</h2>
            <p class="nba-desc">Complete a diagnostic quiz to map your concept mastery across all subjects. Your personalized roadmap will be generated immediately after.</p>
            <button class="btn-primary" style="margin-top:1rem;" onclick="QuizController.startTest(AppState.currentExam,'DIAGNOSTIC',1)">
              Start Diagnostic Test →
            </button>
          </div>
        `;
      }
    }

    // ── Roadmap Info Panel ──
    if (infoElem && roadmapData?.actions) {
      this._renderInfoPanel(infoElem, roadmapData.actions);
    }

    // ── Roadmap Timeline ──
    if (!listElem) return;

    if (!roadmapData) {
      listElem.innerHTML = `
        <div class="glass-card" style="text-align:center;padding:2.5rem;color:var(--text-secondary);">
          <div style="font-size:2rem;margin-bottom:0.5rem;">🗺️</div>
          Roadmap is being generated. Please take a quiz first.
        </div>`;
      return;
    }

    const actions = roadmapData.actions || [];
    if (actions.length === 0) {
      listElem.innerHTML = `
        <div class="glass-card" style="text-align:center;padding:2.5rem;color:var(--text-secondary);">
          <div style="font-size:2rem;margin-bottom:0.5rem;">✅</div>
          All roadmap actions completed! Take another quiz to generate fresh priorities.
        </div>`;
      return;
    }

    listElem.innerHTML = actions.map((act, idx) => {
      let badgeClass = 'badge-medium';
      if (act.action_type.includes('LEARN'))     badgeClass = 'badge-learn';
      else if (act.action_type.includes('BASIC')) badgeClass = 'badge-basic';
      else if (act.action_type.includes('ADVANCED') || act.action_type.includes('HARD')) badgeClass = 'badge-hard';
      else if (act.action_type.includes('RETENTION')) badgeClass = 'badge-retention';

      const reasonsHtml = (act.reasons || []).map(r => `<span class="reason-tag">${r}</span>`).join('');
      const priorityColor = act.priority_score >= 0.8 ? 'var(--accent-rose)'
                          : act.priority_score >= 0.6 ? 'var(--accent-amber)'
                          : 'var(--accent-emerald)';

      const imp = _getTopicImportance(act.concept_id, act.subject);
      const importanceBadges = _renderImportanceBadges(imp);

      return `
        <div class="roadmap-step ${act.is_completed ? 'completed' : ''}">
          <div class="step-number" style="${idx === 0 ? 'background:rgba(99,102,241,0.25);border-color:var(--accent-primary);' : ''}">
            ${act.is_completed ? '✓' : act.sequence_order}
          </div>
          <div class="step-content">
            <div class="step-header">
              <span class="step-type-badge ${badgeClass}">${act.action_type.replace(/_/g,' ')}</span>
              <span style="font-size:0.75rem;color:${priorityColor};font-weight:700;margin-left:auto;">
                Priority ${Math.round(act.priority_score * 100)}%
              </span>
            </div>
            <div class="step-title">
              ${act.concept_name}
              <span style="font-size:0.82rem;color:var(--text-secondary);font-weight:400;"> (${act.subject})</span>
            </div>

            <!-- Importance Ribbon -->
            ${importanceBadges ? `<div class="importance-ribbon" style="margin:0.4rem 0;">${importanceBadges}</div>` : ''}

            <!-- Marks & PYQ info row -->
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin:0.35rem 0;font-size:0.75rem;">
              <span style="color:var(--accent-amber);font-weight:700;">📝 ${imp.marks} marks in exam</span>
              <span style="color:var(--accent-purple);font-weight:600;">📰 ${imp.pct} of paper</span>
              <span style="color:var(--text-muted);">🔁 PYQ: ${imp.pyqFreq}</span>
            </div>

            <div class="step-reasons">${reasonsHtml}</div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.65rem;">
              <span style="font-size:0.78rem;color:var(--text-muted);">
                ⏱ ${act.estimated_minutes}m &nbsp;•&nbsp; 🎯 ${act.target_questions_count} questions &nbsp;•&nbsp; 📊 Diff: ${Math.round(act.target_difficulty * 100)}%
              </span>
              ${!act.is_completed ? `
                <button class="btn-secondary" style="font-size:0.78rem;padding:5px 12px;" onclick="QuizController.startTest('${AppState.currentExam}','${act.action_type}',2,'${act.concept_id}')">
                  Start →
                </button>
              ` : '<span style="font-size:0.8rem;color:var(--accent-emerald);font-weight:700;">Done ✓</span>'}
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  _renderInfoPanel(container, actions) {
    if (!actions || actions.length === 0) { container.innerHTML = ''; return; }

    const pending = actions.filter(a => !a.is_completed);
    const top3 = pending.slice(0, 3);

    // Subject distribution
    const subjectCount = {};
    pending.forEach(a => { subjectCount[a.subject] = (subjectCount[a.subject] || 0) + 1; });

    // Total estimated study hours remaining
    const totalMins = pending.reduce((sum, a) => sum + (a.estimated_minutes || 30), 0);
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;

    // High-priority alerts
    const criticalCount = pending.filter(a => a.priority_score >= 0.8).length;

    const subjectColors = { Physics: '#06b6d4', Chemistry: '#10b981', Mathematics: '#a855f7', Biology: '#f59e0b' };

    container.innerHTML = `
      <div class="roadmap-info-panel glass-card">
        <div style="font-size:0.9rem;font-weight:800;margin-bottom:1rem;display:flex;align-items:center;gap:6px;">
          🧭 <span style="color:var(--accent-neon);">Study Intelligence Panel</span>
        </div>

        <!-- Today's Priority -->
        <div style="margin-bottom:1rem;">
          <div style="font-size:0.75rem;font-weight:800;color:var(--text-muted);letter-spacing:0.08em;margin-bottom:0.5rem;">TODAY'S TOP PRIORITIES</div>
          ${top3.map((a, i) => `
            <div style="display:flex;align-items:center;gap:8px;padding:0.45rem 0;border-bottom:1px solid var(--border-subtle);">
              <div style="width:20px;height:20px;border-radius:50%;background:${i===0?'var(--grad-hero)':i===1?'rgba(99,102,241,0.3)':'rgba(255,255,255,0.05)'};display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:900;">${i+1}</div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:0.8rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${a.concept_name}</div>
                <div style="font-size:0.68rem;color:${subjectColors[a.subject]||'var(--text-muted)'};">${a.subject}</div>
              </div>
              <div style="font-size:0.7rem;font-weight:700;color:var(--accent-amber);">⏱ ${a.estimated_minutes}m</div>
            </div>
          `).join('')}
        </div>

        <!-- Study Load Summary -->
        <div style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:var(--radius-sm);padding:0.6rem 0.75rem;margin-bottom:0.75rem;">
          <div style="font-size:0.72rem;font-weight:800;color:var(--accent-neon);margin-bottom:4px;">📅 STUDY LOAD REMAINING</div>
          <div style="font-size:1.2rem;font-weight:900;">${hours}h ${mins}m</div>
          <div style="font-size:0.7rem;color:var(--text-muted);">${pending.length} topics · ${actions.filter(a=>a.is_completed).length} completed</div>
        </div>

        <!-- Critical Alerts -->
        ${criticalCount > 0 ? `
        <div style="background:rgba(244,63,94,0.08);border:1px solid rgba(244,63,94,0.2);border-radius:var(--radius-sm);padding:0.6rem 0.75rem;margin-bottom:0.75rem;">
          <div style="font-size:0.72rem;font-weight:800;color:var(--accent-rose);">🚨 CRITICAL GAPS</div>
          <div style="font-size:1rem;font-weight:900;color:var(--accent-rose);">${criticalCount} topics</div>
          <div style="font-size:0.7rem;color:var(--text-muted);">Priority score ≥ 80% — tackle first</div>
        </div>` : ''}

        <!-- Subject Balance -->
        <div>
          <div style="font-size:0.72rem;font-weight:800;color:var(--text-muted);letter-spacing:0.08em;margin-bottom:0.5rem;">SUBJECT BALANCE</div>
          ${Object.entries(subjectCount).map(([sub, cnt]) => {
            const pct = Math.round((cnt / pending.length) * 100);
            const col = subjectColors[sub] || 'var(--accent-primary)';
            return `
              <div style="margin-bottom:0.35rem;">
                <div style="display:flex;justify-content:space-between;font-size:0.72rem;margin-bottom:2px;">
                  <span style="color:${col};font-weight:700;">${sub}</span>
                  <span style="color:var(--text-muted);">${cnt} topics (${pct}%)</span>
                </div>
                <div style="height:4px;background:rgba(255,255,255,0.08);border-radius:4px;">
                  <div style="height:4px;width:${pct}%;background:${col};border-radius:4px;transition:width 0.5s;"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Recommended Study Time -->
        <div style="margin-top:0.75rem;padding-top:0.75rem;border-top:1px solid var(--border-subtle);font-size:0.72rem;color:var(--text-muted);line-height:1.5;">
          💡 <strong style="color:var(--text-secondary);">Suggested daily session:</strong><br>
          Focus ${Math.min(4, hours)} hours/day to complete roadmap in ~${Math.ceil(totalMins / (4*60))} days
        </div>
      </div>
    `;
  }
};
