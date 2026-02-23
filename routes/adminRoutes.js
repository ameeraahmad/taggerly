const express = require('express');
const router = express.Router();
const {
    getStats,
    getAllUsers,
    getAllAds,
    deleteAd,
    reviewReport
} = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes and restrict to admin
router.use(protect);
router.use(restrictTo('admin'));

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.get('/ads', getAllAds);
router.delete('/ads/:id', deleteAd);
router.put('/reports/:id', reviewReport);

module.exports = router;
