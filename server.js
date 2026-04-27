require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists (Bypass on Vercel as it is Read-Only)
if (!process.env.VERCEL) {
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
}


const { connectDB } = require('./config/db');
// Load associations
require('./models/associations');


const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;

console.log('🔍 Starting Server Initialization...');
console.log(`📡 Attempting to listen on Port: ${PORT}`);

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

// Rate Limiting - Optimized for a smooth user experience
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute window
    max: 2000, // Limit each IP to 2000 requests per minute (very generous for normal browsing)
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again in a minute.' }
});

// Stricter limiter for Auth routes (Login/Register) to prevent brute force
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 login/register attempts per 15 minutes
    message: { success: false, message: 'Too many login attempts, please try again after 15 minutes.' }
});

// Favicon handler - prevents 404 in console if missing
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Apply stricter limit to auth routes
app.use('/api/auth', authLimiter);

// Apply general rate limiting to all other API requests
app.use('/api', limiter);

// Pass io to controllers (lazy load)
app.use((req, res, next) => {
    // Safer mock that supports .to().emit()
    const mockIo = { 
        emit: () => {}, 
        to: () => ({ emit: () => {} }) 
    };
    req.io = global.io || mockIo;
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
const newsletterRoutes = require('./routes/newsletterRoutes');
const blogRoutes = require('./routes/blogRoutes');
const supportRoutes = require('./routes/supportRoutes');

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
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/blog', (req, res, next) => {
    if (req.method !== 'GET') {
        console.log(`[BLOG API] ${req.method} ${req.url}`, req.body);
    } else {
        console.log(`[BLOG API] ${req.method} ${req.url}`);
    }
    next();
}, blogRoutes);
app.use('/api/support', supportRoutes);

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

// ─── Dev Hot Reload for Translation Files ───
// Force no-cache on translation files so the browser always fetches the latest version
app.get('/assets/js/ar.js', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    next();
});
app.get('/assets/js/en.js', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    next();
});

// SSE endpoint: browsers connect here to receive live reload signals
const devReloadClients = new Set();
app.get('/dev-reload', (req, res) => {
    if (process.env.NODE_ENV === 'production') return res.status(404).end();
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    res.write('data: connected\n\n');
    devReloadClients.add(res);
    req.on('close', () => devReloadClients.delete(res));
});

// Watch translation files and broadcast a reload signal when they change
if (process.env.NODE_ENV !== 'production') {
    const translationFiles = [
        path.join(__dirname, 'assets/js/ar.js'),
        path.join(__dirname, 'assets/js/en.js')
    ];
    let reloadTimer;
    translationFiles.forEach(filePath => {
        fs.watch(filePath, () => {
            clearTimeout(reloadTimer);
            reloadTimer = setTimeout(() => {
                console.log('🌐 Translation file changed — notifying browsers...');
                devReloadClients.forEach(client => {
                    try { client.write('data: reload\n\n'); } catch (e) { devReloadClients.delete(client); }
                });
            }, 300);
        });
    });
    console.log('👀 Watching translation files for changes (Hot Reload active).');
}

// Serve static files (After API routes and SSR)
app.use(express.static(path.join(__dirname)));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 404 Handler
app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
        return res.status(404).json({ success: false, message: 'API Endpoint not found' });
    }
    // For non-API routes, send the 404.html file
    res.status(404).sendFile(path.join(__dirname, '404.html'));
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

// Server start up logic
if (require.main === module) {
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
        console.log(`👤 Socket connected: ${socket.id}`);
        
        socket.on('join_user', async (userId) => { 
            console.log(`🔗 Socket ${socket.id} joining room: user_${userId}`);
            socket.join(`user_${userId}`);
            socket.userId = userId;

            // Update user status to online
            try {
                const User = require('./models/User');
                await User.update({ isOnline: true, lastActive: new Date() }, { where: { id: userId } });
                io_instance.emit('user_status_changed', { userId, isOnline: true });
            } catch (err) {
                console.error('Error updating user status (online):', err);
            }
        });
        
        socket.on('join_conversation', (convoId) => { 
            console.log(`🔗 Socket ${socket.id} joining room: convo_${convoId}`);
            socket.join(`convo_${convoId}`); 
        });
        
        socket.on('join_support', (data) => { 
            const requestId = typeof data === 'object' ? data.requestId : data;
            const isAdmin = typeof data === 'object' ? data.isAdmin : false;

            console.log(`🔗 Socket ${socket.id} joining room: support_${requestId} (Admin: ${isAdmin})`);
            socket.join(`support_${requestId}`);
            
            if (!isAdmin) {
                socket.supportRequestId = requestId;
                // Only notify if a customer joins
                io_instance.emit('support_online_status', { requestId, isOnline: true });
            }
        });
        
        socket.on('disconnect', async () => { 
            console.log(`👤 Socket disconnected: ${socket.id}`); 
            if (socket.userId) {
                try {
                    const User = require('./models/User');
                    // Check if user has other active connections before marking offline
                    const sockets = await io_instance.in(`user_${socket.userId}`).fetchSockets();
                    if (sockets.length === 0) {
                        await User.update({ isOnline: false, lastActive: new Date() }, { where: { id: socket.userId } });
                        io_instance.emit('user_status_changed', { userId: socket.userId, isOnline: false, lastActive: new Date() });
                    }
                } catch (err) {
                    console.error('Error updating user status (offline):', err);
                }
            }

            // Handle Support Online Status
            if (socket.supportRequestId) {
                const supportSockets = await io_instance.in(`support_${socket.supportRequestId}`).fetchSockets();
                if (supportSockets.length === 0) {
                    io_instance.emit('support_online_status', { requestId: socket.supportRequestId, isOnline: false });
                }
            }
        });
    });

    server.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server listening at http://localhost:${PORT}`);
    });
} else {
    // If required as a module (e.g. for testing)
    global.io = { emit: () => {} };
}

module.exports = app;




