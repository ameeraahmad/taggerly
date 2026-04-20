const User = require('../models/User');

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
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
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, bio, location, emailNotifications, chatNotifications } = req.body;
        const user = await User.findByPk(req.user.id);

        if (req.file) {
            user.avatar = req.file.path || req.file.secure_url || user.avatar;
        }

        user.name = name !== undefined ? name : user.name;
        user.phone = phone !== undefined ? phone : user.phone;
        user.bio = bio !== undefined ? bio : user.bio;
        user.location = location !== undefined ? location : user.location;
        user.emailNotifications = emailNotifications !== undefined ? emailNotifications === 'true' || emailNotifications === true : user.emailNotifications;
        user.chatNotifications = chatNotifications !== undefined ? chatNotifications === 'true' || chatNotifications === true : user.chatNotifications;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                avatar: user.avatar,
                bio: user.bio,
                location: user.location,
                emailNotifications: user.emailNotifications,
                chatNotifications: user.chatNotifications
            }
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update password
// @route   PUT /api/users/update-password
// @access  Private
exports.updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findByPk(req.user.id);

        // Check current password
        if (!(await user.correctPassword(currentPassword))) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
// @desc    Get public profile
// @route   GET /api/users/public/:id
// @access  Public
exports.getPublicProfile = async (req, res) => {
    try {
        const { Ad, Review } = require('../models/associations');
        const userId = req.params.id;

        const user = await User.findByPk(userId, {
            attributes: ['id', 'name', 'avatar', 'bio', 'location', 'createdAt', 'isEmailVerified']
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Calculate sold items
        const soldItemsCount = await Ad.count({ where: { userId, status: 'sold' } });

        // Calculate active ads
        const activeAdsCount = await Ad.count({ where: { userId, status: 'active' } });

        // Calculate success rate based on reviews
        const reviews = await Review.findAll({ where: { sellerId: userId } });
        let successRate = 100; // Default if no reviews
        if (reviews.length > 0) {
            const avgRating = reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length;
            // Success rate is (avgRating / 5) * 100, capped at 100
            successRate = Math.min(100, Math.round((avgRating / 5) * 100));
        } else {
            // If no reviews but has sold items, give a default high score
            if (soldItemsCount > 0) successRate = 95;
        }

        res.status(200).json({ 
            success: true, 
            data: {
                ...user.toJSON(),
                soldItemsCount,
                activeAdsCount,
                successRate
            } 
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
