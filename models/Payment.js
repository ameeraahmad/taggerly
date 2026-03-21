const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Payment = sequelize.define('Payment', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    adId: {
        type: DataTypes.INTEGER,
        allowNull: true // null if buying a subscription plan, not a specific ad
    },
    stripeSessionId: {
        type: DataTypes.STRING,
        unique: true
    },
    stripePaymentIntentId: {
        type: DataTypes.STRING
    },
    amount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    currency: {
        type: DataTypes.STRING,
        defaultValue: 'aed'
    },
    plan: {
        type: DataTypes.ENUM('basic', 'standard', 'premium', 'featured_ad'),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
        defaultValue: 'pending'
    },
    durationDays: {
        type: DataTypes.INTEGER,
        defaultValue: 30
    },
    metadata: {
        type: DataTypes.TEXT,
        defaultValue: '{}',
        get() {
            const val = this.getDataValue('metadata');
            return val ? JSON.parse(val) : {};
        },
        set(val) {
            this.setDataValue('metadata', JSON.stringify(val));
        }
    }
}, {
    timestamps: true
});

module.exports = Payment;
