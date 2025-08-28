document.addEventListener('DOMContentLoaded', function() {
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    // Add a welcome message
    addBotMessage('Halo! Saya adalah asisten AI untuk Aninka Fashion. Ada yang bisa saya bantu?');

    // Event listener for send button
    sendButton.addEventListener('click', sendMessage);

    // Event listener for Enter key
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    function sendMessage() {
        const message = userInput.value.trim();
        if (message === '') return;

        // Add user message to chat
        addUserMessage(message);
        userInput.value = '';

        // Show typing indicator
        showTypingIndicator();

        // Send message to API
        fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(data => {
            // Hide typing indicator
            hideTypingIndicator();
            // Add bot response to chat
            addBotMessage(data);
        })
        .catch(error => {
            console.error('Error:', error);
            hideTypingIndicator();
            addBotMessage('Maaf, terjadi kesalahan saat memproses pesan Anda. Silakan coba lagi.');
        });
    }

    function addUserMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        messageDiv.textContent = message;
        chatBox.appendChild(messageDiv);
        scrollToBottom();
    }

    function addBotMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        messageDiv.textContent = message;
        chatBox.appendChild(messageDiv);
        scrollToBottom();
    }

    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message bot-typing';
        typingDiv.id = 'typing-indicator';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            dot.className = 'dot';
            typingDiv.appendChild(dot);
        }
        
        chatBox.appendChild(typingDiv);
        scrollToBottom();
    }

    function hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    function scrollToBottom() {
        chatBox.scrollTop = chatBox.scrollHeight;
    }
});