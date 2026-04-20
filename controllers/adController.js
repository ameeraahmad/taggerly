const Ad = require('../models/Ad');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');

// @desc    Get all ads
// @route   GET /api/ads
exports.getAllAds = async (req, res) => {
    try {
        const {
            category, subCategory, city, country, minPrice, maxPrice, search,
            condition, minYear, maxYear, minKm, maxKm,
            isFeatured, userId,
            bedrooms, bathrooms, propertyType, minArea, maxArea,
            lat, lng, radius
        } = req.query;
        let where = { status: 'active' };

        if (category) where.category = category;
        if (subCategory) where.subCategory = subCategory;
        
        // City filtering - make it more robust and handle "all_" prefix
        if (city && city !== 'all' && !city.startsWith('all_')) {
            // Use case-insensitive match for city to handle 'dubai' vs 'Dubai'
            where.city = { [Op.like]: `%${city}%` };
        }
        
        if (country) where.country = country;
        if (condition) where.itemCondition = condition;
        if (isFeatured) where.isFeatured = isFeatured === 'true';
        if (userId) where.userId = userId;
        if (bedrooms) where.bedrooms = Number(bedrooms);
        if (bathrooms) where.bathrooms = Number(bathrooms);
        if (propertyType) where.propertyType = propertyType;

        if (minArea || maxArea) {
            where.area = {};
            if (minArea) where.area[Op.gte] = Number(minArea);
            if (maxArea) where.area[Op.lte] = Number(maxArea);
        }

        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price[Op.gte] = Number(minPrice);
            if (maxPrice) where.price[Op.lte] = Number(maxPrice);
        }

        if (minYear || maxYear) {
            where.year = {};
            if (minYear) where.year[Op.gte] = Number(minYear);
            if (maxYear) where.year[Op.lte] = Number(maxYear);
        }

        if (minKm || maxKm) {
            where.kilometers = {};
            if (minKm) where.kilometers[Op.gte] = Number(minKm);
            if (maxKm) where.kilometers[Op.lte] = Number(maxKm);
        }
        
        // Exact location radius filtering (Box Search Approximation) with City Fallback
        if (lat && lng) {
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lng);
            const r = parseFloat(radius) || 50; // Default 50km
            
            const degLat = r / 111.32;
            const degLng = r / (111.32 * Math.cos(latitude * Math.PI / 180));
            
            const gpsCondition = {
                [Op.and]: [
                    { latitude: { [Op.between]: [latitude - degLat, latitude + degLat] } },
                    { longitude: { [Op.between]: [longitude - degLng, longitude + degLng] } }
                ]
            };

            const cityFallback = req.query.city || req.query.loc;
            
            if (cityFallback && cityFallback !== 'all' && !cityFallback.startsWith('all_')) {
                // If we are doing a GPS search, we want EITHER a GPS match OR a city match (for ads without GPS).
                // We remove the top-level city filter if it exists to allow the OR condition to handle it.
                delete where.city;
                
                where[Op.or] = [
                    gpsCondition,
                    {
                        [Op.and]: [
                            { city: { [Op.like]: `%${cityFallback}%` } },
                            { latitude: null }
                        ]
                    }
                ];
            } else {
                where.latitude = gpsCondition[Op.and][0].latitude;
                where.longitude = gpsCondition[Op.and][1].longitude;
            }
        }


        if (search) {
            const words = search.split(' ').filter(word => word.length > 0);
            const searchConditions = words.map(word => ({
                [Op.or]: [
                    { title: { [Op.like]: `%${word}%` } },
                    { description: { [Op.like]: `%${word}%` } }
                ]
            }));

            // If we have other conditions, we combine them with search using Op.and
            if (Object.keys(where).length > 0 || where[Op.or]) {
                const otherConditions = { ...where };
                // If we had an Op.or (from GPS), we must move it into the AND array
                const baseConditions = [];
                
                // Extract Op.or if it exists
                if (otherConditions[Op.or]) {
                    baseConditions.push({ [Op.or]: otherConditions[Op.or] });
                    delete otherConditions[Op.or];
                }
                
                // Add remaining simple where conditions
                if (Object.keys(otherConditions).length > 0) {
                    baseConditions.push(otherConditions);
                }

                where = {
                    [Op.and]: [
                        ...baseConditions,
                        ...searchConditions
                    ]
                };
            } else {
                where[Op.and] = searchConditions;
            }
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

        const User = require('../models/User');
        const { count, rows: ads } = await Ad.findAndCountAll({
            where,
            order,
            limit,
            offset,
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'isEmailVerified']
            }]
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
                attributes: ['id', 'name', 'avatar', 'createdAt', 'isEmailVerified']
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
            city, country, area, year, kilometers, itemCondition, phone,
            bedrooms, bathrooms, propertyType, latitude, longitude
        } = req.body;

        let images = [];

        // 1) Handle Cloudinary files
        if (req.files && req.files.length > 0 && process.env.CLOUDINARY_CLOUD_NAME) {
            images = req.files.map(file => file.path);
        }
        // 2) Handle Sharp-processed local files (set in req.body.images by middleware)
        else if (req.body.images && Array.isArray(req.body.images)) {
            const protocol = req.protocol;
            const host = req.get('host');
            images = req.body.images.map(filename => `${protocol}://${host}/uploads/${filename}`);
        }
        // 3) Handle existing images or fallback
        else if (req.body.images) {
            try {
                images = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
            } catch (pErr) {
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
            country: country || 'uae',
            area,
            year: year ? Number(year) : null,
            kilometers: kilometers ? Number(kilometers) : null,
            bedrooms: bedrooms ? Number(bedrooms) : null,
            bathrooms: bathrooms ? Number(bathrooms) : null,
            propertyType,
            itemCondition,
            phone: phone || null,
            latitude: req.body.latitude ? Number(req.body.latitude) : null,
            longitude: req.body.longitude ? Number(req.body.longitude) : null,
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

        // Security: Only admins can directly set an ad to 'active'. 
        // If a user tries to set it to 'active' from any other state, it must go to 'pending'.
        if (req.user.role !== 'admin') {
            if (req.body.status === 'active' && ad.status !== 'active') {
                req.body.status = 'pending';
            }
        }

        // Apply restrictions for non-admin users ONLY if they are changing CONTENT and the ad is NOT rejected
        if (req.user.role !== 'admin') {
            const isChangingContent = req.body.title && req.body.title !== ad.title ||
                                      req.body.description && req.body.description !== ad.description ||
                                      req.body.price && Number(req.body.price) !== Number(ad.price);

            // If the ad is REJECTED, we allow editing without cooldown to let them fix it immediately
            const isRejected = ad.status === 'rejected';

            if (isChangingContent && !isRejected) {
                // 1. Check max edits (3 times) - only for non-rejected ads
                if (ad.editCount >= 3) {
                    return res.status(400).json({ 
                        success: false, 
                        message: req.headers['accept-language']?.includes('ar') ? 'لقد تجاوزت الحد الأقصى للتعديلات (3 مرات).' : 'You have reached the maximum number of edits (3).'
                    });
                }

                // 2. Check cooldown (3 hours) - only for non-rejected ads
                if (ad.lastEditedAt) {
                    const threeHoursInMs = 3 * 60 * 60 * 1000;
                    const timeDiff = new Date() - new Date(ad.lastEditedAt);
                    if (timeDiff < threeHoursInMs) {
                        const remainingMinutes = Math.ceil((threeHoursInMs - timeDiff) / (60 * 1000));
                        return res.status(400).json({ 
                            success: false, 
                            message: req.headers['accept-language']?.includes('ar') 
                                ? `يجب الانتظار لمدة 3 ساعات بين كل تعديل والآخر. المتبقي: ${remainingMinutes} دقيقة.` 
                                : `You must wait 3 hours between edits. Remaining: ${remainingMinutes} minutes.`
                        });
                    }
                }

                // Update statistics for normal edits
                req.body.editCount = ad.editCount + 1;
                req.body.lastEditedAt = new Date();
            }

            // Always mark for re-approval if content or status is being updated by user
            if (isChangingContent || req.body.status === 'active' || isRejected) {
                req.body.status = 'pending';
                req.body.rejectionReason = null; // Clear old rejection reason so admin sees it as new
            }
        }

        // Handle new images if uploaded
        let newImages = [];
        if (req.files && req.files.length > 0 && process.env.CLOUDINARY_CLOUD_NAME) {
            newImages = req.files.map(file => file.path);
        } else if (req.body.images && Array.isArray(req.body.images)) {
            const protocol = req.protocol;
            const host = req.get('host');
            newImages = req.body.images.map(filename => `${protocol}://${host}/uploads/${filename}`);
        }

        if (newImages.length > 0 || req.body.existingImages) {
            let imagesToKeep = [];
            if (req.body.existingImages) {
                try {
                    imagesToKeep = JSON.parse(req.body.existingImages);
                } catch (e) {
                    imagesToKeep = ad.images || [];
                }
            } else {
                imagesToKeep = ad.images || [];
            }
            req.body.images = [...imagesToKeep, ...newImages];
        }

        // Sanitize numeric fields to avoid "empty string" validation errors in SQLite/Sequelize
        ['price', 'year', 'kilometers', 'bedrooms', 'bathrooms', 'latitude', 'longitude'].forEach(field => {
            if (req.body[field] === '') {
                req.body[field] = null;
            } else if (req.body[field] !== undefined) {
                req.body[field] = Number(req.body[field]);
            }
        });

        await ad.update(req.body);
        res.status(200).json({ success: true, data: ad });
    } catch (err) {
        console.error('🔥 Update Ad Error:', err);
        // If it's a Sequelize Validation Error, try to get more specific
        let message = err.message || 'Validation failed';
        if (err.errors && err.errors.length > 0) {
            message = err.errors.map(e => e.message).join(', ');
        }
        res.status(400).json({ success: false, message });
    }
};

