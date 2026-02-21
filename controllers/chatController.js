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
                [Op.or]: [{ buyerId: userId }, { sellerId: userId }]
            },
            include: [
                { model: User, as: 'buyer', attributes: ['id', 'name', 'avatar'] },
                { model: User, as: 'seller', attributes: ['id', 'name', 'avatar'] },
                { model: Ad, as: 'ad', attributes: ['id', 'title', 'price', 'images'] }
            ],
            order: [['updatedAt', 'DESC']]
        });

        res.status(200).json({ success: true, count: conversations.length, data: conversations });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Send a message
// @route   POST /api/chat/message
exports.sendMessage = async (req, res) => {
    try {
        const { conversationId, message } = req.body;
        const senderId = req.user.id;

        const conversation = await Conversation.findByPk(conversationId);
        if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });

        // Security: Ensure user is part of conversation
        if (conversation.buyerId !== senderId && conversation.sellerId !== senderId) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const chatMessage = await ChatMessage.create({
            conversationId,
            senderId,
            message
        });

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

        res.status(200).json({ success: true, data: messages });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
