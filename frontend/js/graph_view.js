/**
 * Interactive Knowledge Graph Canvas Renderer.
 */
class KnowledgeGraphView {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.nodes = [];
    this.edges = [];
    this.nodeMap = new Map();
    this.draggedNode = null;
    this.hoveredNode = null;
    this.panX = 50;
    this.panY = 50;
    this.scale = 1.0;
    this.isPanning = false;
    this.lastMousePos = { x: 0, y: 0 };

    if (this.canvas) {
      this.initEvents();
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = this.canvas.parentElement.clientWidth || 900;
    this.canvas.height = 550;
    this.draw();
  }

  loadGraphData(graphData) {
    this.nodes = graphData.nodes || [];
    this.edges = graphData.edges || [];
    this.nodeMap.clear();

    // Layout nodes in layered/topological grid
    const cols = Math.ceil(Math.sqrt(this.nodes.length));
    const spacingX = 220;
    const spacingY = 120;

    this.nodes.forEach((node, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      node.x = 80 + col * spacingX + (row % 2) * 30;
      node.y = 80 + row * spacingY;
      node.radius = 28;
      this.nodeMap.set(node.id, node);
    });

    this.draw();
  }

  initEvents() {
    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - this.panX) / this.scale;
      const mouseY = (e.clientY - rect.top - this.panY) / this.scale;

      const clicked = this.nodes.find(n => {
        const dx = n.x - mouseX;
        const dy = n.y - mouseY;
        return Math.sqrt(dx * dx + dy * dy) <= n.radius;
      });

      if (clicked) {
        this.draggedNode = clicked;
      } else {
        this.isPanning = true;
        this.lastMousePos = { x: e.clientX, y: e.clientY };
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - this.panX) / this.scale;
      const mouseY = (e.clientY - rect.top - this.panY) / this.scale;

      if (this.draggedNode) {
        this.draggedNode.x = mouseX;
        this.draggedNode.y = mouseY;
        this.draw();
        return;
      }

      if (this.isPanning) {
        this.panX += e.clientX - this.lastMousePos.x;
        this.panY += e.clientY - this.lastMousePos.y;
        this.lastMousePos = { x: e.clientX, y: e.clientY };
        this.draw();
        return;
      }

      const hovered = this.nodes.find(n => {
        const dx = n.x - mouseX;
        const dy = n.y - mouseY;
        return Math.sqrt(dx * dx + dy * dy) <= n.radius;
      });

      if (hovered !== this.hoveredNode) {
        this.hoveredNode = hovered;
        this.draw();
      }
    });

    window.addEventListener('mouseup', () => {
      this.draggedNode = null;
      this.isPanning = false;
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      this.scale = Math.min(Math.max(0.4, this.scale * zoomFactor), 2.5);
      this.draw();
    });
  }

  getNodeColor(mastery) {
    if (mastery >= 0.75) return '#10b981'; // Mastered Emerald
    if (mastery >= 0.50) return '#6366f1'; // Progressing Indigo
    if (mastery >= 0.30) return '#f59e0b'; // Moderate Amber
    return '#ef4444'; // Low / Prereq gap Rose
  }

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(this.panX, this.panY);
    ctx.scale(this.scale, this.scale);

    // Draw Directed Edges
    this.edges.forEach(edge => {
      const from = this.nodeMap.get(edge.from);
      const to = this.nodeMap.get(edge.to);
      if (!from || !to) return;

      const angle = Math.atan2(to.y - from.y, to.x - from.x);
      const startX = from.x + from.radius * Math.cos(angle);
      const startY = from.y + from.radius * Math.sin(angle);
      const endX = to.x - to.radius * Math.cos(angle);
      const endY = to.y - to.radius * Math.sin(angle);

      // Line
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Arrow Head
      const arrowLen = 10;
      ctx.fillStyle = '#818cf8';
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - arrowLen * Math.cos(angle - Math.PI / 6), endY - arrowLen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(endX - arrowLen * Math.cos(angle + Math.PI / 6), endY - arrowLen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    });

    // Draw Nodes
    this.nodes.forEach(node => {
      const color = this.getNodeColor(node.mastery || 0);

      // Glow if hovered
      if (node === this.hoveredNode) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 18;
      } else {
        ctx.shadowBlur = 0;
      }

      // Outer circle
      ctx.fillStyle = 'rgba(17, 24, 39, 0.9)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner mastery fill badge
      const mPct = Math.round((node.mastery || 0) * 100);
      ctx.fillStyle = color;
      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${mPct}%`, node.x, node.y);

      // Node Label below
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#f8fafc';
      ctx.font = '500 12px Outfit, sans-serif';
      ctx.fillText(node.label || node.id, node.x, node.y + node.radius + 16);
    });

    ctx.restore();
  }
}
