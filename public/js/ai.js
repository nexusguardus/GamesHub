document.addEventListener("DOMContentLoaded", async () => {
  const chatMessages = document.getElementById("chat-messages");
  const chatInput = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");
  const modelSelect = document.getElementById("model-select");
  let conversationHistory = [];

  const statusRes = await fetch("/api/ai-status");
  const statusData = await statusRes.json();
  const statusEl = document.getElementById("ai-status");
  if (statusEl) {
    statusEl.textContent = statusData.online ? "Luna AI is online" : "Luna AI is offline";
    statusEl.style.color = statusData.online ? "var(--primary-color)" : "#e94560";
  }

  function addMessage(role, content) {
    const msg = document.createElement("div");
    msg.className = `chat-message ${role}`;
    msg.innerHTML = `<div class="message-content">${content}</div>`;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  addMessage("assistant", "Hi! I'm Luna, your AI assistant. How can I help you today?");

  async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    chatInput.value = "";
    addMessage("user", message);
    conversationHistory.push({ role: "user", content: message });

    const loadingMsg = document.createElement("div");
    loadingMsg.className = "chat-message assistant";
    loadingMsg.innerHTML = '<div class="message-content">Thinking...</div>';
    chatMessages.appendChild(loadingMsg);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          conversationHistory: conversationHistory.slice(-10),
          model: modelSelect ? modelSelect.value : "llama-3.1-8b-instant",
        }),
      });
      const data = await response.json();
      loadingMsg.remove();
      if (data.response) {
        addMessage("assistant", data.response);
        conversationHistory.push({ role: "assistant", content: data.response });
      } else {
        addMessage("assistant", "Sorry, I couldn't get a response. Please try again.");
      }
    } catch (error) {
      loadingMsg.remove();
      addMessage("assistant", "Error: Could not connect to AI service.");
    }
  }

  if (sendBtn) sendBtn.addEventListener("click", sendMessage);
  if (chatInput) chatInput.addEventListener("keydown", (e) => { if (e.key === "Enter") sendMessage(); });
});
