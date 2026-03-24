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
    req.io = (typeof io !== 'undefined') ? io : { emit: () => {} }; // Mock io if disabled on Vercel
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

// SSR for Ad Details (SEO & Social Sharing) - MUST be before express.static
app.get('/ad-details.html', async (req, res) => {
    const adId = req.query.id;
    const filePath = path.join(__dirname, 'ad-details.html');

    if (!adId || !fs.existsSync(filePath)) {
        return res.sendFile(filePath);
    }

    try {
        const Ad = require('./models/Ad');
        const ad = await Ad.findByPk(adId);

        if (!ad) return res.sendFile(filePath);

        let content = fs.readFileSync(filePath, 'utf8');
        const images = ad.images || [];
        const ogImage = images[0] || '';
        const description = ad.description ? ad.description.substring(0, 160).replace(/"/g, '&quot;') : '';

        // Simple string replacement for meta tags
        content = content.replace(/<title>.*?<\/title>/, `<title>${ad.title} - Taggerly</title>`);
        content = content.replace(/property="og:title" content=".*?"/, `property="og:title" content="${ad.title}"`);
        content = content.replace(/name="description" content=".*?"/, `name="description" content="${description}"`);
        content = content.replace(/property="og:description" content=".*?"/, `property="og:description" content="${description}"`);
        content = content.replace(/property="og:image" content=".*?"/, `property="og:image" content="${ogImage}"`);

        res.send(content);
    } catch (err) {
        console.error('SSR Error:', err);
        res.sendFile(filePath);
    }
});

// Serve static files (After API routes and SSR)
app.use(express.static(path.join(__dirname)));
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

// No Socket.io or Cron Jobs on Vercel!
let io;
if (!process.env.VERCEL) {
    const http = require('http');
    const server = http.createServer(app);
    const { Server } = require('socket.io');
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    const initCronJobs = require('./utils/cronJobs');
    initCronJobs(io);

    io.on('connection', (socket) => {
        console.log('👤 User connected:', socket.id);
        // ... Socket logic (same as before)
        socket.on('join_user', async (userId) => {
            socket.userId = userId;
            socket.join(`user_${userId}`);
            try {
                const User = require('./models/User');
                await User.update({ isOnline: true }, { where: { id: userId } });
                io.emit('user_status_change', { userId, isOnline: true });
            } catch (err) {}
        });

        socket.on('join_conversation', (conversationId) => {
            socket.join(`convo_${conversationId}`);
        });

        socket.on('typing', (data) => {
            socket.to(`convo_${data.conversationId}`).emit('display_typing', data);
        });

        socket.on('disconnect', async () => {
            if (socket.userId) {
                try {
                    const User = require('./models/User');
                    await User.update({ isOnline: false, lastActive: new Date() }, { where: { id: socket.userId } });
                    io.emit('user_status_change', { userId: socket.userId, isOnline: false, lastActive: new Date() });
                } catch (err) {}
            }
        });
    });

    // Handle production port listening locally
    if (require.main === module) {
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server is listening locally on 0.0.0.0:${PORT}`);
        });
    }
}

// Start Server
if (require.main === module) {
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server is listening on 0.0.0.0:${PORT}`);
    });
}

// Export the app for Vercel (Required for Serverless Functions)
module.exports = app;



