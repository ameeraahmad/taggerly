const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load env variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const adRoutes = require('./routes/adRoutes');

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Use Routes
app.use('/api/ads', adRoutes);

// Basic Route for testing
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running', timestamp: new Date() });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ Successfully connected to MongoDB Database.');
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:');
        console.error(err.message);
        console.log('💡 Tip: Make sure MongoDB is installed and running, or check your MONGODB_URI in .env');
    });

// Start Server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
        console.log('Press Ctrl+C to stop the server.');
    });
}

module.exports = app;
