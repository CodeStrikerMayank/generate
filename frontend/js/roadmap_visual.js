/**
 * Visual Roadmap & Chapter Heatmap Engine
 * Platform Upgrade v3.0 — Interactive SVG DAG Graph & Mobile Heatmap Grid
 */
const RoadmapVisualizer = {
  activeView: 'timeline', // 'timeline' | 'dag' | 'heatmap'
  graphData: null,
  viewBox: { x: 0, y: 0, width: 900, height: 500 },
  isPanning: false,
  startPan: { x: 0, y: 0 },

  switchView(viewName) {
    this.activeView = viewName;

    // Update switcher button styles
    document.querySelectorAll('.roadmap-view-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    const timeline = document.getElementById('roadmapTimelineContainer');
    const dagContainer = document.getElementById('roadmapSvgDagContainer');
    const heatmapContainer = document.getElementById('roadmapChapterHeatmapContainer');

    if (timeline) timeline.style.display = viewName === 'timeline' ? 'block' : 'none';
    if (dagContainer) dagContainer.style.display = viewName === 'dag' ? 'block' : 'none';
    if (heatmapContainer) heatmapContainer.style.display = viewName === 'heatmap' ? 'block' : 'none';

    if (viewName === 'dag') {
      this.loadAndRenderDag();
    } else if (viewName === 'heatmap') {
      this.loadAndRenderHeatmap();
    }
  },

  async loadAndRenderDag() {
    const container = document.getElementById('roadmapSvgDagContainer');
    if (!container) return;

    container.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-muted);">🕸️ Rendering Dependency DAG Graph...</div>';

    try {
      if (!this.graphData || this.graphData.exam !== AppState.currentExam) {
        this.graphData = await API.getKnowledgeGraph(AppState.currentExam, AppState.student?.student_id);
      }
      this.renderSvgDag(container, this.graphData);
    } catch (err) {
      container.innerHTML = `<div style="color:var(--accent-rose);padding:1rem;">Failed to load DAG: ${err.message}</div>`;
    }
  },

  renderSvgDag(container, data) {
    const nodes = data.nodes || [];
    const edges = data.edges || [];

    if (nodes.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:2rem;">No concepts found for this exam.</div>';
      return;
    }

    // Topological layer computation
    const inDegree = {};
    const adj = {};
    nodes.forEach(n => { inDegree[n.id] = 0; adj[n.id] = []; });
    edges.forEach(e => {
      if (inDegree[e.to] !== undefined) inDegree[e.to]++;
      if (adj[e.from]) adj[e.from].push(e.to);
    });

    const levels = {};
    const queue = nodes.filter(n => (inDegree[n.id] || 0) === 0).map(n => n.id);
    queue.forEach(id => { levels[id] = 0; });

    let ptr = 0;
    while (ptr < queue.length) {
      const u = queue[ptr++];
      const lvl = levels[u] || 0;
      (adj[u] || []).forEach(v => {
        levels[v] = Math.max(levels[v] || 0, lvl + 1);
        inDegree[v]--;
        if (inDegree[v] === 0) queue.push(v);
      });
    }

    // Assign positions by layer
    const layerMap = {};
    nodes.forEach(n => {
      const lvl = levels[n.id] || 0;
      if (!layerMap[lvl]) layerMap[lvl] = [];
      layerMap[lvl].push(n);
    });

    const maxLayer = Math.max(...Object.keys(layerMap).map(Number), 0);
    const layerWidth = 190;
    const nodeHeight = 70;
    const totalW = Math.max((maxLayer + 1) * layerWidth + 120, 800);
    let maxH = 450;

    const nodeCoords = {};
    Object.keys(layerMap).forEach(lvlStr => {
      const lvl = Number(lvlStr);
      const list = layerMap[lvl];
      const startX = 60 + lvl * layerWidth;
      const totalColH = list.length * (nodeHeight + 35);
      if (totalColH > maxH) maxH = totalColH;
      const startY = 50;

      list.forEach((n, idx) => {
        nodeCoords[n.id] = {
          x: startX,
          y: startY + idx * (nodeHeight + 35),
          data: n
        };
      });
    });

    this.viewBox = { x: 0, y: 0, width: totalW, height: maxH + 60 };

    // Build SVG
    let svgHtml = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.65rem;">
        <div style="font-size:0.8rem;color:var(--text-secondary);">
          🟢 Mastered (&ge;70%) &nbsp; 🟡 Developing (40-69%) &nbsp; 🔴 Weak (&lt;40%) &nbsp; • &nbsp; Click any node to practice
        </div>
        <div style="display:flex;gap:4px;">
          <button class="btn-secondary" style="padding:3px 10px;font-size:0.75rem;" onclick="RoadmapVisualizer.zoomSvg(0.8)">- Zoom</button>
          <button class="btn-secondary" style="padding:3px 10px;font-size:0.75rem;" onclick="RoadmapVisualizer.zoomSvg(1.25)">+ Zoom</button>
          <button class="btn-secondary" style="padding:3px 10px;font-size:0.75rem;" onclick="RoadmapVisualizer.resetSvg()">Reset</button>
        </div>
      </div>
      <div class="svg-viewport-wrapper" style="overflow:hidden;border:1px solid var(--border-subtle);border-radius:var(--radius-sm);background:rgba(15,23,42,0.6);cursor:grab;">
        <svg id="roadmapDagSvg" viewBox="${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width} ${this.viewBox.height}" style="width:100%;height:440px;display:block;">
          <defs>
            <marker id="dagArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="rgba(148,163,184,0.4)" />
            </marker>
          </defs>
    `;

    // Draw Edges
    edges.forEach(e => {
      const p1 = nodeCoords[e.from];
      const p2 = nodeCoords[e.to];
      if (p1 && p2) {
        const x1 = p1.x + 130;
        const y1 = p1.y + 20;
        const x2 = p2.x;
        const y2 = p2.y + 20;
        const dx = (x2 - x1) * 0.5;
        svgHtml += `
          <path d="M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}"
                fill="none" stroke="rgba(148,163,184,0.35)" stroke-width="2" marker-end="url(#dagArrow)" />
        `;
      }
    });

    // Draw Nodes
    Object.values(nodeCoords).forEach(pt => {
      const n = pt.data;
      const m = Math.round((n.mastery || 0) * 100);
      let borderCol = 'var(--accent-rose)';
      let fillCol = 'rgba(244,63,94,0.12)';
      let tag = '🔴 Weak';

      if (m >= 70) {
        borderCol = 'var(--accent-emerald)';
        fillCol = 'rgba(16,185,129,0.14)';
        tag = '🟢 Mastered';
      } else if (m >= 40) {
        borderCol = 'var(--accent-amber)';
        fillCol = 'rgba(245,158,11,0.12)';
        tag = '🟡 Developing';
      }

      svgHtml += `
        <g class="dag-node-group" style="cursor:pointer;" onclick="QuizController.startTest('${AppState.currentExam}','CONCEPT_FOCUS',2,'${n.id}')">
          <rect x="${pt.x}" y="${pt.y}" width="130" height="42" rx="8"
                fill="${fillCol}" stroke="${borderCol}" stroke-width="1.5" />
          <text x="${pt.x + 8}" y="${pt.y + 16}" fill="#f8fafc" font-size="11" font-weight="700" font-family="system-ui">
            ${n.label.length > 14 ? n.label.substring(0, 13) + '…' : n.label}
          </text>
          <text x="${pt.x + 8}" y="${pt.y + 32}" fill="var(--text-muted)" font-size="9" font-family="system-ui">
            ${tag} • ${m}%
          </text>
          <title>${n.label}&#10;Subject: ${n.subject}&#10;Chapter: ${n.chapter_name}&#10;Mastery: ${m}%&#10;Click to practice!</title>
        </g>
      `;
    });

    svgHtml += `</svg></div>`;
    container.innerHTML = svgHtml;
    this.bindSvgPanZoom();
  },

  bindSvgPanZoom() {
    const wrapper = document.querySelector('.svg-viewport-wrapper');
    const svg = document.getElementById('roadmapDagSvg');
    if (!wrapper || !svg) return;

    wrapper.addEventListener('mousedown', (e) => {
      this.isPanning = true;
      this.startPan = { x: e.clientX, y: e.clientY };
      wrapper.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isPanning) return;
      const dx = (e.clientX - this.startPan.x) * (this.viewBox.width / wrapper.clientWidth);
      const dy = (e.clientY - this.startPan.y) * (this.viewBox.height / wrapper.clientHeight);
      this.viewBox.x -= dx;
      this.viewBox.y -= dy;
      this.startPan = { x: e.clientX, y: e.clientY };
      svg.setAttribute('viewBox', `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width} ${this.viewBox.height}`);
    });

    window.addEventListener('mouseup', () => {
      this.isPanning = false;
      if (wrapper) wrapper.style.cursor = 'grab';
    });
  },

  zoomSvg(factor) {
    const svg = document.getElementById('roadmapDagSvg');
    if (!svg) return;
    const newW = this.viewBox.width * factor;
    const newH = this.viewBox.height * factor;
    this.viewBox.x += (this.viewBox.width - newW) / 2;
    this.viewBox.y += (this.viewBox.height - newH) / 2;
    this.viewBox.width = newW;
    this.viewBox.height = newH;
    svg.setAttribute('viewBox', `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width} ${this.viewBox.height}`);
  },

  resetSvg() {
    this.loadAndRenderDag();
  },

  async loadAndRenderHeatmap() {
    const container = document.getElementById('roadmapChapterHeatmapContainer');
    if (!container) return;

    container.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-muted);">📊 Aggregating Chapter Masteries...</div>';

    try {
      if (!this.graphData || this.graphData.exam !== AppState.currentExam) {
        this.graphData = await API.getKnowledgeGraph(AppState.currentExam, AppState.student?.student_id);
      }
      this.renderChapterHeatmap(container, this.graphData);
    } catch (err) {
      container.innerHTML = `<div style="color:var(--accent-rose);padding:1rem;">Failed to load heatmap: ${err.message}</div>`;
    }
  },

  renderChapterHeatmap(container, data) {
    const nodes = data.nodes || [];
    const chapters = {};

    nodes.forEach(n => {
      const chName = n.chapter_name || 'General Foundation';
      const chId = n.chapter_id || 'ch_gen';
      const sub = n.subject || 'General';
      if (!chapters[chName]) {
        chapters[chName] = {
          name: chName,
          id: chId,
          subject: sub,
          totalMastery: 0,
          count: 0,
          weakCount: 0,
          concepts: []
        };
      }
      const m = n.mastery || 0;
      chapters[chName].totalMastery += m;
      chapters[chName].count++;
      if (m < 0.40) chapters[chName].weakCount++;
      chapters[chName].concepts.push(n);
    });

    const chList = Object.values(chapters);
    if (chList.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:2rem;">No chapters found.</div>';
      return;
    }

    const cardsHtml = chList.map(ch => {
      const avgM = Math.round((ch.totalMastery / ch.count) * 100);
      let statusCol = 'var(--accent-emerald)';
      let statusLabel = 'Mastered';
      if (avgM < 40) {
        statusCol = 'var(--accent-rose)';
        statusLabel = 'Needs Repair';
      } else if (avgM < 70) {
        statusCol = 'var(--accent-amber)';
        statusLabel = 'Developing';
      }

      return `
        <div class="glass-card" style="padding:1rem;display:flex;flex-direction:column;justify-content:space-between;border-top:3px solid ${statusCol};">
          <div>
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.5rem;">
              <span class="reason-tag" style="margin:0;font-size:0.72rem;">${ch.subject}</span>
              <span style="font-size:0.75rem;font-weight:700;color:${statusCol};">${statusLabel}</span>
            </div>
            <h4 style="font-size:0.95rem;font-weight:800;margin-bottom:0.35rem;color:#f8fafc;">${ch.name}</h4>
            <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:0.65rem;">
              ${ch.count} Concepts • ${ch.weakCount > 0 ? `<strong style="color:var(--accent-rose);">${ch.weakCount} Weak Gaps</strong>` : 'All Solid'}
            </div>
            <div class="skill-meter-track" style="margin-bottom:0.85rem;">
              <div class="skill-meter-fill" style="width:${avgM}%;background:${statusCol};"></div>
            </div>
          </div>
          <button class="btn-primary" style="width:100%;justify-content:center;padding:0.5rem;font-size:0.8rem;background:rgba(255,255,255,0.06);border:1px solid var(--border-subtle);" onclick="QuizController.startDrill('${ch.subject}','${ch.id}')">
            🎯 Drill ${ch.name.substring(0, 16)} →
          </button>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:1rem;">
        Mobile-optimized chapter mastery matrix. Launch targeted drills on any chapter with broken concepts.
      </div>
      <div class="grid-3" style="gap:1rem;">
        ${cardsHtml}
      </div>
    `;
  },

  renderDashboardProgressRing(containerId, masteryPct) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const pct = Math.min(Math.max(Math.round(masteryPct || 0), 0), 100);
    const radius = 38;
    const circ = 2 * Math.PI * radius;
    const offset = circ - (pct / 100) * circ;

    el.innerHTML = `
      <div style="position:relative;width:96px;height:96px;display:flex;align-items:center;justify-content:center;">
        <svg style="width:96px;height:96px;transform:rotate(-90deg);">
          <circle cx="48" cy="48" r="${radius}" stroke="rgba(255,255,255,0.08)" stroke-width="7" fill="none" />
          <circle cx="48" cy="48" r="${radius}" stroke="var(--accent-primary)" stroke-width="7" fill="none"
                  stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round"
                  style="transition:stroke-dashoffset 0.8s ease;" />
        </svg>
        <div style="position:absolute;text-align:center;">
          <div style="font-size:1.15rem;font-weight:900;color:#fff;">${pct}%</div>
          <div style="font-size:0.65rem;color:var(--text-muted);text-transform:uppercase;">Mastery</div>
        </div>
      </div>
    `;
  },

  renderNextThreeActions(containerId, roadmapActions) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!roadmapActions || roadmapActions.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:1.5rem;color:var(--text-muted);font-size:0.85rem;">
          Take your diagnostic quiz to unlock prioritized actions.
        </div>
      `;
      return;
    }

    const next3 = roadmapActions.slice(0, 3);
    const itemsHtml = next3.map(a => `
      <div class="glass-card" style="padding:0.85rem 1rem;display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem;">
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <div class="timeline-step-badge" style="width:28px;height:28px;font-size:0.75rem;flex-shrink:0;">${a.sequence_order || a.order || 1}</div>
          <div>
            <div style="font-size:0.88rem;font-weight:700;color:#fff;">${a.title || a.concept_id}</div>
            <div style="font-size:0.74rem;color:var(--text-muted);">
              ${a.action_type?.replace(/_/g, ' ')} • ~${a.estimated_minutes || 45} mins
            </div>
          </div>
        </div>
        <button class="btn-primary" style="padding:4px 12px;font-size:0.76rem;" onclick="QuizController.startTest('${AppState.currentExam}','CONCEPT_FOCUS',2,'${a.concept_id}')">
          Start →
        </button>
      </div>
    `).join('');

    container.innerHTML = itemsHtml;
  }
};
