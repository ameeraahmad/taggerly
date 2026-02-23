const Notification = require('../models/Notification');

/**
 * Create a notification and emit it to the user if online
 * @param {Object} io - Socket.io instance
 * @param {Object} data - Notification data { userId, type, title, message, link, relatedId }
 */
const createNotification = async (io, data) => {
    try {
        const notification = await Notification.create(data);

        // Emit to user room via socket
        if (io) {
            io.to(`user_${data.userId}`).emit('new_notification', notification);
            console.log(`🔔 Notification emitted to user_${data.userId}`);
        }

        return notification;
    } catch (err) {
        console.error('❌ Error creating notification:', err);
    }
};

module.exports = { createNotification };
