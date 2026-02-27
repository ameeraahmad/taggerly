const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Ad = sequelize.define('Ad', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    category: {
        type: DataTypes.ENUM('Motors', 'Property', 'Classifieds', 'Jobs', 'Services', 'Furniture', 'Mobiles', 'Electronics'),
        allowNull: false
    },
    subCategory: {
        type: DataTypes.STRING
    },
    city: {
        type: DataTypes.STRING,
        allowNull: false
    },
    country: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'uae'
    },
    area: {
        type: DataTypes.STRING
    },
    year: {
        type: DataTypes.INTEGER
    },
    kilometers: {
        type: DataTypes.INTEGER
    },
    itemCondition: {
        type: DataTypes.STRING
    },
    images: {
        type: DataTypes.TEXT,
        defaultValue: JSON.stringify(['https://via.placeholder.com/600x400?text=No+Image']),
        get() {
            const val = this.getDataValue('images');
            return val ? JSON.parse(val) : [];
        },
        set(val) {
            this.setDataValue('images', JSON.stringify(val));
        }
    },
    status: {
        type: DataTypes.ENUM('pending', 'active', 'sold', 'deleted', 'expired', 'rejected'),
        defaultValue: 'pending'
    },
    userId: {
        type: DataTypes.INTEGER
    },
    views: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isFeatured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    featuredUntil: {
        type: DataTypes.DATE
    },
    rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: true
});

module.exports = Ad;
