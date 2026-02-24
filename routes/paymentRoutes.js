const express = require('express');
const router = express.Router();
const {
    createCheckoutSession,
    handleWebhook,
    getMyPayments,
    getAllPayments,
    getPlans,
    verifySession
} = require('../controllers/paymentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Public - Stripe webhook (must be raw body, handled in server.js)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Public - get plan info
router.get('/plans', getPlans);

// Protected routes
router.use(protect);
router.post('/create-checkout-session', createCheckoutSession);
router.get('/my-payments', getMyPayments);
router.get('/verify-session/:sessionId', verifySession);

// Admin only
router.get('/all', restrictTo('admin'), getAllPayments);

module.exports = router;
