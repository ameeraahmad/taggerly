const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'dubizzle_secret_key', {
        expiresIn: '30d'
    });
};

// @desc    Register
// @route   POST /api/auth/register
exports.register = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
        }

        const existing = await User.findOne({ where: { email } });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const user = await User.create({ name, email, password, phone });
        const token = generateToken(user.id);

        res.status(201).json({
            success: true, token,
            data: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Login
// @route   POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await user.correctPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = generateToken(user.id);
        res.status(200).json({
            success: true, token,
            data: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });
        res.status(200).json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/update
exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, avatar } = req.body;
        const user = await User.findByPk(req.user.id);

        if (user) {
            user.name = name || user.name;
            user.phone = phone || user.phone;
            user.avatar = avatar || user.avatar;

            const updatedUser = await user.save();
            res.status(200).json({
                success: true,
                data: {
                    id: updatedUser.id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    phone: updatedUser.phone,
                    avatar: updatedUser.avatar
                }
            });
        }
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
