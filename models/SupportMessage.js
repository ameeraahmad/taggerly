const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SupportMessage = sequelize.define('SupportMessage', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    requestId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'support_requests', key: 'id' }
    },
    senderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' }
    },
    senderName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    isAdmin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    timestamps: true,
    tableName: 'support_messages'
});

module.exports = SupportMessage;
