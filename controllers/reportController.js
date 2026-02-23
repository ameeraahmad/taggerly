const Report = require('../models/Report');
const Ad = require('../models/Ad');

// @desc    Report an ad
// @route   POST /api/reports
exports.createReport = async (req, res) => {
    try {
        const { adId, reason, description } = req.body;

        // Check if ad exists
        const ad = await Ad.findByPk(adId);
        if (!ad) return res.status(404).json({ success: false, message: 'Ad not found' });

        const report = await Report.create({
            adId,
            reporterId: req.user.id,
            reason,
            description
        });

        res.status(201).json({ success: true, data: report });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get all reports (Admin)
// @route   GET /api/reports
exports.getAllReports = async (req, res) => {
    try {
        const User = require('../models/User');
        const reports = await Report.findAll({
            include: [
                { model: Ad, as: 'ad' },
                { model: User, as: 'reporter', attributes: ['name', 'email'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({ success: true, data: reports });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Update report status (Admin)
// @route   PUT /api/reports/:id
exports.updateReport = async (req, res) => {
    try {
        const report = await Report.findByPk(req.params.id);
        if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

        await report.update(req.body);
        res.status(200).json({ success: true, data: report });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
