/**
 * Dynamic Roadmap & Next-Best-Action UI controller.
 * Handles null/empty states gracefully.
 */
const RoadmapController = {
  renderRoadmapView(roadmapData, nextAction) {
    const heroElem = document.getElementById('nbaHeroContainer');
    const listElem = document.getElementById('roadmapTimelineContainer');

    // ── Hero / NBA Card ──
    if (heroElem) {
      if (nextAction && nextAction.concept_name) {
        heroElem.innerHTML = `
          <div class="nba-hero" style="margin-bottom:1rem;">
            <span class="nba-tag">⚡ Next Best Action</span>
            <h2 class="nba-title">${nextAction.action_type.replace(/_/g,' ')}: ${nextAction.concept_name}</h2>
            <p class="nba-desc">${nextAction.explanation_summary || 'Focus on this concept to maximize your rank improvement.'}</p>
            <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:1.1rem;flex-wrap:wrap;gap:0.75rem;">
              <div class="nba-meta-row">
                <div class="meta-item">⏱ ${nextAction.estimated_minutes || 30} mins</div>
                <div class="meta-item">🎯 ${nextAction.target_questions_count || 5} Qs</div>
                <div class="meta-item">📊 Diff: ${Math.round((nextAction.target_difficulty || 0.5) * 100)}%</div>
                <div class="meta-item">📚 ${nextAction.subject || 'General'}</div>
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
            <p class="nba-desc">Complete a 20-min diagnostic quiz to map your concept mastery across all subjects. Your personalized roadmap will be generated immediately after.</p>
            <button class="btn-primary" style="margin-top:1rem;" onclick="QuizController.startTest(AppState.currentExam,'DIAGNOSTIC',1)">
              Start Diagnostic Test →
            </button>
          </div>
        `;
      }
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
  }
};
