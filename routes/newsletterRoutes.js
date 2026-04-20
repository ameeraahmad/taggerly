const express = require('express');
const router = express.Router();
const NewsletterSubscriber = require('../models/NewsletterSubscriber');
const sendEmail = require('../utils/email');
const { newsletterWelcomeEmail } = require('../utils/emailTemplates');
const { body, validationResult } = require('express-validator');

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
        const { email } = req.body;

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
            subscriber = await NewsletterSubscriber.create({ email });
        }

        // Send welcome email
        const unsubscribeURL = `${req.protocol}://${req.get('host')}/api/newsletter/unsubscribe?token=${subscriber.unsubscribeToken}&email=${subscriber.email}`;
        
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

        res.send('<h1>Unsubscribed Successfully</h1><p>You have been removed from our mailing list. We are sorry to see you go!</p><a href="/">Go back to Taggerly</a>');

    } catch (err) {
        console.error('Newsletter Unsubscribe Error:', err);
        res.status(500).send('Server error. Please try again later.');
    }
});

module.exports = router;
