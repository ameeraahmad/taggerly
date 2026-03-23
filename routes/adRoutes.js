const express = require('express');
const router = express.Router();
const {
    getAllAds,
    getAdById,
    createAd,
    updateAd,
    deleteAd,
    getUserAds,
    toggleFavorite,
    getFavorites,
    getDashboardStats
} = require('../controllers/adController');
const { protect } = require('../middleware/authMiddleware');
const { googleLogin } = require('../controllers/authController'); // Added for googleLogin

// Public routes
router.get('/', getAllAds);
router.get('/favorites', protect, getFavorites);
router.get('/my-ads', protect, getUserAds);
router.get('/stats/dashboard', protect, getDashboardStats);
router.get('/:id', getAdById);

const { upload, resizeImages } = require('../middleware/upload');

const { adValidation, validate } = require('../middleware/validator');
const verifyCaptcha = require('../middleware/captcha');

// Private routes
router.post('/', protect, verifyCaptcha, upload.array('images', 5), resizeImages, adValidation, validate, createAd);
router.post('/:id/favorite', protect, toggleFavorite);
router.put('/:id', protect, upload.array('images', 5), resizeImages, adValidation, validate, updateAd);
router.delete('/:id', protect, deleteAd);

module.exports = router;
