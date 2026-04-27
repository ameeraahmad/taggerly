const User = require('../models/User');
const Ad = require('../models/Ad');
const Report = require('../models/Report');
const Payment = require('../models/Payment');
const { Op } = require('sequelize');
const { createNotification } = require('../utils/notifications');
const sendEmail = require('../utils/email');
const { adApprovedEmail, adRejectedEmail } = require('../utils/emailTemplates');

// @desc    Get dashboard stats for admin
// @route   GET /api/admin/stats
exports.getStats = async (req, res) => {
    try {
        const { currency, country } = req.query;
        const userWhere = {};
        const adWhereAll = { status: { [Op.ne]: 'deleted' } };
        const adWhereActive = { status: 'active' };
        
        if (country && country !== 'all') {
            adWhereAll.country = country.toLowerCase();
            adWhereActive.country = country.toLowerCase();
        }

        const totalUsers = await User.count({ where: userWhere });
        const totalAds = await Ad.count({ where: adWhereAll });
        
        // For reports, we want reports where the associated Ad is in this country.
        // But for simplicity, we'll just join with Ad if country is specified.
        let totalReports = 0;
        if (country && country !== 'all') {
            totalReports = await Report.count({
                where: { status: 'pending' },
                include: [{ model: Ad, as: 'ad', where: { country: country.toLowerCase() }, required: true }]
            });
        } else {
            totalReports = await Report.count({ where: { status: 'pending' } });
        }

        const activeAds = await Ad.count({ where: adWhereActive });
        const totalViews = await Ad.sum('views', { where: country && country !== 'all' ? { country: country.toLowerCase() } : {} }) || 0;

        // Revenue stats - already filtered by currency which is passed from frontend
        const paymentWhere = { status: 'completed' };
        if (currency) paymentWhere.currency = currency.toLowerCase();

        const paymentInclude = [{ model: User, as: 'user', attributes: ['country'], required: true }];
        if (country && country !== 'all') {
            paymentInclude[0].where = { country: country.toLowerCase() };
        }

        const completedPayments = await Payment.findAll({ 
            where: paymentWhere,
            include: paymentInclude
        });

        const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);
        const monthlyRevenue = completedPayments
            .filter(p => {
                const paymentDate = new Date(p.createdAt);
                const now = new Date();
                return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
            })
            .reduce((sum, p) => sum + p.amount, 0);

        // New users this month
        const thisMonth = new Date();
        thisMonth.setDate(1);
        const userMonthWhere = { createdAt: { [Op.gte]: thisMonth } };
        if (country && country !== 'all') userMonthWhere.country = country.toLowerCase();
        
        const newUsersThisMonth = await User.count({ where: userMonthWhere });

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalAds,
                activeAds,
                totalReports,
                totalViews,
                totalRevenue: totalRevenue.toFixed(2),
                monthlyRevenue: monthlyRevenue.toFixed(2),
                newUsersThisMonth,
                totalTransactions: completedPayments.length
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get analytics for charts
// @route   GET /api/admin/analytics
exports.getAnalytics = async (req, res) => {
    try {
        const { currency, country } = req.query;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Daily Users
        const userChartsWhere = { createdAt: { [Op.gte]: thirtyDaysAgo } };
        if (country && country !== 'all') userChartsWhere.country = country.toLowerCase();
        
        const usersData = await User.findAll({
            where: userChartsWhere,
            attributes: [
                [require('sequelize').fn('date', require('sequelize').col('createdAt')), 'day'],
                [require('sequelize').fn('count', require('sequelize').col('id')), 'count']
            ],
            group: ['day'],
            order: [['day', 'ASC']]
        });

        const adWhere = { createdAt: { [Op.gte]: thirtyDaysAgo } };
        if (country && country !== 'all') adWhere.country = country.toLowerCase();

        // Daily Ad Views
        const adsData = await Ad.findAll({
            where: adWhere,
            attributes: [
                [require('sequelize').fn('date', require('sequelize').col('createdAt')), 'day'],
                [require('sequelize').fn('sum', require('sequelize').col('views')), 'views']
            ],
            group: ['day'],
            order: [['day', 'ASC']]
        });

        // Daily Revenue - filter by currency and country
        const revWhere = {
            status: 'completed',
            createdAt: { [Op.gte]: thirtyDaysAgo }
        };
        if (currency) revWhere.currency = currency.toLowerCase();

        const revInclude = [{ model: User, as: 'user', attributes: [], required: true }];
        if (country && country !== 'all') {
            revInclude[0].where = { country: country.toLowerCase() };
        }

        const revenueData = await Payment.findAll({
            where: revWhere,
            include: revInclude,
            attributes: [
                [require('sequelize').fn('date', require('sequelize').col('Payment.createdAt')), 'day'],
                [require('sequelize').fn('sum', require('sequelize').col('amount')), 'total']
            ],
            group: ['day'],
            order: [['day', 'ASC']]
        });

        res.status(200).json({
            success: true,
            data: {
                users: usersData,
                ads: adsData,
                revenue: revenueData
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get all users with search & pagination
// @route   GET /api/admin/users
exports.getAllUsers = async (req, res) => {
    try {
        const { q, page = 1, limit = 20, role, country } = req.query;
        const where = {};
        if (q) where[Op.or] = [
            { name: { [Op.like]: `%${q}%` } },
            { email: { [Op.like]: `%${q}%` } }
        ];
        if (role) where.role = role;
        if (country && country !== 'all') where.country = country.toLowerCase();

        const users = await User.findAndCountAll({
            where,
            attributes: { exclude: ['password', 'emailVerificationToken', 'passwordResetToken'] },
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        });

        res.status(200).json({
            success: true,
            data: users.rows,
            total: users.count,
            page: parseInt(page),
            pages: Math.ceil(users.count / parseInt(limit))
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Ban or unban a user
// @route   PUT /api/admin/users/:id/ban
exports.toggleBanUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot ban an admin' });

        const newStatus = !user.isBanned;
        await user.update({ isBanned: newStatus });

        res.status(200).json({
            success: true,
            message: newStatus ? 'User banned successfully' : 'User unbanned successfully',
            data: { isBanned: newStatus }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Promote user to admin
// @route   PUT /api/admin/users/:id/promote
exports.promoteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        await user.update({ role: 'admin' });
        res.status(200).json({ success: true, message: 'User promoted to admin', data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Delete a user and all their ads
// @route   DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot delete admin' });

        // Soft-delete all their ads
        await Ad.update({ status: 'deleted' }, { where: { userId: user.id } });
        await user.destroy();

        res.status(200).json({ success: true, message: 'User and all their ads deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get all ads for management with search & filter
// @route   GET /api/admin/ads
exports.getAllAds = async (req, res) => {
    try {
        const { q, status, page = 1, limit = 20, featured, country } = req.query;
        const where = {};
        if (q) where.title = { [Op.like]: `%${q}%` };
        if (status) where.status = status;
        if (featured !== undefined) where.isFeatured = featured === 'true';
        if (country && country !== 'all') where.country = country.toLowerCase();

        const ads = await Ad.findAndCountAll({
            where,
            include: [{ model: User, as: 'user', attributes: ['name', 'email'] }],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        });

        res.status(200).json({
            success: true,
            data: ads.rows,
            total: ads.count,
            page: parseInt(page),
            pages: Math.ceil(ads.count / parseInt(limit))
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Approve an ad
// @route   PUT /api/admin/ads/:id/approve
exports.approveAd = async (req, res) => {
    try {
        const ad = await Ad.findByPk(req.params.id, {
            include: [{ model: User, as: 'user', attributes: ['name', 'email'] }]
        });
        if (!ad) return res.status(404).json({ success: false, message: 'Ad not found' });

        await ad.update({ status: 'active', rejectionReason: null });

        await createNotification(req.io, {
            userId: ad.userId,
            type: 'system',
            title: '✅ تم الموافقة على إعلانك!',
            message: `إعلانك "${ad.title}" أصبح الآن نشطاً ويمكن للجميع رؤيته.`,
            link: `ad-details.html?id=${ad.id}`,
            relatedId: ad.id
        });

        // Send HTML email notification
        if (ad.user && ad.user.email) {
            const frontendURL = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
            const adURL = `${frontendURL}/ad-details.html?id=${ad.id}`;
            sendEmail({
                email: ad.user.email,
                subject: '✅ تم تفعيل إعلانك على Taggerly!',
                message: `تمت الموافقة على إعلانك "${ad.title}" وهو الآن متاح للمشترين.`,
                html: adApprovedEmail({ userName: ad.user.name, adTitle: ad.title, adURL })
            }).catch(err => console.error('Ad approval email failed:', err));
        }

        res.status(200).json({ success: true, message: 'Ad approved', data: ad });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Reject an ad (with reason)
// @route   PUT /api/admin/ads/:id/reject
exports.rejectAd = async (req, res) => {
    try {
        const ad = await Ad.findByPk(req.params.id, {
            include: [{ model: User, as: 'user', attributes: ['name', 'email'] }]
        });
        if (!ad) return res.status(404).json({ success: false, message: 'Ad not found' });

        const reason = req.body.reason || 'إعلانك لا يتوافق مع سياسات المنصة حالياً، يرجى مراجعته وتعديله.';
        await ad.update({ status: 'rejected', rejectionReason: reason });

        await createNotification(req.io, {
            userId: ad.userId,
            type: 'ad_rejected',
            title: '❌ لم يتم قبول إعلانك',
            message: `تم رفض إعلانك "${ad.title}". السبب: ${reason}`,
            link: 'dashboard.html?section=rejected',
            relatedId: ad.id
        });

        // Send HTML email notification
        if (ad.user && ad.user.email) {
            sendEmail({
                email: ad.user.email,
                subject: '❌ تحديث بخصوص إعلانك على Taggerly',
                message: `تم رفض إعلانك "${ad.title}". السبب: ${reason}`,
                html: adRejectedEmail({ userName: ad.user.name, adTitle: ad.title, reason })
            }).catch(err => console.error('Ad rejection email failed:', err));
        }

        res.status(200).json({ success: true, message: 'Ad rejected', data: ad });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get pending ads for moderation
// @route   GET /api/admin/ads/pending
exports.getPendingAds = async (req, res) => {
    try {
        const { page = 1, limit = 20, country } = req.query;
        const where = { status: 'pending' };
        if (country && country !== 'all') where.country = country.toLowerCase();

        const ads = await Ad.findAndCountAll({
            where,
            include: [{ model: User, as: 'user', attributes: ['name', 'email', 'avatar'] }],
            order: [['createdAt', 'ASC']], // oldest first - review FIFO
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        });

        res.status(200).json({
            success: true,
            data: ads.rows,
            total: ads.count,
            page: parseInt(page),
            pages: Math.ceil(ads.count / parseInt(limit))
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Delete any ad
// @route   DELETE /api/admin/ads/:id
exports.deleteAd = async (req, res) => {
    try {
        const ad = await Ad.findByPk(req.params.id);
        if (!ad) return res.status(404).json({ success: false, message: 'Ad not found' });

        await ad.update({ status: 'deleted' });

        await createNotification(req.io, {
            userId: ad.userId,
            type: 'ad_rejected',
            title: 'Your ad has been removed',
            message: `Your ad "${ad.title}" was removed by an administrator for violating platform policies.`,
            link: `ad-details.html?id=${ad.id}`,
            relatedId: ad.id
        });

        res.status(200).json({ success: true, message: 'Ad deleted by admin' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Toggle ad featured status
// @route   PUT /api/admin/ads/:id/feature
exports.toggleFeatureAd = async (req, res) => {
    try {
        const ad = await Ad.findByPk(req.params.id);
        if (!ad) return res.status(404).json({ success: false, message: 'Ad not found' });

        const newFeatured = !ad.isFeatured;
        const featuredUntil = newFeatured ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;

        await ad.update({ isFeatured: newFeatured, featuredUntil });

        if (newFeatured) {
            await createNotification(req.io, {
                userId: ad.userId,
                type: 'payment',
                title: '🌟 Your Ad is now Featured!',
                message: `Your ad "${ad.title}" has been featured by the admin for 30 days!`,
                link: `ad-details.html?id=${ad.id}`,
                relatedId: ad.id
            });
        }

        res.status(200).json({ success: true, message: `Ad ${newFeatured ? 'featured' : 'unfeatured'}`, data: { isFeatured: newFeatured } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get all reports with filter
// @route   GET /api/admin/reports
exports.getAllReports = async (req, res) => {
    try {
        const { status, page = 1, limit = 20, country } = req.query;
        const where = {};
        if (status) where.status = status;

        const include = [
            { model: User, as: 'reporter', attributes: ['name', 'email'] }
        ];

        if (country && country !== 'all') {
            include.push({ model: Ad, as: 'ad', attributes: ['title', 'status', 'country', 'images', 'description'], where: { country: country.toLowerCase() }, required: true });
        } else {
            include.push({ model: Ad, as: 'ad', attributes: ['title', 'status', 'country', 'images', 'description'] });
        }

        const reports = await Report.findAndCountAll({
            where,
            include,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        });

        res.status(200).json({
            success: true,
            data: reports.rows,
            total: reports.count,
            page: parseInt(page),
            pages: Math.ceil(reports.count / parseInt(limit))
        });
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
        await report.update(req.body);

        if (req.body.status === 'resolved' && previousStatus !== 'resolved') {
            await createNotification(req.io, {
                userId: report.reporterId,
                type: 'system',
                title: '✅ Report resolved',
                message: 'Your report has been reviewed and resolved by our team. Thank you for keeping the community safe.',
                link: `ad-details.html?id=${report.adId}`,
                relatedId: report.adId
            });
        }

        res.status(200).json({ success: true, data: report });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
// @desc    Get revenue and payment stats (admin)
// @route   GET /api/admin/revenue
exports.getRevenue = async (req, res) => {
    try {
        const { period = '30', currency, country } = req.query;
        const since = new Date();
        since.setDate(since.getDate() - parseInt(period));

        const where = {
            status: 'completed',
            createdAt: { [Op.gte]: since }
        };
        if (currency) where.currency = currency.toLowerCase();

        const include = [{ 
            model: User, 
            as: 'user', 
            attributes: ['name', 'email', 'country'],
            required: true
        }];

        if (country && country !== 'all') {
            include[0].where = { country: country.toLowerCase() };
        }

        const payments = await Payment.findAll({
            where,
            include,
            order: [['createdAt', 'DESC']]
        });

        const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

        // Group by plan
        const byPlan = payments.reduce((acc, p) => {
            acc[p.plan] = (acc[p.plan] || 0) + p.amount;
            return acc;
        }, {});

        // Group by day (last 30 days)
        const byDay = {};
        payments.forEach(p => {
            const day = new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            byDay[day] = (byDay[day] || 0) + p.amount;
        });

        res.status(200).json({
            success: true,
            data: {
                totalRevenue: totalRevenue.toFixed(2),
                totalTransactions: payments.length,
                recentPayments: payments.slice(0, 10),
                byPlan,
                byDay
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
