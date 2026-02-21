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
app.use('/api', (req, res) => {
    res.status(404).json({ success: false, message: 'API Endpoint not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('🔥 Server Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

// Start Server
if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server is listening on 0.0.0.0:${PORT}`);
    });
}

module.exports = app;



