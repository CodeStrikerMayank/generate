/**
 * Offline AI Study Assistant & Question Generator Controller.
 */
const AIAssistantController = {
  chatHistory: [
    { sender: 'ai', text: 'Hello! I am your offline pedagogical AI study assistant. Ask me to explain concepts, clarify roadmap priorities, or generate practice questions.' }
  ],

  renderChat() {
    const container = document.getElementById('chatMessagesContainer');
    if (!container) return;

    container.innerHTML = this.chatHistory.map(msg => `
      <div class="chat-msg ${msg.sender === 'user' ? 'msg-user' : 'msg-ai'}">
        <div style="font-size: 0.75rem; opacity: 0.7; margin-bottom: 2px;">${msg.sender === 'user' ? 'You' : 'AI Study Mentor'}</div>
        <div>${msg.text.replace(/\n/g, '<br/>')}</div>
      </div>
    `).join('');

    container.scrollTop = container.scrollHeight;
  },

  async sendMessage() {
    const input = document.getElementById('chatInput');
    if (!input || !input.value.trim()) return;

    const text = input.value.trim();
    input.value = '';

    this.chatHistory.push({ sender: 'user', text });
    this.renderChat();

    const studentId = AppState.student ? AppState.student.student_id : 'demo_student';

    try {
      const res = await API.chatAI(studentId, text);
      this.chatHistory.push({ sender: 'ai', text: res.response });
    } catch (err) {
      this.chatHistory.push({ sender: 'ai', text: 'Local AI is offline. Using deterministic rules to assist your roadmap.' });
    }

    this.renderChat();
  },

  async generatePracticeQuestion() {
    const conceptId = document.getElementById('genConceptSelect')?.value || 'math_limits';
    const outputBox = document.getElementById('genQuestionOutput');
    if (!outputBox) return;

    outputBox.innerHTML = '<div style="color: var(--text-secondary);">Generating validated question...</div>';

    try {
      const q = await API.generatePracticeQuestion(AppState.currentExam, 'Mathematics', 'Calculus', conceptId, 0.65);
      outputBox.innerHTML = `
        <div class="glass-card" style="margin-top: 1rem;">
          <div class="nba-tag">Generated & Validated Question</div>
          <div style="font-weight: 600; margin: 0.5rem 0;">${q.content}</div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
            ${(q.options || []).map(o => `<div><strong>${o.id}:</strong> ${o.text}</div>`).join('')}
          </div>
          <div style="font-size: 0.85rem; color: var(--accent-success);"><strong>Correct Answer:</strong> Option ${q.correct_answer}</div>
          <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.4rem;">${q.explanation}</div>
        </div>
      `;
    } catch (err) {
      outputBox.innerHTML = `<div style="color: var(--accent-danger);">Error: ${err.message}</div>`;
    }
  }
};
