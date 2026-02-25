const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, updatePassword, getPublicProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { upload, resizeAvatar } = require('../middleware/upload');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, upload.single('avatar'), resizeAvatar, updateProfile);
router.put('/update-password', protect, updatePassword);
router.get('/public/:id', getPublicProfile);

module.exports = router;
