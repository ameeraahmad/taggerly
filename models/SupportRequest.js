const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SupportRequest = sequelize.define('SupportRequest', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    subject: {
        type: DataTypes.STRING,
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'read', 'replied', 'resolved'),
        defaultValue: 'pending'
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isReplied: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    replyMessage: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    isImportant: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    country: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'support_requests',
    timestamps: true
});

module.exports = SupportRequest;
