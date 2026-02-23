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

        // Sorting
        let order = [['createdAt', 'DESC']]; // default newest
        if (req.query.sortBy) {
            switch (req.query.sortBy) {
                case 'price_asc':
                case 'lowHigh':
                    order = [['price', 'ASC']];
                    break;
                case 'price_desc':
                case 'highLow':
                    order = [['price', 'DESC']];
                    break;
                case 'oldest':
                    order = [['createdAt', 'ASC']];
                    break;
                case 'newest':
                    order = [['createdAt', 'DESC']];
                    break;
                default:
                    order = [['createdAt', 'DESC']];
            }
        }

        const { count, rows: ads } = await Ad.findAndCountAll({
            where,
            order,
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
        const User = require('../models/User');
        const ad = await Ad.findByPk(req.params.id, {
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'avatar', 'createdAt']
            }]
        });
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
        const {
            title, description, price, category, subCategory,
            city, area, year, kilometers, itemCondition, phone
        } = req.body;

        let images = [];
        if (req.files && req.files.length > 0) {
            images = req.files.map(file => {
                if (file.path && file.path.startsWith('http')) {
                    return file.path;
                }
                const protocol = req.protocol;
                const host = req.get('host');
                return `${protocol}://${host}/uploads/${file.filename}`;
            });
        } else if (req.body.images) {
            try {
                images = Array.isArray(req.body.images) ? req.body.images : JSON.parse(req.body.images);
            } catch (pErr) {
                console.error('Failed to parse images:', pErr);
                images = [];
            }
        }

        const ad = await Ad.create({
            title,
            description,
            price: Number(price),
            category,
            subCategory,
            city,
            area,
            year: year ? Number(year) : null,
            kilometers: kilometers ? Number(kilometers) : null,
            itemCondition,
            phone: phone || null,
            images: Array.isArray(images) ? images : [],
            userId: req.user ? req.user.id : null
        });
        res.status(201).json({ success: true, data: ad });
    } catch (err) {
        console.error('🔥 Create Ad Error:', err);
        res.status(500).json({ success: false, message: err.message || 'Error creating ad' });
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

        // Handle new images if uploaded
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => {
                const protocol = req.protocol;
                const host = req.get('host');
                return `${protocol}://${host}/uploads/${file.filename}`;
            });
            // If images already exist in body (passed as string/JSON), parse them
            let currentImages = ad.images || [];
            if (req.body.images) {
                try {
                    currentImages = Array.isArray(req.body.images) ? req.body.images : JSON.parse(req.body.images);
                } catch (e) { }
            }
            req.body.images = [...currentImages, ...newImages];
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
        const { Conversation } = require('../models/associations');
        const ads = await Ad.findAll({
            where: { userId: req.user.id },
            include: [{ model: Conversation, as: 'conversations', attributes: ['id'] }],
            order: [['createdAt', 'DESC']]
        });

        const enrichedAds = ads.map(ad => {
            const plainAd = ad.get({ plain: true });
            plainAd.inquiryCount = ad.conversations ? ad.conversations.length : 0;
            delete plainAd.conversations;
            return plainAd;
        });

        res.status(200).json({ success: true, count: enrichedAds.length, data: enrichedAds });
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
