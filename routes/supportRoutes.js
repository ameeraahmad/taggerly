const express = require('express');
const router = express.Router();
const SupportRequest = require('../models/SupportRequest');
const SupportMessage = require('../models/SupportMessage');
const User = require('../models/User');

const { protect } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/support
 * @desc    Submit a support or contact request
 * @access  Private
 */
router.post('/', async (req, res) => {
    try {
        const { name, email, subject, message, phone, country } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ success: false, message: 'Please fill all fields' });
        }

        const supportRequest = await SupportRequest.create({
            name,
            email,
            phone: phone || null,
            subject,
            message,
            country: country || null
        });

        // Also create the first message in the thread
        await SupportMessage.create({
            requestId: supportRequest.id,
            senderName: name,
            message: message,
            isAdmin: false
        });

        // Notify Admin via socket
        if (req.io) {
            req.io.emit('new_support_request', {
                id: supportRequest.id,
                name: supportRequest.name,
                subject: supportRequest.subject,
                createdAt: supportRequest.createdAt
            });
        }

        res.status(201).json({ 
            success: true, 
            id: supportRequest.id,
            message: 'Message sent successfully! Our team will get back to you soon.' 
        });
    } catch (err) {
        console.error('Support Request Error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

/**
 * @route   GET /api/support/my-chat
 * @desc    Get the most recent Live Chat Support request for the current user (by email)
 * @access  Private
 */
router.get('/my-chat', protect, async (req, res) => {
    try {
        const user = req.user;
        if (!user || !user.email) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const request = await SupportRequest.findOne({
            where: {
                email: user.email,
                subject: 'Live Chat Support'
            },
            order: [['createdAt', 'DESC']]
        });

        if (!request) {
            return res.json({ success: true, data: null });
        }

        res.json({ success: true, data: request });
    } catch (err) {
        console.error('[SUPPORT] my-chat error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

/**
 * @route   GET /api/support
 * @desc    Get all support requests (Admin only)
 * @access  Private/Admin
 */
router.get('/', async (req, res) => {
    try {
        const { country } = req.query;
        const where = {};
        if (country && country !== 'all') {
            where.country = country.toLowerCase();
        }

        const requests = await SupportRequest.findAll({
            where,
            order: [
                ['isImportant', 'DESC'],
                ['createdAt', 'DESC']
            ]
        });
        res.json({ success: true, data: requests });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

/**
 * @route   PUT /api/support/:id/important
 * @desc    Toggle support request important status
 * @access  Private/Admin
 */
router.put('/:id/important', async (req, res) => {
    try {
        const request = await SupportRequest.findByPk(req.params.id);
        if (!request) return res.status(404).json({ success: false, message: 'Not found' });

        request.isImportant = !request.isImportant;
        await request.save();
        res.json({ success: true, data: request });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

/**
 * @route   PATCH /api/support/:id
 * @desc    Update support request status
 * @access  Private/Admin
 */
router.patch('/:id', async (req, res) => {
    try {
        const { status, isRead, isReplied } = req.body;
        const request = await SupportRequest.findByPk(req.params.id);
        
        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        if (status) request.status = status;
        if (typeof isRead !== 'undefined') request.isRead = isRead;
        if (typeof isReplied !== 'undefined') request.isReplied = isReplied;

        await request.save();
        res.json({ success: true, data: request });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

const sendEmail = require('../utils/email');

/**
 * @route   POST /api/support/:id/reply
 * @desc    Reply to a support request via email
 * @access  Private/Admin
 */
router.post('/:id/reply', async (req, res) => {
    try {
        const { replyMessage } = req.body;
        const request = await SupportRequest.findByPk(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        if (!replyMessage || replyMessage.trim() === '') {
            return res.status(400).json({ success: false, message: 'Reply message cannot be empty' });
        }

        // Send Email
        console.log(`[SUPPORT] 📧 Sending email reply to: ${request.email}`);
        await sendEmail({
            email: request.email,
            subject: `Re: ${request.subject} - Support`,
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2>Hello ${request.name},</h2>
                    <p>Response from Taggerly Support:</p>
                    <div style="background: #f4f4f4; padding: 15px; border-left: 4px solid #FF6B00; margin: 20px 0;">
                        ${replyMessage.replace(/\n/g, '<br/>')}
                    </div>
                    <hr/>
                    <p style="font-size: 12px; color: #666;">Original Query: ${request.message}</p>
                </div>
            `
        });

        // Update database
        request.isReplied = true;
        request.status = 'replied';
        request.replyMessage = replyMessage;
        request.message = replyMessage; // Update preview with last message
        await request.save();

        // Also save as a SupportMessage for the history and emit socket
        const newMessage = await SupportMessage.create({
            requestId: request.id,
            senderName: 'Admin',
            message: replyMessage,
            isAdmin: true
        });

        // Notify via socket using unified event name
        if (req.io) {
            req.io.to(`support_${request.id}`).emit('new_support_message', newMessage.toJSON());
        }

        console.log(`[SUPPORT] ✅ Reply processed for ID ${request.id}`);
        res.json({ success: true, message: 'Reply sent successfully!' });
    } catch (err) {
        console.error('[SUPPORT] Reply Error:', err);
        res.status(500).json({ success: false, message: 'Failed to send reply' });
    }
});

/**
 * @route   GET /api/support/:id/messages
 * @desc    Get all messages for a support request
 * @access  Public (should verify email or session in production)
 */
router.get('/:id/messages', async (req, res) => {
    try {
        const messages = await SupportMessage.findAll({
            where: { requestId: req.params.id },
            order: [['createdAt', 'ASC']]
        });
        res.json({ success: true, data: messages });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

/**
 * @route   POST /api/support/:id/messages
 * @desc    Send a new message in a support thread
 * @access  Public/Admin
 */
router.post('/:id/messages', async (req, res) => {
    try {
        const { message, senderName, isAdmin } = req.body;
        const requestId = req.params.id;

        console.log(`[SUPPORT] Message incoming for ID ${requestId} from ${senderName}. isAdmin: ${isAdmin}`);

        if (!message) return res.status(400).json({ success: false, message: 'Message empty' });
        // ... (rest of the logic remains)


        const request = await SupportRequest.findByPk(requestId);
        if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

        const newMessage = await SupportMessage.create({
            requestId,
            senderName: senderName || 'User',
            message,
            isAdmin: !!isAdmin
        });

        // Update request status
        if (isAdmin) {
            request.isReplied = true;
            request.status = 'replied';
            request.message = message; // Update preview for admin reply
        } else {
            request.isRead = false;
            request.status = 'pending';
            request.message = message; // Update preview for user message
        }
        await request.save();

        // Notify via socket
        if (req.io) {
            console.log(`[SUPPORT] Emitting new_support_message to room: support_${requestId}`);
            // Join support room for real-time updates and use plain JSON
            req.io.to(`support_${requestId}`).emit('new_support_message', newMessage.toJSON());
            
            // If it's from user, notify admins
            if (!isAdmin) {
                console.log(`[SUPPORT] Notifying admins of new message from ${request.name}`);
                req.io.emit('admin_notification', {
                    type: 'support_message',
                    requestId: request.id,
                    message: `New message from ${request.name}`
                });
            }
        }

        res.json({ success: true, data: newMessage });
    } catch (err) {
        console.error('[SUPPORT] Error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

/**
 * @route   DELETE /api/support/:id
 * @desc    Delete a support thread (Admin only)
 */
router.delete('/:id', async (req, res) => {
    try {
        const support = await SupportRequest.findByPk(req.params.id);
        if (!support) return res.status(404).json({ success: false, message: 'Not found' });
        await support.destroy();
        res.json({ success: true, message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
