const Message = require('../models/Message');

exports.sendMessage = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        const newMessage = await Message.create({ name, email, subject, message });
        res.status(201).json({ success: true, message: 'Message sent successfully' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.getMessages = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        const messages = await Message.findAll({ order: [['createdAt', 'DESC']] });
        res.status(200).json({ success: true, count: messages.length, data: messages });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
