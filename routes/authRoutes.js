const express = require('express');
const router = express.Router();
const {
    register, login, getMe, updateProfile, googleLogin, facebookLogin,
    forgotPassword, resetPassword, verifyEmail, resendVerification
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const { registerValidation, loginValidation, validate } = require('../middleware/validator');
const verifyCaptcha = require('../middleware/captcha');

router.post('/register', verifyCaptcha, registerValidation, validate, register);
router.post('/login', verifyCaptcha, loginValidation, validate, login);
router.post('/resend-verification', protect, resendVerification);
router.post('/google', googleLogin);
router.post('/facebook', facebookLogin);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.get('/me', protect, getMe);
router.put('/update', protect, updateProfile);

module.exports = router;
