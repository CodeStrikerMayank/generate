/**
 * AI Study Mentor Chat & Practice Generator Controller.
 * Grounded in recent quiz performance and dynamic roadmap intelligence.
 */
const AIAssistantController = {
  chatHistory: [
    {
      sender: 'ai',
      text: "👋 Hi! I'm your offline AI Study Mentor for **JEE Main & NEET-UG**.\n\nTake your compulsory diagnostic quiz and I will extract your **Latent Ability (θ)**, analyze your exact calculation/concept errors, and explain your personalized roadmap sequence.\n\nUse the quick prompts below to inspect your performance!"
    }
  ],

  formatMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px;color:var(--accent-cyan);font-family:var(--font-mono);font-size:0.85em;">$1</code>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
  },

  renderChat() {
    const container = document.getElementById('chatMessagesContainer');
    if (!container) return;

    container.innerHTML = this.chatHistory.map(msg => `
      <div class="chat-bubble ${msg.sender === 'user' ? 'user' : 'ai'}">
        <div style="font-size:0.7rem;font-weight:700;opacity:0.6;margin-bottom:4px;">${msg.sender === 'user' ? 'You' : '🤖 AI Mentor'}</div>
        <div style="line-height:1.6;font-size:0.88rem;">${this.formatMarkdown(msg.text)}</div>
      </div>
    `).join('');

    container.scrollTop = container.scrollHeight;
  },

  sendQuickPrompt(text) {
    const input = document.getElementById('chatInput');
    if (input) {
      input.value = text;
      this.sendMessage();
    }
  },

  async sendMessage() {
    const input = document.getElementById('chatInput');
    if (!input || !input.value.trim()) return;

    const text = input.value.trim();
    input.value = '';
    this.chatHistory.push({ sender: 'user', text });
    this.renderChat();

    // Thinking bubble
    this.chatHistory.push({ sender: 'ai', text: '⏳ Analyzing your quiz telemetry & knowledge graph…' });
    this.renderChat();

    const studentId = AppState.student?.student_id || 'demo_student';

    try {
      const res = await API.chatAI(studentId, text);
      this.chatHistory.pop(); // Remove thinking bubble
      this.chatHistory.push({ sender: 'ai', text: res.response || 'Done!' });
    } catch (err) {
      this.chatHistory.pop();
      this.chatHistory.push({
        sender: 'ai',
        text: '🔌 Offline AI temporarily disconnected. Your roadmap is still safely synchronized via local SQLite database.'
      });
    }
    this.renderChat();
  },

  async generatePracticeQuestion() {
    const conceptId = document.getElementById('genConceptSelect')?.value || 'math_limits';
    const outputBox = document.getElementById('genQuestionOutput');
    if (!outputBox) return;

    outputBox.innerHTML = `
      <div style="display:flex;gap:6px;align-items:center;color:var(--text-secondary);font-size:0.85rem;padding:0.75rem 0;">
        <span class="pulse-dot"></span><span class="pulse-dot"></span><span class="pulse-dot"></span>
        &nbsp;Generating validated question…
      </div>`;

    try {
      const exam = AppState.currentExam || 'JEE';
      const subject = exam === 'NEET' ? 'Biology' : 'Mathematics';
      const chapter = exam === 'NEET' ? 'Genetics' : 'Calculus';

      const q = await API.generatePracticeQuestion(exam, subject, chapter, conceptId, 0.65);
      outputBox.innerHTML = `
        <div class="glass-card" style="margin-top:0.75rem;">
          <span class="nba-tag" style="margin-bottom:0.75rem;">✅ Validated Question</span>
          <div style="font-size:0.95rem;font-weight:700;margin:0.75rem 0;line-height:1.6;">${q.content}</div>
          <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:0.85rem;">
            ${(q.options || []).map(o => `
              <div style="padding:8px 12px;background:rgba(255,255,255,0.04);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);font-size:0.88rem;">
                <strong style="color:var(--accent-cyan);">${o.id}.</strong> ${o.text}
              </div>
            `).join('')}
          </div>
          <div style="font-size:0.88rem;color:var(--accent-emerald);font-weight:700;margin-bottom:0.4rem;">✓ Answer: Option ${q.correct_answer}</div>
          <div style="font-size:0.82rem;color:var(--text-secondary);line-height:1.55;">${q.explanation}</div>
        </div>
      `;
    } catch (err) {
      outputBox.innerHTML = `
        <div style="color:var(--accent-danger);font-size:0.85rem;padding:0.75rem;background:rgba(244,63,94,0.08);border-radius:var(--radius-sm);margin-top:0.5rem;">
          ⚠️ ${err.message}
        </div>`;
    }
  }
};
