const { connectDB } = require('../config/db');
const Ad = require('../models/Ad');
const { Op } = require('sequelize');

async function checkAds() {
    try {
        console.log('🔌 Connecting to DB and running migrations...');
        await connectDB();
        
        console.log('✅ Connected. Querying ads...');
        const ads = await Ad.findAll();
        console.log(`Total ads in DB: ${ads.length}`);
        
        const activeAds = await Ad.findAll({ where: { status: 'active' } });
        console.log(`Active ads: ${activeAds.length}`);

        if (activeAds.length > 0) {
            console.log('Sample Active Ad:', JSON.stringify(activeAds[0], null, 2));
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        process.exit();
    }
}

checkAds();
