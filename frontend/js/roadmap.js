/**
 * Dynamic Roadmap and Next-Best-Action UI controller.
 */
const RoadmapController = {
  renderRoadmapView(roadmapData, nextAction) {
    const heroElem = document.getElementById('nbaHeroContainer');
    const listElem = document.getElementById('roadmapTimelineContainer');

    // Render Hero NBA Card
    if (heroElem) {
      if (nextAction) {
        heroElem.innerHTML = `
          <div class="nba-hero">
            <div class="nba-tag">⚡ Immediate Next Best Action</div>
            <h2 class="nba-title">${nextAction.action_type.replace(/_/g, ' ')}: ${nextAction.concept_name}</h2>
            <p class="nba-desc">${nextAction.explanation_summary}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.25rem;">
              <div class="nba-meta-row">
                <div class="meta-item">⏱ Est. ${nextAction.estimated_minutes} mins</div>
                <div class="meta-item">🎯 ${nextAction.target_questions_count} Questions</div>
                <div class="meta-item">📊 Target Diff: ${Math.round(nextAction.target_difficulty * 100)}%</div>
                <div class="meta-item">📚 ${nextAction.subject}</div>
              </div>
              <button class="btn-primary" onclick="QuizController.startTest('${AppState.currentExam}', '${nextAction.action_type}', 2, '${nextAction.concept_id}')">
                Launch Targeted Practice →
              </button>
            </div>
          </div>
        `;
      } else {
        heroElem.innerHTML = `
          <div class="nba-hero">
            <div class="nba-tag">Roadmap Ready</div>
            <h2 class="nba-title">Take an Initial Diagnostic to Activate Your Engine</h2>
            <p class="nba-desc">Complete a 15-minute diagnostic assessment to map your concept mastery and unlock personalized Next-Best-Actions.</p>
            <button class="btn-primary" onclick="QuizController.startTest('${AppState.currentExam}', 'DIAGNOSTIC', 1)">
              Start Diagnostic Test →
            </button>
          </div>
        `;
      }
    }

    // Render Sequence Steps
    if (listElem && roadmapData) {
      const actions = roadmapData.actions || [];
      if (actions.length === 0) {
        listElem.innerHTML = `<div style="color: var(--text-secondary); padding: 1rem;">No actions currently scheduled.</div>`;
        return;
      }

      listElem.innerHTML = actions.map(act => {
        let badgeClass = 'badge-medium';
        if (act.action_type.includes('LEARN')) badgeClass = 'badge-learn';
        else if (act.action_type.includes('BASIC')) badgeClass = 'badge-basic';
        else if (act.action_type.includes('ADVANCED') || act.action_type.includes('HARD')) badgeClass = 'badge-hard';
        else if (act.action_type.includes('RETENTION')) badgeClass = 'badge-retention';

        const reasonsHtml = (act.reasons || []).map(r => `<span class="reason-tag">${r}</span>`).join('');

        return `
          <div class="roadmap-step">
            <div class="step-number">${act.sequence_order}</div>
            <div class="step-content">
              <div class="step-header">
                <span class="step-type-badge ${badgeClass}">${act.action_type.replace(/_/g, ' ')}</span>
                <span style="font-size: 0.8rem; color: var(--text-muted);">Priority: ${Math.round(act.priority_score * 100)}%</span>
              </div>
              <div class="step-title">${act.concept_name} <span style="font-size: 0.85rem; color: var(--text-secondary);">(${act.subject})</span></div>
              <div class="step-reasons">${reasonsHtml}</div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem;">
                <span style="font-size: 0.8rem; color: var(--text-muted);">⏱ ${act.estimated_minutes}m • 🎯 ${act.target_questions_count} questions</span>
                <button class="btn-secondary" style="font-size: 0.8rem; padding: 4px 10px;" onclick="QuizController.startTest('${AppState.currentExam}', '${act.action_type}', 2, '${act.concept_id}')">
                  Start Step
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  }
};
