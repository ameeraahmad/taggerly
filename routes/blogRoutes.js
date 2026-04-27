const express = require('express');
const router = express.Router();
const BlogPost = require('../models/BlogPost');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const { upload, resizePostImage } = require('../middleware/upload');
const NewsletterSubscriber = require('../models/NewsletterSubscriber');
const sendEmail = require('../utils/email');
const { newBlogPostEmail } = require('../utils/emailTemplates');

// Middleware to check if user is admin (simple version)
const isAdmin = async (req, res, next) => {
    try {
        // Simple placeholder for admin check
        next(); 
    } catch (err) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
    }
};

/**
 * @route   POST /api/blog/upload
 * @desc    Upload blog featured image
 * @access  Admin
 */
router.post('/upload', upload.single('image'), resizePostImage, (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    res.json({ success: true, url: req.file.path });
});

const { Op } = require('sequelize');

/**
 * @route   GET /api/blog
 * @desc    Get all published blog posts
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const { category, search, country } = req.query;
        let where = { status: 'published' };

        if (country && country !== 'all') {
            where.country = country.toLowerCase();
        }

        if (category && category !== 'all') {
            where.category = category;
        }

        if (search && search.trim() !== '') {
            const q = `%${search.trim().toLowerCase()}%`;
            where[Op.or] = [
                { title_en: { [Op.like]: q } },
                { title_ar: { [Op.like]: q } },
                { excerpt_en: { [Op.like]: q } },
                { excerpt_ar: { [Op.like]: q } }
            ];
        }

        const posts = await BlogPost.findAll({
            where,
            attributes: { exclude: ['content_en', 'content_ar'] },
            order: [
                ['isImportant', 'DESC'],
                ['createdAt', 'DESC']
            ],
            include: [{ model: User, as: 'author', attributes: ['name', 'avatar'] }]
        });

        res.json({ success: true, data: posts });
    } catch (err) {
        console.error('Fetch Blog Posts Error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

/**
 * @route   GET /api/blog/admin
 * @desc    Get all posts (for admin management)
 * @access  Admin
 */
router.get('/admin', async (req, res) => {
    try {
        const { country } = req.query;
        const where = {};
        if (country && country !== 'all') {
            where.country = country.toLowerCase();
        }

        const posts = await BlogPost.findAll({
            where,
            attributes: { exclude: ['content_en', 'content_ar', 'excerpt_en', 'excerpt_ar'] }, // Exclude all large text for admin table
            order: [
                ['isImportant', 'DESC'],
                ['createdAt', 'DESC']
            ],
            include: [{ model: User, as: 'author', attributes: ['name'] }]
        });
        res.json({ success: true, data: posts });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

/**
 * @route   POST /api/blog
 * @desc    Create a new blog post
 * @access  Admin
 */
router.post('/', [
    body('title_en').notEmpty(),
    body('title_ar').notEmpty(),
    body('content_en').notEmpty(),
    body('content_ar').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
        const post = await BlogPost.create(req.body);
        
        // Notify all active newsletter subscribers asynchronously
        const subscribers = await NewsletterSubscriber.findAll({ where: { isActive: true } });
        
        if (subscribers.length > 0) {
            const frontendURL = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
            const backendURL = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
            const postURL = `${frontendURL}/blog-details.html?slug=${post.slug}`;
            
            // We use a separate loop to not block the response
            subscribers.forEach(sub => {
                const unsubscribeURL = `${backendURL}/api/newsletter/unsubscribe?token=${sub.unsubscribeToken}&email=${sub.email}`;
                
                sendEmail({
                    email: sub.email,
                    subject: `📰 New Article: ${post.title_en} / مقال جديد: ${post.title_ar}`,
                    html: newBlogPostEmail({
                        title: post.title_en, // You can choose to send based on user preference or both
                        excerpt: post.excerpt_en,
                        image: post.featuredImage,
                        postURL,
                        unsubscribeURL
                    })
                }).catch(err => console.error(`Newsletter send failed for ${sub.email}:`, err));
            });
        }

        res.status(201).json({ success: true, data: post });
    } catch (err) {
        console.error('Create Blog Post Error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

/**
 * @route   GET /api/blog/:id
 * @desc    Get a single blog post by ID (for admin editing)
 * @access  Admin
 */
router.get('/:id', async (req, res) => {
    try {
        const post = await BlogPost.findByPk(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
        res.json({ success: true, data: post });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

/**
 * @route   PUT /api/blog/:id
 * @desc    Update a blog post
 * @access  Admin
 */
router.put('/:id', async (req, res) => {
    try {
        const post = await BlogPost.findByPk(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

        await post.update(req.body);
        res.json({ success: true, data: post });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

/**
 * @route   DELETE /api/blog/:id
 * @desc    Delete a blog post
 * @access  Admin
 */
/**
 * @route   GET /api/blog/post/:slug
 * @desc    Get a single blog post by slug
 * @access  Public
 */
router.get('/post/:slug', async (req, res) => {
    try {
        const post = await BlogPost.findOne({
            where: { slug: req.params.slug, status: 'published' },
            include: [{ model: User, as: 'author', attributes: ['name', 'avatar'] }]
        });

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        res.json({ success: true, data: post });
    } catch (err) {
        console.error('Fetch Single Post Error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

/**
 * @route   PUT /api/blog/:id/important
 * @desc    Toggle blog post important status
 * @access  Admin
 */
router.put('/:id/important', isAdmin, async (req, res) => {
    try {
        const post = await BlogPost.findByPk(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

        await post.update({ isImportant: !post.isImportant });
        res.json({ success: true, data: post });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});


router.delete('/:id', async (req, res) => {
    try {
        const post = await BlogPost.findByPk(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

        await post.destroy();
        res.json({ success: true, message: 'Post deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
