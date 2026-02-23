const express = require('express');
const router = express.Router();
const { createReport, getAllReports, updateReport } = require('../controllers/reportController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.post('/', protect, createReport);
router.get('/', protect, restrictTo('admin'), getAllReports);
router.put('/:id', protect, restrictTo('admin'), updateReport);

module.exports = router;