// @desc    Permanently delete ad
// @route   DELETE /api/ads/:id/permanent
exports.permanentlyDeleteAd = async (req, res) => {
    const { Conversation, ChatMessage, Favorite, Review, Report, Payment } = require('../models/associations');
    const t = await sequelize.transaction();
    
    try {
        const ad = await Ad.findByPk(req.params.id);
        if (!ad) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Ad not found' });
        }

        // Ensure user owns the ad or is admin
        if (ad.userId !== req.user.id && req.user.role !== 'admin') {
            await t.rollback();
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const adId = ad.id;

        // 1. Delete Favorites
        await Favorite.destroy({ where: { adId }, transaction: t });

        // 2. Clear Ad references in Reviews
        await Review.update({ adId: null }, { where: { adId }, transaction: t });

        // 3. Delete Reports (Report requires adId)
        await Report.destroy({ where: { adId }, transaction: t });

        // 4. Update Payments (set adId to null)
        await Payment.update({ adId: null }, { where: { adId }, transaction: t });

        // 5. Handle Conversations and Messages
        const conversations = await Conversation.findAll({ where: { adId }, transaction: t });
        for (const convo of conversations) {
            await ChatMessage.destroy({ where: { conversationId: convo.id }, transaction: t });
            await convo.destroy({ transaction: t });
        }

        // 6. Finally delete the Ad
        await ad.destroy({ transaction: t });

        await t.commit();
        res.status(200).json({ success: true, message: 'Ad permanently deleted' });
    } catch (err) {
        if (t) await t.rollback();
        console.error('Permanent delete error:', err);
        res.status(500).json({ success: false, message: err.message });
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
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { count, rows: ads } = await Ad.findAndCountAll({
            where: { userId: req.user.id },
            include: [{ model: Conversation, as: 'conversations', attributes: ['id'] }],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        const enrichedAds = ads.map(ad => {
            const plainAd = ad.get({ plain: true });
            plainAd.inquiryCount = ad.conversations ? ad.conversations.length : 0;
            delete plainAd.conversations;
            return plainAd;
        });

        res.status(200).json({
            success: true,
            count,
            page,
            totalPages: Math.ceil(count / limit),
            data: enrichedAds
        });
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
        const adId = parseInt(req.params.id);
        const userId = parseInt(req.user.id);

        if (isNaN(adId)) {
            return res.status(400).json({ success: false, message: 'Invalid Ad ID' });
        }

        const existing = await Favorite.findOne({ where: { userId, adId } });
        if (existing) {
            await existing.destroy();
            return res.status(200).json({ success: true, message: 'Removed from favorites', isFavorite: false });
        } else {
            await Favorite.create({ userId, adId });
            return res.status(200).json({ success: true, message: 'Added to favorites', isFavorite: true });
        }
    } catch (err) {
        console.error('Favorite toggle error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get Favorites list
// @route   GET /api/ads/favorites
exports.getFavorites = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 12;
        const offset = (page - 1) * limit;

        const { count, rows: favorites } = await Favorite.findAndCountAll({
            where: { userId: req.user.id },
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        const adIds = favorites.map(f => f.adId);
        if (adIds.length === 0) {
            return res.status(200).json({
                success: true,
                count: 0,
                page,
                totalPages: 0,
                data: []
            });
        }

        // Fetch ads and maintain favorite order by mapping back
        const ads = await Ad.findAll({ where: { id: adIds, status: 'active' } });
        
        // Sort ads based on the order in favorites array (newest first)
        const sortedAds = adIds
            .map(id => ads.find(ad => ad.id === id))
            .filter(ad => ad !== undefined);

        res.status(200).json({
            success: true,
            count,
            page,
            totalPages: Math.ceil(count / limit),
            data: sortedAds
        });
    } catch (err) {
        console.error('Get favorites error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};
