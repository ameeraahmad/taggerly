const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide ad title'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please provide description']
    },
    price: {
        type: Number,
        required: [true, 'Please provide price']
    },
    category: {
        type: String,
        required: [true, 'Please provide category'],
        enum: ['Motors', 'Property', 'Classifieds', 'Jobs', 'Services']
    },
    subCategory: {
        type: String
    },
    location: {
        city: { type: String, required: true },
        area: { type: String }
    },
    images: [{
        type: String, // URLs to images
        default: ['https://via.placeholder.com/600x400?text=No+Image']
    }],
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        // required: true
    },
    status: {
        type: String,
        enum: ['active', 'sold', 'deleted'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Ad = mongoose.model('Ad', adSchema);

module.exports = Ad;
