const Ad = require('./models/Ad');
const User = require('./models/User');
const { connectDB } = require('./config/db');

const seed = async () => {
    try {
        await connectDB();

        // Create a test user if not exists
        let user = await User.findOne({ where: { email: 'test@example.com' } });
        if (!user) {
            user = await User.create({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                phone: '0501234567'
            });
        }

        // Sample Ads (Empty for production)
        const ads = [];

        for (const adData of ads) {
            const existing = await Ad.findOne({ where: { title: adData.title } });
            if (!existing) {
                await Ad.create(adData);
            }
        }

        console.log('✅ Database seeded successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
        process.exit(1);
    }
};

seed();
