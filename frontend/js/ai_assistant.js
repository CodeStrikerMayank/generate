/**
 * AI Study Mentor Chat Controller — FAQ Mode.
 * All queries are pre-defined FAQ buttons; no free-text input is presented to users.
 */
const AIAssistantController = {
  chatHistory: [
    {
      sender: 'ai',
      text: "👋 Hi! I'm your **CoreShadow AI Study Mentor** for **JEE Main & NEET-UG**.\n\nTake your compulsory diagnostic quiz and I will extract your **Latent Ability (θ)**, analyze your exact calculation/concept errors, and explain your personalized roadmap sequence.\n\n👇 **Pick any question below** to get personalized AI guidance based on your quiz data!"
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

  /** Called by FAQ buttons — sends the full question text directly */
  async sendQuickPrompt(text) {
    if (!text || !text.trim()) return;

    this.chatHistory.push({ sender: 'user', text: text.trim() });
    this.renderChat();

    // Thinking bubble
    this.chatHistory.push({ sender: 'ai', text: '⏳ Analyzing your quiz telemetry & knowledge graph…' });
    this.renderChat();

    const studentId = (window.AppState && AppState.student && AppState.student.student_id)
      ? AppState.student.student_id
      : 'demo_student';

    try {
      const res = await API.chatAI(studentId, text.trim());
      this.chatHistory.pop(); // Remove thinking bubble
      this.chatHistory.push({ sender: 'ai', text: res.response || 'Analysis complete!' });
    } catch (err) {
      this.chatHistory.pop();
      this.chatHistory.push({
        sender: 'ai',
        text: '🔌 Offline AI temporarily disconnected. Your roadmap is still safely synchronized via local SQLite database.\n\n**Tip:** Make sure the backend server is running on port 8000.'
      });
    }
    this.renderChat();

    // Scroll chat into view
    const container = document.getElementById('chatMessagesContainer');
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  },

  /** Legacy stub — kept so no JS errors if anything still calls sendMessage() */
  sendMessage() {
    const input = document.getElementById('chatInput');
    if (input && input.value.trim()) {
      this.sendQuickPrompt(input.value.trim());
      input.value = '';
    }
  }
};
