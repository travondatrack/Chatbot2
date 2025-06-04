class GeminiChatbot {
    constructor() {
        this.chatbox = document.getElementById('chatbox');
        this.messageInput = document.getElementById('message');
        this.sendBtn = document.getElementById('sendBtn');
        this.status = document.getElementById('status');
        this.clearBtn = document.getElementById('clearBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.voiceBtn = document.getElementById('voiceBtn');
        this.attachBtn = document.getElementById('attachBtn');
        this.fileInput = document.getElementById('fileInput');
        
        this.isRecording = false;
        this.recognition = null;
        this.messages = [];
        
        this.init();
    }

    init() {
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.clearBtn.addEventListener('click', () => this.clearChat());
        this.exportBtn.addEventListener('click', () => this.exportChat());
        this.voiceBtn.addEventListener('click', () => this.toggleVoiceRecording());
        this.attachBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        
        this.messageInput.addEventListener('input', () => {
            this.sendBtn.disabled = !this.messageInput.value.trim();
        });
        
        this.initSpeechRecognition();
        this.loadMessages();
    }

    initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'vi-VN';
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.messageInput.value = transcript;
                this.sendBtn.disabled = false;
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.stopRecording();
            };
            
            this.recognition.onend = () => {
                this.stopRecording();
            };
        }
    }

    toggleVoiceRecording() {
        if (!this.recognition) {
            alert('Trình duyệt không hỗ trợ nhận dạng giọng nói');
            return;
        }
        
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    startRecording() {
        this.isRecording = true;
        this.voiceBtn.classList.add('recording');
        this.voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
        this.status.textContent = 'Đang ghi âm...';
        this.recognition.start();
    }

    stopRecording() {
        this.isRecording = false;
        this.voiceBtn.classList.remove('recording');
        this.voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        this.status.textContent = 'Sẵn sàng trò chuyện';
        if (this.recognition) {
            this.recognition.stop();
        }
    }

    handleFileUpload(e) {
        const file = e.target.files[0];
        if (file) {
            // Placeholder for file upload functionality
            this.addMessage(`Đã chọn file: ${file.name}`, 'user');
            // In a real implementation, you would send the file to the server
            this.addMessage('Xin lỗi, tính năng upload file chưa được triển khai.', 'assistant');
        }
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.sendBtn.disabled = true;
        this.showTypingIndicator();
        this.status.textContent = 'Đang xử lý...';

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });

            const data = await response.json();
            this.hideTypingIndicator();

            if (response.ok) {
                this.addMessage(data.response, 'assistant');
                this.status.textContent = 'Sẵn sàng trò chuyện';
            } else {
                this.addMessage(`Lỗi: ${data.error}`, 'assistant', true);
                this.status.textContent = 'Có lỗi xảy ra';
            }
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('Không thể kết nối đến server. Vui lòng thử lại.', 'assistant', true);
            this.status.textContent = 'Lỗi kết nối';
            console.error('Error:', error);
        }
    }

    addMessage(content, sender, isError = false) {
        // Remove empty state if exists
        const emptyState = this.chatbox.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = `message-content ${isError ? 'error-message' : ''}`;
        contentDiv.textContent = content;
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = this.formatTime(new Date());
        
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeDiv);
        this.chatbox.appendChild(messageDiv);
        
        // Scroll to bottom
        this.chatbox.scrollTop = this.chatbox.scrollHeight;
        
        // Save to messages array
        this.messages.push({
            content,
            sender,
            timestamp: new Date().toISOString(),
            isError
        });
        
        this.saveMessages();
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant';
        typingDiv.id = 'typing-indicator';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'typing-indicator';
        contentDiv.innerHTML = `
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        
        typingDiv.appendChild(contentDiv);
        this.chatbox.appendChild(typingDiv);
        this.chatbox.scrollTop = this.chatbox.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    clearChat() {
        if (confirm('Bạn có chắc muốn xóa toàn bộ cuộc trò chuyện?')) {
            this.chatbox.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <h3>Chào mừng bạn!</h3>
                    <p>Hãy bắt đầu cuộc trò chuyện với Gemini AI</p>
                </div>
            `;
            this.messages = [];
            this.saveMessages();
            this.status.textContent = 'Đã xóa cuộc trò chuyện';
        }
    }

    exportChat() {
        if (this.messages.length === 0) {
            alert('Không có tin nhắn để xuất');
            return;
        }

        const chatData = this.messages.map(msg => {
            const time = this.formatTime(new Date(msg.timestamp));
            const sender = msg.sender === 'user' ? 'Bạn' : 'Gemini';
            return `[${time}] ${sender}: ${msg.content}`;
        }).join('\n\n');

        const blob = new Blob([chatData], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gemini-chat-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    formatTime(date) {
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    saveMessages() {
        try {
            localStorage.setItem('gemini-chat-messages', JSON.stringify(this.messages));
        } catch (error) {
            console.error('Error saving messages:', error);
        }
    }

    loadMessages() {
        try {
            const saved = localStorage.getItem('gemini-chat-messages');
            if (saved) {
                this.messages = JSON.parse(saved);
                this.renderMessages();
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            this.messages = [];
        }
    }

    renderMessages() {
        if (this.messages.length === 0) return;

        // Remove empty state
        const emptyState = this.chatbox.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        this.messages.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.sender}`;
            
            const contentDiv = document.createElement('div');
            contentDiv.className = `message-content ${msg.isError ? 'error-message' : ''}`;
            contentDiv.textContent = msg.content;
            
            const timeDiv = document.createElement('div');
            timeDiv.className = 'message-time';
            timeDiv.textContent = this.formatTime(new Date(msg.timestamp));
            
            messageDiv.appendChild(contentDiv);
            messageDiv.appendChild(timeDiv);
            this.chatbox.appendChild(messageDiv);
        });

        this.chatbox.scrollTop = this.chatbox.scrollHeight;
    }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GeminiChatbot();
});
