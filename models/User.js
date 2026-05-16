const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
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
        unique: true,
        validate: { isEmail: true }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING
    },
    role: {
        type: DataTypes.ENUM('user', 'admin'),
        defaultValue: 'user'
    },
    avatar: {
        type: DataTypes.STRING,
        defaultValue: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
    },
    bio: {
        type: DataTypes.TEXT
    },
    location: {
        type: DataTypes.STRING
    },
    isOnline: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    lastActive: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    emailNotifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    chatNotifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    isEmailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    emailVerificationToken: {
        type: DataTypes.STRING
    },
    passwordResetToken: {
        type: DataTypes.STRING
    },
    passwordResetExpires: {
        type: DataTypes.DATE
    },
    passwordChangedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    resetOTP: {
        type: DataTypes.STRING,
        allowNull: true
    },
    resetOTPExpires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    loginAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    lockUntil: {
        type: DataTypes.DATE,
        allowNull: true
    },
    isBanned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    country: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: true,
    hooks: {
        beforeCreate: async (user) => {
            user.password = await bcrypt.hash(user.password, 12);
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                user.password = await bcrypt.hash(user.password, 12);
                // Track when password was changed to invalidate old tokens
                user.passwordChangedAt = new Date(Date.now() - 1000); // -1s to ensure token issued after
            }
        }
    }
});

User.prototype.createPasswordResetToken = function () {
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    return resetToken;
};

// Method to check if password was changed after a JWT was issued
User.prototype.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

// Check if account is currently locked
User.prototype.isLocked = function () {
    return this.lockUntil && this.lockUntil > Date.now();
};

// Method to check password
User.prototype.correctPassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;
