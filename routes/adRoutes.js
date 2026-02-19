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

// Public routes
router.get('/', getAllAds);
router.get('/favorites', protect, getFavorites);
router.get('/my-ads', protect, getUserAds);
router.get('/stats/dashboard', protect, getDashboardStats);
router.get('/:id', getAdById);

// Private routes
router.post('/', protect, createAd);
router.post('/:id/favorite', protect, toggleFavorite);
router.put('/:id', protect, updateAd);
router.delete('/:id', protect, deleteAd);

module.exports = router;
