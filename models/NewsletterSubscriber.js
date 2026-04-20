const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const crypto = require('crypto');

const NewsletterSubscriber = sequelize.define('NewsletterSubscriber', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    unsubscribeToken: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: () => crypto.randomBytes(32).toString('hex')
    },
    subscribedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'newsletter_subscribers',
    timestamps: true
});

module.exports = NewsletterSubscriber;
