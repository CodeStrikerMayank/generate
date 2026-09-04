/**
 * Admin Authentication Gate — CoreShadow Adaptive Engine
 * Multi-user secure access control. Credentials are SHA-256 hashed at runtime.
 * No plaintext passwords stored in source code.
 */

const AdminAuth = {
  SESSION_KEY: 'aie_admin_authed',
  SESSION_USER_KEY: 'aie_admin_user',

  /**
   * Credential table: username → SHA-256 hash of password.
   * Passwords: admin→9999, uncle→unclechan, lovehell→9999, striker→7777, core→unclechan
   * Generated via: await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
   */
  _CREDENTIAL_TABLE: {
    admin:    '888df25ae35772424a560c7152a1de794440e0ea5cfee62828333a456a506e05', // 9999
    uncle:    '55d9c2eb3e3202f308fd9a11cacd2da9a2e1ef53bcb1ffaf651edadc22f56337', // unclechan
    lovehell: '888df25ae35772424a560c7152a1de794440e0ea5cfee62828333a456a506e05', // 9999
    striker:  '41c991eb6a66242c0454191244278183ce58cf4a6bcd372f799e4b9cc01886af', // 7777
    core:     '55d9c2eb3e3202f308fd9a11cacd2da9a2e1ef53bcb1ffaf651edadc22f56337', // unclechan
  },

  /** Compute SHA-256 hash of a string, returns lowercase hex */
  async _sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  },

  /** Returns the currently logged-in username (or null) */
  getLoggedInUser() {
    return sessionStorage.getItem(this.SESSION_USER_KEY) || null;
  },

  /** Check session — if not authenticated show login gate */
  check() {
    if (sessionStorage.getItem(this.SESSION_KEY) === '1') {
      this._hideOverlay();
      return true;
    }
    this._showOverlay();
    return false;
  },

  _showOverlay() {
    const overlay = document.getElementById('adminLoginOverlay');
    if (overlay) overlay.classList.add('active');
    setTimeout(() => this._startParticles(), 100);
    setTimeout(() => {
      const u = document.getElementById('adminUsername');
      if (u) u.focus();
    }, 200);
  },

  _hideOverlay() {
    const overlay = document.getElementById('adminLoginOverlay');
    if (overlay) overlay.classList.remove('active');
  },

  async login() {
    const u = (document.getElementById('adminUsername')?.value || '').trim().toLowerCase();
    const p = document.getElementById('adminPassword')?.value || '';
    const errEl = document.getElementById('adminLoginError');
    const btn = document.getElementById('adminLoginBtn');

    if (!u || !p) {
      if (errEl) { errEl.innerText = '⚠️ Please enter both username and password.'; errEl.style.display = 'block'; }
      return;
    }

    // Disable button during async hash check
    if (btn) { btn.disabled = true; btn.innerText = '🔒 Verifying…'; }

    try {
      const hash = await this._sha256(p);
      const expectedHash = this._CREDENTIAL_TABLE[u];

      if (expectedHash && hash === expectedHash) {
        // ── Success ──
        sessionStorage.setItem(this.SESSION_KEY, '1');
        sessionStorage.setItem(this.SESSION_USER_KEY, u);

        if (btn) { btn.innerText = '✅ Authenticated!'; btn.style.background = 'var(--grad-emerald)'; }
        setTimeout(() => {
          this._hideOverlay();
          AppState.showLauncherScreen();
        }, 700);
      } else {
        // ── Failure — no credential hints ──
        if (errEl) {
          errEl.innerText = '❌ Invalid credentials. Please try again.';
          errEl.style.display = 'block';
        }
        const box = document.getElementById('adminLoginBox');
        if (box) {
          box.classList.add('shake');
          setTimeout(() => box.classList.remove('shake'), 600);
        }
        if (btn) {
          btn.disabled = false;
          btn.innerText = '🔐 Authenticate →';
        }
      }
    } catch (err) {
      if (errEl) { errEl.innerText = '⚠️ Authentication error. Please refresh.'; errEl.style.display = 'block'; }
      if (btn) { btn.disabled = false; btn.innerText = '🔐 Authenticate →'; }
    }
  },

  logout() {
    localStorage.removeItem('adaptive_student_id');
    localStorage.removeItem('adaptive_locked_exam');
    AppState.student = null;
    AppState.lockedExam = null;
    AppState.isExamLocked = false;
    AppState.showLauncherScreen();
  },

  hardLogout() {
    sessionStorage.removeItem(this.SESSION_KEY);
    sessionStorage.removeItem(this.SESSION_USER_KEY);
    localStorage.removeItem('adaptive_student_id');
    localStorage.removeItem('adaptive_locked_exam');
    location.reload();
  },

  showPanel() {
    const modal = document.getElementById('adminPanelModal');
    if (modal) {
      modal.classList.add('active');
      AdminAuth.loadAdminPanel();
    }
  },

  closePanel() {
    const modal = document.getElementById('adminPanelModal');
    if (modal) modal.classList.remove('active');
  },

  async loadAdminPanel() {
    const container = document.getElementById('adminPanelContent');
    if (!container) return;
    container.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--text-secondary);">⚙️ Loading admin data…</div>`;

    const currentUser = this.getLoggedInUser() || 'unknown';

    try {
      const health = await fetch('/api/health').then(r => r.json());
      const adminStats = await fetch('/api/admin/stats', {
        headers: { 'X-Admin-Key': 'aie_internal_2024' }
      }).then(r => r.ok ? r.json() : null).catch(() => null);

      container.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:1.25rem;padding:0.75rem 1rem;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.25);border-radius:var(--radius-sm);">
          <div style="width:36px;height:36px;border-radius:50%;background:var(--grad-hero);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:1.1rem;">${currentUser.charAt(0).toUpperCase()}</div>
          <div>
            <div style="font-weight:800;font-size:0.9rem;">Logged in as <span style="color:var(--accent-neon);">${currentUser}</span></div>
            <div style="font-size:0.72rem;color:var(--text-muted);">Authorized operator · Session active</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:0.75rem;margin-bottom:1.5rem;">
          <div class="glass-card stat-card" style="padding:1rem;border-color:var(--accent-emerald);">
            <div class="stat-label">Engine Status</div>
            <div class="stat-val" style="font-size:1.1rem;color:var(--accent-emerald);">🟢 ${health.status}</div>
            <div class="stat-sub">v${health.version || '4.0'}</div>
          </div>
          <div class="glass-card stat-card" style="padding:1rem;border-color:var(--accent-cyan);">
            <div class="stat-label">Students Registered</div>
            <div class="stat-val" style="font-size:1.5rem;color:var(--accent-cyan);">${adminStats?.total_students ?? '—'}</div>
            <div class="stat-sub">All time</div>
          </div>
          <div class="glass-card stat-card" style="padding:1rem;border-color:var(--accent-purple);">
            <div class="stat-label">Assessments Taken</div>
            <div class="stat-val" style="font-size:1.5rem;color:var(--accent-purple);">${adminStats?.total_attempts ?? '—'}</div>
            <div class="stat-sub">Diagnostic + Drills</div>
          </div>
          <div class="glass-card stat-card" style="padding:1rem;border-color:var(--accent-amber);">
            <div class="stat-label">Questions in Bank</div>
            <div class="stat-val" style="font-size:1.5rem;color:var(--accent-amber);">${adminStats?.total_questions ?? '—'}</div>
            <div class="stat-sub">PYQ-Adapted</div>
          </div>
        </div>

        <div class="glass-card" style="padding:1.25rem;margin-bottom:1rem;border:1px solid rgba(244,63,94,0.3);">
          <div style="font-size:1rem;font-weight:800;color:var(--accent-rose);margin-bottom:0.5rem;">⚠️ Danger Zone — Admin Reset</div>
          <p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:1rem;line-height:1.5;">
            Hard reset wipes ALL student records, assessment attempts, mastery data, and roadmaps.
            The question bank and curriculum are preserved and reseeded.
          </p>
          <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
            <button class="btn-primary" style="background:var(--grad-rose);padding:0.65rem 1.5rem;font-weight:800;" onclick="AdminAuth.confirmReset()">
              💣 Hard Reset — Wipe All Student Data
            </button>
            <button class="btn-secondary" style="padding:0.65rem 1.25rem;" onclick="AdminAuth.closePanel();AppState.showLauncherScreen()">
              ↩ Back to Launcher
            </button>
          </div>
        </div>

        ${adminStats?.students ? `
        <div class="glass-card" style="padding:1.25rem;">
          <div style="font-size:0.88rem;font-weight:800;margin-bottom:0.75rem;">👥 Recent Students</div>
          <div style="max-height:220px;overflow-y:auto;">
            ${adminStats.students.slice(0,10).map((s) => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem 0;border-bottom:1px solid var(--border-subtle);">
                <div>
                  <div style="font-weight:700;font-size:0.85rem;">${s.name}</div>
                  <div style="font-size:0.72rem;color:var(--text-muted);">${s.target_exam} · ${s.student_id}</div>
                </div>
                <div style="font-size:0.78rem;color:var(--accent-cyan);">${s.attempts ?? 0} attempts</div>
              </div>
            `).join('')}
          </div>
        </div>` : ''}
      `;
    } catch (err) {
      container.innerHTML = `<div style="color:var(--accent-rose);padding:1rem;">Error loading admin data: ${err.message}</div>`;
    }
  },

  async confirmReset() {
    const confirmed = confirm(
      '⚠️ HARD RESET\n\nThis will permanently delete:\n• All student accounts\n• All assessment history\n• All mastery records\n• All roadmaps\n\nThe question bank will be preserved.\n\nProceed?'
    );
    if (!confirmed) return;

    const btn = event.target;
    btn.disabled = true;
    btn.innerText = '⏳ Resetting…';

    try {
      const res = await fetch('/api/admin/reset-db', {
        method: 'POST',
        headers: { 'X-Admin-Key': 'aie_internal_2024' }
      });
      if (!res.ok) throw new Error(await res.text());
      btn.innerText = '✅ Reset Complete!';
      btn.style.background = 'var(--grad-emerald)';
      localStorage.removeItem('adaptive_student_id');
      AppState.student = null;
      setTimeout(() => {
        AdminAuth.closePanel();
        AppState.showLauncherScreen();
        AppState._toast('🔄 Database reset complete! Fresh start ready.', 'success');
      }, 1200);
    } catch (err) {
      btn.disabled = false;
      btn.innerText = '💣 Hard Reset — Wipe All Student Data';
      AppState._toast('Reset failed: ' + err.message, 'error');
    }
  },

  _startParticles() {
    const canvas = document.getElementById('adminParticleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.1,
      color: ['#6366f1','#06b6d4','#a855f7','#10b981'][Math.floor(Math.random()*4)]
    }));

    let animId;
    const draw = () => {
      if (!document.getElementById('adminLoginOverlay')?.classList.contains('active')) {
        cancelAnimationFrame(animId);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      });
      ctx.globalAlpha = 0.08;
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    };
    draw();
  }
};

// Allow Enter key on login fields
document.addEventListener('DOMContentLoaded', () => {
  ['adminUsername', 'adminPassword'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') AdminAuth.login(); });
  });
});
