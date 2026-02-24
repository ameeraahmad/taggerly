const express = require('express');
const router = express.Router();
const {
    getStats,
    getAllUsers,
    toggleBanUser,
    promoteUser,
    deleteUser,
    getAllAds,
    approveAd,
    rejectAd,
    getPendingAds,
    deleteAd,
    toggleFeatureAd,
    getAllReports,
    reviewReport,
    getRevenue
} = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes and restrict to admin
router.use(protect);
router.use(restrictTo('admin'));

// Dashboard
router.get('/stats', getStats);
router.get('/revenue', getRevenue);

// Users
router.get('/users', getAllUsers);
router.put('/users/:id/ban', toggleBanUser);
router.put('/users/:id/promote', promoteUser);
router.delete('/users/:id', deleteUser);

// Ads
router.get('/ads', getAllAds);
router.get('/ads/pending', getPendingAds); // Moderation Queue
router.put('/ads/:id/approve', approveAd);
router.put('/ads/:id/reject', rejectAd);
router.put('/ads/:id/feature', toggleFeatureAd);
router.delete('/ads/:id', deleteAd);

// Reports
router.get('/reports', getAllReports);
router.put('/reports/:id', reviewReport);

module.exports = router;
