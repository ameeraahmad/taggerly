const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    try {
        if (!process.env.JWT_SECRET) {
            throw new Error('FATAL: JWT_SECRET is not defined');
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findByPk(decoded.id, {
            attributes: { exclude: ['password'] }
        });

        if (!req.user) {
            return res.status(401).json({ success: false, message: 'User no longer exists' });
        }

        if (req.user.isBanned) {
            return res.status(403).json({ success: false, message: 'Your account has been suspended. Please contact support.' });
        }

        // If password was changed after token was issued → force re-login on all devices
        if (req.user.changedPasswordAfter(decoded.iat)) {
            return res.status(401).json({
                success: false,
                code: 'PASSWORD_CHANGED',
                message: 'Your password was recently changed. Please log in again.'
            });
        }

        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
};

const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action'
            });
        }
        next();
    };
};

module.exports = { protect, restrictTo };
