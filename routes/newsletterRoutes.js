const express = require('express');
const router = express.Router();
const NewsletterSubscriber = require('../models/NewsletterSubscriber');
const sendEmail = require('../utils/email');
const { newsletterWelcomeEmail } = require('../utils/emailTemplates');
const { body, validationResult } = require('express-validator');
const { protect, restrictTo } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/newsletter/subscribe
 * @desc    Subscribe to newsletter
 * @access  Public
 */
router.post('/subscribe', [
    body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    try {
        const { email, country } = req.body;

        // Check if already subscribed
        let subscriber = await NewsletterSubscriber.findOne({ where: { email } });

        if (subscriber) {
            if (subscriber.isActive) {
                return res.status(400).json({ success: false, message: 'You are already subscribed to our newsletter.' });
            } else {
                // Reactivate
                subscriber.isActive = true;
                await subscriber.save();
            }
        } else {
            // Create new subscriber
            subscriber = await NewsletterSubscriber.create({ 
                email, 
                country: country || null 
            });
        }

        // Send welcome email
        const backendURL = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
        const unsubscribeURL = `${backendURL}/api/newsletter/unsubscribe?token=${subscriber.unsubscribeToken}&email=${subscriber.email}`;
        
        try {
            await sendEmail({
                email: subscriber.email,
                subject: 'Welcome to Taggerly Newsletter!',
                html: newsletterWelcomeEmail({ unsubscribeURL })
            });
        } catch (emailErr) {
            console.error('Newsletter Welcome Email failed to send:', emailErr);
            // We don't fail the whole request if email fails, but log it
        }

        res.status(200).json({ 
            success: true, 
            message: 'Thank you for subscribing! Check your inbox for a welcome message.' 
        });

    } catch (err) {
        console.error('Newsletter Subscription Error:', err);
        res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
});

/**
 * @route   GET /api/newsletter/unsubscribe
 * @desc    Unsubscribe from newsletter
 * @access  Public
 */
router.get('/unsubscribe', async (req, res) => {
    try {
        const { email, token } = req.query;

        if (!email || !token) {
            return res.status(400).send('Invalid unsubscribe link.');
        }

        const subscriber = await NewsletterSubscriber.findOne({ where: { email, unsubscribeToken: token } });

        if (!subscriber) {
            return res.status(404).send('Subscriber not found or invalid token.');
        }

        subscriber.isActive = false;
        await subscriber.save();

        res.redirect('/unsubscribe.html');

    } catch (err) {
        console.error('Newsletter Unsubscribe Error:', err);
        res.status(500).send('Server error. Please try again later.');
    }
});

/**
 * @route   GET /api/newsletter/subscribers
 * @desc    Get all newsletter subscribers (Admin only)
 * @access  Private/Admin
 */
router.get('/subscribers', protect, restrictTo('admin'), async (req, res) => {
    try {
        const { country } = req.query;
        const where = {};
        if (country && country !== 'all') {
            where.country = country.toLowerCase();
        }

        const subscribers = await NewsletterSubscriber.findAll({
            where,
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({ success: true, data: subscribers });
    } catch (err) {
        console.error('Newsletter Fetch Error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch subscribers' });
    }
});

/**
 * @route   DELETE /api/newsletter/subscribers/:id
 * @desc    Delete a newsletter subscriber (Admin only)
 * @access  Private/Admin
 */
router.delete('/subscribers/:id', protect, restrictTo('admin'), async (req, res) => {
    try {
        const subscriber = await NewsletterSubscriber.findByPk(req.params.id);
        if (!subscriber) {
            return res.status(404).json({ success: false, message: 'Subscriber not found' });
        }
        await subscriber.destroy();
        res.status(200).json({ success: true, message: 'Subscriber deleted successfully' });
    } catch (err) {
        console.error('Newsletter Delete Error:', err);
        res.status(500).json({ success: false, message: 'Failed to delete subscriber' });
    }
});

module.exports = router;
