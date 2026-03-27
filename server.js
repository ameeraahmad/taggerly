require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists (Bypass on Vercel/Stormkit as it is Read-Only)
if (!process.env.VERCEL && !process.env.STORMKIT) {
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
}

const { connectDB } = require('./config/db');
// Load associations
require('./models/associations');


const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database (Non-blocking)
connectDB().catch(err => console.error('Delayed DB Connection Error:', err));


const rateLimit = require('express-rate-limit');

// Stripe webhook needs raw body - MUST be before express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP to allow CDN scripts like Tailwind/Google Fonts easily, or configure it specifically if needed
}));
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Limit JSON size
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Limit URL encoded size

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' }
});

// Apply rate limiting to all requests
app.use('/api', limiter);

// Pass io to controllers (lazy load)
app.use((req, res, next) => {
    req.io = global.io || { emit: () => {} };
    next();
});

// Routes
const adRoutes = require('./routes/adRoutes');
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

app.use('/api/ads', adRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ success: true, status: 'Server is running', timestamp: new Date() });
});

app.get('/api/ping', (req, res) => {
    res.send('pong');
});

// Dynamic Sitemap for SEO
app.get('/sitemap.xml', async (req, res) => {
    try {
        const Ad = require('./models/Ad');
        const ads = await Ad.findAll({ where: { status: 'active' } });
        const host = `${req.protocol}://${req.get('host')}`;

        let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
        sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        // Static pages
        const staticPages = ['', 'categories.html', 'search.html', 'plans.html', 'login.html'];
        staticPages.forEach(page => {
            sitemap += `  <url>\n    <loc>${host}/${page}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
        });

        // Dynamic Ad pages
        ads.forEach(ad => {
            sitemap += `  <url>\n    <loc>${host}/ad-details.html?id=${ad.id}</loc>\n    <lastmod>${ad.updatedAt.toISOString().split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
        });

        sitemap += '</urlset>';

        res.header('Content-Type', 'application/xml');
        res.status(200).send(sitemap);
    } catch (err) {
        console.error('Sitemap error:', err);
        res.status(500).end();
    }
});

// Robots.txt for SEO
app.get('/robots.txt', (req, res) => {
    const host = `${req.protocol}://${req.get('host')}`;
    res.type('text/plain');
    res.send(`User-agent: *\nAllow: /\nSitemap: ${host}/sitemap.xml`);
});

// Simplified Ad Details for Vercel (No SSR, just send file)
app.get('/ad-details.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'ad-details.html'));
});

// Serve static files (After API routes and SSR)
app.use(express.static(path.join(__dirname), { dotfiles: 'ignore' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 404 Handler for API
app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
        return res.status(404).json({ success: false, message: 'API Endpoint not found' });
    }
    // For non-API routes, if no other route handled it (and not a static file)
    // we let it fall through to the global error handler or send a simple 404
    next();
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

// Socket.io & Local Server Logic (Bypass on Serverless platforms like Vercel/Stormkit)
if (!process.env.VERCEL && !process.env.STORMKIT) {
    const http = require('http');
    const server = http.createServer(app);
    const { Server } = require('socket.io');
    const io_instance = new Server(server, {
        cors: { origin: "*", methods: ["GET", "POST"] }
    });

    // Share io_instance with routes
    global.io = io_instance;

    const initCronJobs = require('./utils/cronJobs');
    initCronJobs(io_instance);

    io_instance.on('connection', (socket) => {
        console.log('👤 User connected:', socket.id);
        socket.on('join_user', (userId) => { socket.join(`user_${userId}`); });
        socket.on('join_conversation', (convoId) => { socket.join(`convo_${convoId}`); });
        socket.on('disconnect', () => { console.log('👤 User disconnected'); });
    });

    if (require.main === module) {
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server is listening locally on 0.0.0.0:${PORT}`);
        });
    }
} else {
    // On Vercel, just mock io
    global.io = { emit: () => {} };
}

// Start Server (Handled inside the non-serverless block or exported for serverless)


// Export the app for Vercel (Required for Serverless Functions)
module.exports = app;



