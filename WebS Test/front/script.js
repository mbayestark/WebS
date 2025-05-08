let socket;
let username;

document.getElementById('connect-btn').addEventListener('click', connect);
document.getElementById('disconnect-btn').addEventListener('click', disconnect);
document.getElementById('send-btn').addEventListener('click', sendMessage);
document.getElementById('message-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function connect() {
    username = document.getElementById('username').value.trim();
    if (!username) {
        alert('Please enter a username');
        return;
    }

    socket = new WebSocket('ws://localhost:8088');

    socket.onopen = () => {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('chat-section').classList.remove('hidden');
        document.getElementById('username').value = '';
        document.getElementById('message-input').focus();
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        displayMessage(data);
    };

    socket.onclose = () => {
        addSystemMessage('Disconnected from server');
        setTimeout(() => {
            location.reload();
        }, 2000);
    };

    socket.onerror = (error) => {
        addSystemMessage(`Error: ${error.message}`);
    };
}

function disconnect() {
    if (socket) {
        socket.close();
    }
}

function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();

    if (message && socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            user: username,
            text: message
        }));
        input.value = '';
    }
}

function displayMessage(data) {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');

    if (data.type === 'system') {
        messageDiv.classList.add('system-message');
        messageDiv.textContent = data.message;
    } else {
        messageDiv.classList.add('user-message');
        messageDiv.innerHTML = `
            <strong>${data.user}:</strong> ${data.text}
            <div class="timestamp">${new Date(data.timestamp).toLocaleTimeString()}</div>
        `;
    }

    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addSystemMessage(message) {
    displayMessage({
        type: 'system',
        message: message,
        timestamp: new Date().toISOString()
    });
}
