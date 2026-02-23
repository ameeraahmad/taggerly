const { Review, User } = require('../models/associations');

// @desc    Create a review
// @route   POST /api/reviews
exports.createReview = async (req, res) => {
    try {
        const { sellerId, adId, rating, comment } = req.body;
        const reviewerId = req.user.id;

        if (reviewerId === parseInt(sellerId)) {
            return res.status(400).json({ success: false, message: 'You cannot rate yourself' });
        }

        const review = await Review.create({
            reviewerId,
            sellerId,
            adId,
            rating,
            comment
        });

        res.status(201).json({ success: true, data: review });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get reviews for a seller
// @route   GET /api/reviews/seller/:sellerId
exports.getSellerReviews = async (req, res) => {
    try {
        const reviews = await Review.findAll({
            where: { sellerId: req.params.sellerId },
            include: [
                { model: User, as: 'reviewer', attributes: ['id', 'name', 'avatar'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({ success: true, count: reviews.length, data: reviews });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
