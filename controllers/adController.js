const Ad = require('../models/Ad');
const { Op } = require('sequelize');

// @desc    Get all ads
// @route   GET /api/ads
exports.getAllAds = async (req, res) => {
    try {
        const { category, city, minPrice, maxPrice, search } = req.query;
        let where = { status: 'active' };

        if (category) where.category = category;
        if (city) where.city = city;
        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price[Op.gte] = Number(minPrice);
            if (maxPrice) where.price[Op.lte] = Number(maxPrice);
        }
        if (search) {
            where[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 12;
        const offset = (page - 1) * limit;

        const { count, rows: ads } = await Ad.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        res.status(200).json({
            success: true,
            count,
            page,
            totalPages: Math.ceil(count / limit),
            data: ads
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get single ad
// @route   GET /api/ads/:id
exports.getAdById = async (req, res) => {
    try {
        const ad = await Ad.findByPk(req.params.id);
        if (!ad) return res.status(404).json({ success: false, message: 'Ad not found' });

        // Increment views
        await ad.increment('views');

        res.status(200).json({ success: true, data: ad });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Create new ad
// @route   POST /api/ads
exports.createAd = async (req, res) => {
    try {
        const { title, description, price, category, subCategory, city, area, images } = req.body;
        const ad = await Ad.create({
            title, description, price, category, subCategory,
            city, area, images,
            userId: req.user ? req.user.id : null
        });
        res.status(201).json({ success: true, data: ad });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update ad
// @route   PUT /api/ads/:id
exports.updateAd = async (req, res) => {
    try {
        const ad = await Ad.findByPk(req.params.id);
        if (!ad) return res.status(404).json({ success: false, message: 'Ad not found' });

        // Ensure user owns the ad
        if (ad.userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await ad.update(req.body);
        res.status(200).json({ success: true, data: ad });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Delete ad (soft delete)
// @route   DELETE /api/ads/:id
exports.deleteAd = async (req, res) => {
    try {
        const ad = await Ad.findByPk(req.params.id);
        if (!ad) return res.status(404).json({ success: false, message: 'Ad not found' });

        // Ensure user owns the ad
        if (ad.userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await ad.update({ status: 'deleted' });
        res.status(200).json({ success: true, message: 'Ad deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get user ads (for Dashboard)
// @route   GET /api/ads/my-ads
exports.getUserAds = async (req, res) => {
    try {
        const ads = await Ad.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({ success: true, count: ads.length, data: ads });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get dashboard stats
// @route   GET /api/ads/stats/dashboard
exports.getDashboardStats = async (req, res) => {
    try {
        const ads = await Ad.findAll({ where: { userId: req.user.id } });

        const stats = {
            totalAds: ads.length,
            activeAds: ads.filter(a => a.status === 'active').length,
            soldAds: ads.filter(a => a.status === 'sold').length,
            totalViews: ads.reduce((sum, ad) => sum + (ad.views || 0), 0)
        };

        res.status(200).json({ success: true, data: stats });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Toggle Favorite
// @route   POST /api/ads/:id/favorite
const Favorite = require('../models/Favorite');
exports.toggleFavorite = async (req, res) => {
    try {
        const adId = req.params.id;
        const userId = req.user.id;

        const existing = await Favorite.findOne({ where: { userId, adId } });
        if (existing) {
            await existing.destroy();
            return res.status(200).json({ success: true, message: 'Removed from favorites', isFavorite: false });
        } else {
            await Favorite.create({ userId, adId });
            return res.status(200).json({ success: true, message: 'Added to favorites', isFavorite: true });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get Favorites list
// @route   GET /api/ads/favorites
exports.getFavorites = async (req, res) => {
    try {
        const favorites = await Favorite.findAll({ where: { userId: req.user.id } });
        const adIds = favorites.map(f => f.adId);
        const ads = await Ad.findAll({ where: { id: adIds, status: 'active' } });
        res.status(200).json({ success: true, count: ads.length, data: ads });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
