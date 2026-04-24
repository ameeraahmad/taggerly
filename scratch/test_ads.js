require('../models/associations');
const { connectDB } = require('../config/db');
const Ad = require('../models/Ad');
const User = require('../models/User');

async function testAds() {
    await connectDB();
    try {
        const ads = await Ad.findAndCountAll({
            where: {},
            include: [{ model: User, as: 'user', attributes: ['name', 'email'] }],
            order: [['createdAt', 'DESC']],
            limit: 5
        });
        console.log('Total Ads:', ads.count);
        console.log('Sample Ads:');
        ads.rows.forEach(ad => {
            console.log(`  - ID: ${ad.id}, Title: ${ad.title}, Status: ${ad.status}, Country: ${ad.country}`);
        });
    } catch (err) {
        console.error('Error:', err.message);
    }
    process.exit();
}

testAds();
