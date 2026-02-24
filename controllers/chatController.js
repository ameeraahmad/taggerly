const { Conversation, ChatMessage, User, Ad } = require('../models/associations');
const { Op } = require('sequelize');

// @desc    Start/Get a conversation for an ad
// @route   POST /api/chat/conversation
exports.startConversation = async (req, res) => {
    try {
        const { adId } = req.body;
        const buyerId = req.user.id;

        const ad = await Ad.findByPk(adId);
        if (!ad) return res.status(404).json({ success: false, message: 'Ad not found' });

        const sellerId = ad.userId;
        if (buyerId === sellerId) {
            return res.status(400).json({ success: false, message: 'You cannot chat with yourself' });
        }

        // Check if conversation already exists
        let conversation = await Conversation.findOne({
            where: {
                adId,
                [Op.or]: [
                    { buyerId, sellerId },
                    { buyerId: sellerId, sellerId: buyerId } // Should normally be fixed roles but just in case
                ]
            }
        });

        if (!conversation) {
            conversation = await Conversation.create({
                adId,
                buyerId,
                sellerId
            });
        } else {
            // If it exists but was deleted by someone, reset the flag
            if (conversation.buyerId === buyerId) conversation.deletedByBuyer = false;
            if (conversation.sellerId === buyerId) conversation.deletedBySeller = false;
            await conversation.save();
        }

        res.status(200).json({ success: true, data: conversation });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get user's conversations
// @route   GET /api/chat/conversations
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        const conversations = await Conversation.findAll({
            where: {
                [Op.or]: [
                    { buyerId: userId, deletedByBuyer: false },
                    { sellerId: userId, deletedBySeller: false }
                ]
            },
            include: [
                { model: User, as: 'buyer', attributes: ['id', 'name', 'avatar', 'isOnline', 'lastActive'] },
                { model: User, as: 'seller', attributes: ['id', 'name', 'avatar', 'isOnline', 'lastActive'] },
                { model: Ad, as: 'ad', attributes: ['id', 'title', 'price', 'images'] }
            ],
            order: [['updatedAt', 'DESC']]
        });

        // Add unread count for each conversation
        const enrichedConversations = await Promise.all(conversations.map(async (convo) => {
            const unreadCount = await ChatMessage.count({
                where: {
                    conversationId: convo.id,
                    senderId: { [Op.ne]: userId },
                    isRead: false
                }
            });

            const plainConvo = convo.get({ plain: true });
            return {
                ...plainConvo,
                unreadCount
            };
        }));

        res.status(200).json({ success: true, count: enrichedConversations.length, data: enrichedConversations });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get total unread messages count for user
// @route   GET /api/chat/unread-count
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find all conversations user is part of
        const conversations = await Conversation.findAll({
            where: {
                [Op.or]: [{ buyerId: userId }, { sellerId: userId }]
            },
            attributes: ['id']
        });

        const conversationIds = conversations.map(c => c.id);

        if (conversationIds.length === 0) {
            return res.status(200).json({ success: true, count: 0 });
        }

        const unreadCount = await ChatMessage.count({
            where: {
                conversationId: { [Op.in]: conversationIds },
                senderId: { [Op.ne]: userId },
                isRead: false
            }
        });

        res.status(200).json({ success: true, count: unreadCount });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const { createNotification } = require('../utils/notifications');

// @desc    Send a message
// @route   POST /api/chat/message
exports.sendMessage = async (req, res) => {
    try {
        const { conversationId, message } = req.body;
        const senderId = req.user.id;

        const conversation = await Conversation.findByPk(conversationId, {
            include: [
                { model: Ad, as: 'ad', attributes: ['title'] },
                { model: User, as: 'buyer', attributes: ['id', 'name', 'email', 'isOnline', 'chatNotifications'] },
                { model: User, as: 'seller', attributes: ['id', 'name', 'email', 'isOnline', 'chatNotifications'] }
            ]
        });
        if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });

        const recipient = conversation.buyerId === senderId ? conversation.sellerId : conversation.buyerId;
        const recipientUser = conversation.buyerId === senderId ? conversation.seller : conversation.buyer;
        const senderUser = conversation.buyerId === senderId ? conversation.buyer : conversation.seller;

        // ... (image processing logic remains same)
        let imageUrl = null;
        if (req.file) {
            const protocol = req.protocol;
            const host = req.get('host');
            imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
        }

        const chatMessage = await ChatMessage.create({
            conversationId,
            senderId,
            message: message || '',
            image: imageUrl
        });

        const sendEmail = require('../utils/email');
        const { newMessageEmail } = require('../utils/emailTemplates');

        // 1) Persistent Notification
        await createNotification(req.io, {
            userId: recipientUser.id,
            type: 'message',
            title: 'New Message',
            message: `You have a new message regarding "${conversation.ad.title}"`,
            link: `messages.html?convoId=${conversationId}`,
            relatedId: conversationId
        });

        // 2) Email Notification (if offline and enabled)
        if (!recipientUser.isOnline && recipientUser.chatNotifications) {
            const protocol = req.protocol;
            const host = req.get('host');
            const chatUrl = `${protocol}://${host}/messages.html?conversationId=${conversationId}`;

            sendEmail({
                email: recipientUser.email,
                subject: `💬 New message from ${senderUser.name} on Dubizzle Clone`,
                message: `${senderUser.name} sent you a message: ${message || '(Image)'}`,
                html: newMessageEmail({
                    userName: recipientUser.name,
                    senderName: senderUser.name,
                    messageText: message || '(Sent an image)',
                    chatUrl
                })
            }).catch(err => console.error('Chat email notification failed:', err));
        }

        // 3) Real-time Socket Emits
        if (req.io) {
            req.io.to(`convo_${conversationId}`).emit('receive_message', chatMessage);
            req.io.to(`user_${recipientUser.id}`).emit('new_message_notification', {
                ...chatMessage.get({ plain: true }),
                recipientId: recipientUser.id
            });
        }

        // Update conversation's updatedAt timestamp
        await conversation.changed('updatedAt', true);
        await conversation.save();

        res.status(201).json({ success: true, data: chatMessage });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get messages in a conversation
// @route   GET /api/chat/messages/:conversationId
exports.getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        const conversation = await Conversation.findByPk(conversationId);
        if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });

        if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const messages = await ChatMessage.findAll({
            where: { conversationId },
            include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'avatar'] }],
            order: [['createdAt', 'ASC']]
        });

        // Mark as read
        await ChatMessage.update({ isRead: true }, {
            where: {
                conversationId,
                senderId: { [Op.ne]: userId }
            }
        });

        // Notify sender via socket that messages were read
        if (req.io) {
            req.io.to(`convo_${conversationId}`).emit('messages_read', {
                conversationId,
                readBy: userId
            });
        }

        res.status(200).json({ success: true, data: messages });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Delete/Archive a conversation
// @route   DELETE /api/chat/conversation/:conversationId
exports.deleteConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        const conversation = await Conversation.findByPk(conversationId);
        if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });

        if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (conversation.buyerId === userId) {
            conversation.deletedByBuyer = true;
        } else {
            conversation.deletedBySeller = true;
        }

        await conversation.save();

        res.status(200).json({ success: true, message: 'Conversation deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
