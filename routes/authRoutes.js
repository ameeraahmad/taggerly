const express = require('express');
const router = express.Router();
const {
    register, login, getMe, updateProfile, googleLogin, facebookLogin,
    forgotPassword, resetPassword, verifyEmail
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/facebook', facebookLogin);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.get('/me', protect, getMe);
router.put('/update', protect, updateProfile);

module.exports = router;
