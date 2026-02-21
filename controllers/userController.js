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
        const { name, phone, bio, location } = req.body;
        const user = await User.findByPk(req.user.id);

        if (req.file) {
            // If Cloudinary is used, req.file.path contains the URL
            user.avatar = req.file.path || req.file.secure_url || user.avatar;
        }

        user.name = name || user.name;
        user.phone = phone || user.phone;
        user.bio = bio || user.bio;
        user.location = location || user.location;

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
                location: user.location
            }
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
