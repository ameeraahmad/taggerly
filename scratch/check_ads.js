const { connectDB } = require('../config/db');
const Ad = require('../models/Ad');

(async () => {
    await connectDB();
    const ads = await Ad.findAll({ limit: 5 });
    console.log('Sample Ads:');
    ads.forEach(ad => {
        console.log(`ID: ${ad.id}, Title: ${ad.title}, Category: ${ad.category}, City: ${ad.city}, Country: ${ad.country}, Status: ${ad.status}`);
    });
    process.exit(0);
})();
