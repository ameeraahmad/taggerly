const express = require('express');
const router = express.Router();
const Ad = require('../models/Ad');

// @route   GET /api/ads
// @desc    Get all ads
router.get('/', async (req, res) => {
    try {
        const ads = await Ad.find().sort({ createdAt: -1 });
        res.json(ads);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   POST /api/ads
// @desc    Create an ad
router.post('/', async (req, res) => {
    const ad = new Ad({
        title: req.body.title,
        description: req.body.description,
        price: req.body.price,
        category: req.body.category,
        location: req.body.location
    });

    try {
        const newAd = await ad.save();
        res.status(201).json(newAd);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
