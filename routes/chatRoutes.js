const express = require('express');
const router = express.Router();
const {
    startConversation,
    getConversations,
    sendMessage,
    getMessages,
    getUnreadCount
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.post('/conversation', protect, startConversation);
router.get('/conversations', protect, getConversations);
router.get('/unread-count', protect, getUnreadCount);
router.post('/message', protect, sendMessage);
router.get('/messages/:conversationId', protect, getMessages);

module.exports = router;
