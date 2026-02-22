require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const { connectDB } = require('./config/db');
// Load associations
require('./models/associations');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database (Non-blocking)
connectDB().catch(err => console.error('Delayed DB Connection Error:', err));


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Pass io to controllers
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Routes
const adRoutes = require('./routes/adRoutes');
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');

app.use('/api/ads', adRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ success: true, status: 'Server is running', timestamp: new Date() });
});

app.get('/api/ping', (req, res) => {
    res.send('pong');
});

// Serve static files (After API routes)
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 404 Handler for API
app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
        return res.status(404).json({ success: false, message: 'API Endpoint not found' });
    }
    // For non-API routes, if no other route or static file handled it,
    // you might want to serve a client-side app's index.html here,
    // or a generic 404 page. For now, we'll just send a simple text 404.
    res.status(404).send('Not Found');
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('🔥 Server Error:', err);

    // Handle Sequelize Validation Errors
    let message = err.message || 'Unknown Server Error';
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        message = err.errors.map(e => e.message).join(', ');
    }

    res.status(err.status || 500).json({
        success: false,
        message: message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Create HTTP Server for Socket.io
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Socket.io Connection Logic
const ChatMessage = require('./models/ChatMessage');
const Conversation = require('./models/Conversation');
const User = require('./models/User');

io.on('connection', (socket) => {
    console.log('👤 User connected:', socket.id);

    socket.on('join_user', async (userId) => {
        socket.userId = userId; // Store userId on socket object
        socket.join(`user_${userId}`);
        console.log(`👤 User joined user room: user_${userId}`);

        // Update status to Online
        try {
            await User.update({ isOnline: true }, { where: { id: userId } });
            // Broadcast to everyone that this user is online
            io.emit('user_status_change', { userId, isOnline: true });
        } catch (err) {
            console.error('Error updating user status:', err);
        }
    });

    socket.on('join_conversation', (conversationId) => {
        socket.join(`convo_${conversationId}`);
        console.log(`📂 User joined conversation: convo_${conversationId}`);
    });

    // Note: send_message is now handled via HTTP API (POST /api/chat/message)
    // The API saves to DB, handles image uploads, and emits receive_message + new_message_notification via req.io
    // Socket is used here only for joining rooms

    socket.on('disconnect', async () => {
        console.log('👤 User disconnected');
        if (socket.userId) {
            try {
                await User.update({
                    isOnline: false,
                    lastActive: new Date()
                }, {
                    where: { id: socket.userId }
                });

                // Broadcast to everyone that this user is offline
                io.emit('user_status_change', {
                    userId: socket.userId,
                    isOnline: false,
                    lastActive: new Date()
                });
            } catch (err) {
                console.error('Error updating user disconnect status:', err);
            }
        }
    });
});

// Start Server
if (require.main === module) {
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server is listening on 0.0.0.0:${PORT}`);
    });
}

module.exports = { app, server, io };



