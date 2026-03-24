const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function addMessage(content, isUser) {
    const div = document.createElement('div');
    div.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    div.innerHTML = `<div class="message-content">${escapeHtml(content)}</div>`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
    const div = document.createElement('div');
    div.className = 'message bot-message typing-indicator';
    div.id = 'typingIndicator';
    div.innerHTML = '<div class="message-content"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>';
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (!message) return;

    addMessage(message, true);
    messageInput.value = '';
    sendButton.disabled = true;
    showTypingIndicator();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
        });
        const data = await response.json();
        removeTypingIndicator();

        if (data.reply) {
            addMessage(data.reply, false);
        } else if (data.error) {
            addMessage('Sorry, something went wrong. Please try again.', false);
        }
    } catch (error) {
        removeTypingIndicator();
        addMessage('Sorry, I couldn\'t connect to the server. Please try again.', false);
    } finally {
        sendButton.disabled = false;
        messageInput.focus();
    }
});
