const User = require('../models/User');
const Ad = require('../models/Ad');
const Report = require('../models/Report');
const { Op } = require('sequelize');

// @desc    Get dashboard stats for admin
// @route   GET /api/admin/stats
exports.getStats = async (req, res) => {
    try {
        const totalUsers = await User.count();
        const totalAds = await Ad.count({ where: { status: { [Op.ne]: 'deleted' } } });
        const totalReports = await Report.count({ where: { status: 'pending' } });

        // Growth stats (mock or real logic based on createdAt)
        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalAds,
                totalReports,
                activeAds: await Ad.count({ where: { status: 'active' } })
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({ success: true, data: users });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get all ads for management
// @route   GET /api/admin/ads
exports.getAllAds = async (req, res) => {
    try {
        const ads = await Ad.findAll({
            include: [{ model: User, as: 'user', attributes: ['name', 'email'] }],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({ success: true, data: ads });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const { createNotification } = require('../utils/notifications');

// ... (stats, users, ads)

// @desc    Delete any ad
// @route   DELETE /api/admin/ads/:id
exports.deleteAd = async (req, res) => {
    try {
        const ad = await Ad.findByPk(req.params.id);
        if (!ad) return res.status(404).json({ success: false, message: 'Ad not found' });

        await ad.update({ status: 'deleted' });

        // Notify Owner
        await createNotification(req.io, {
            userId: ad.userId,
            type: 'ad_rejected',
            title: 'Your ad has been removed',
            message: `Your ad "${ad.title}" was removed by an administrator for violating platform policies.`,
            relatedId: ad.id
        });

        res.status(200).json({ success: true, message: 'Ad deleted by admin' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Review a report
// @route   PUT /api/admin/reports/:id
exports.reviewReport = async (req, res) => {
    try {
        const report = await Report.findByPk(req.params.id);
        if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

        const previousStatus = report.status;
        await report.update(req.body); // e.g., { status: 'resolved' }

        if (req.body.status === 'resolved' && previousStatus !== 'resolved') {
            // Notify Reporter
            await createNotification(req.io, {
                userId: report.reporterId,
                type: 'system',
                title: 'Report update',
                message: 'Your report has been reviewed and resolved by our team. Thank you for keeping the community safe.',
                relatedId: report.adId
            });
        }

        res.status(200).json({ success: true, data: report });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
