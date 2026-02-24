const express = require('express');
const router = express.Router();
const { createReview, getSellerReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

const { reviewValidation, validate } = require('../middleware/validator');

router.post('/', protect, reviewValidation, validate, createReview);
router.get('/seller/:sellerId', getSellerReviews);

module.exports = router;
