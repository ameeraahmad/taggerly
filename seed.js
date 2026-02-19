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

        // Sample Ads
        const ads = [
            {
                title: 'Toyota Camry 2024 - GCC',
                description: 'Pristine condition, low mileage, GCC specs.',
                price: 95000,
                category: 'Motors',
                city: 'Dubai',
                images: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80'],
                userId: user.id
            },
            {
                title: 'iPhone 15 Pro Max 256GB',
                description: 'Brand new, sealed box, Apple warranty.',
                price: 4500,
                category: 'Electronics',
                city: 'Abu Dhabi',
                images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80'],
                userId: user.id
            },
            {
                title: 'Luxury 2BR Apartment in Marina',
                description: 'High floor, marina view, fully furnished.',
                price: 150000,
                category: 'Property',
                city: 'Dubai',
                images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80'],
                userId: user.id
            },
            {
                title: 'Modern Leather Sofa - 3 Seater',
                description: 'Comfortable sofa, almost new.',
                price: 1200,
                category: 'Furniture',
                city: 'Sharjah',
                images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80'],
                userId: user.id
            }
        ];

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
