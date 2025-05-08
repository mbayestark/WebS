const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');
const winston = require('winston');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static frontend files (adjust path if needed)
app.use(express.static(path.join(__dirname, 'front')));
app.get('/', (req,res)=>{
    res.sendFile(path.join(__dirname, 'front','index.html'))
})

// Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'chat-server.log' })
  ]
});

// Store connected clients
const clients = new Set();

server.listen(8088, () => {
  console.log(`Server running at http://localhost:8088`);
  logger.info(`Server started on port 8088`);
});

wss.on('connection', (ws) => {
  clients.add(ws);
  logger.info(`New client connected. Total clients: ${clients.size}`);

  ws.send(JSON.stringify({
    type: 'system',
    message: 'Welcome to the chat server!',
    timestamp: new Date().toISOString()
  }));

  broadcast({
    type: 'system',
    message: 'A new user has joined the chat',
    timestamp: new Date().toISOString()
  }, ws);

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message);
      logger.info(`Received message: ${parsed.text}`);
      broadcast({
        type: 'chat',
        user: parsed.user,
        text: parsed.text,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      logger.error(`Error processing message: ${err}`);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    logger.info(`Client disconnected. Remaining: ${clients.size}`);
    broadcast({
      type: 'system',
      message: 'A user has left the chat',
      timestamp: new Date().toISOString()
    });
  });
});

function broadcast(message, exclude = null) {
  clients.forEach(client => {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}
