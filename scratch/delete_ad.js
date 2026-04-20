const Ad = require('../models/Ad');
const User = require('../models/User');
const { connectDB } = require('../config/db');

const clearAllDummyAds = async () => {
    try {
        await connectDB();
        
        const dummyUser = await User.findOne({ where: { email: 'test@example.com' } });
        if (dummyUser) {
            const deletedCount = await Ad.destroy({ where: { userId: dummyUser.id } });
            console.log(`✅ Deleted ${deletedCount} experimental ad(s) belonging to test user.`);
        } else {
            console.log('ℹ️ No test user found, no experimental ads to delete.');
        }
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed to clear dummy ads:', err.message);
        process.exit(1);
    }
};

clearAllDummyAds();
