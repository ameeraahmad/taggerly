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
        type: DataTypes.ENUM('Motors', 'Property', 'Classifieds', 'Jobs', 'Services'),
        allowNull: false
    },
    subCategory: {
        type: DataTypes.STRING
    },
    city: {
        type: DataTypes.STRING,
        allowNull: false
    },
    area: {
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
        type: DataTypes.ENUM('active', 'sold', 'deleted'),
        defaultValue: 'active'
    },
    userId: {
        type: DataTypes.INTEGER
    },
    views: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    timestamps: true
});

module.exports = Ad;
