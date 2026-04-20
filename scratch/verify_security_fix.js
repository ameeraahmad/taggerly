const { sequelize, connectDB } = require('../config/db');
const Ad = require('../models/Ad');
const User = require('../models/User');
const { updateAd } = require('../controllers/adController');

async function verifyFix() {
    console.log('🚀 Starting Security Fix Verification...');
    
    try {
        await connectDB();
        
        // 1. Create a test user
        const [user] = await User.findOrCreate({
            where: { email: 'security-test@taggerly.com' },
            defaults: {
                name: 'Security Tester',
                password: 'password123',
                role: 'user'
            }
        });
        console.log('✅ Test User ready.');

        // 2. Scenario 1: Pending Ad -> Attempt status: active
        console.log('\n--- Scenario 1: Pending Ad -> Attempt to Activate ---');
        const ad1 = await Ad.create({
            title: 'Test Ad 1',
            description: 'Testing security fix',
            price: 100,
            category: 'Classifieds',
            city: 'Dubai',
            status: 'pending',
            userId: user.id
        });
        
        const req1 = {
            params: { id: ad1.id },
            user: { id: user.id, role: 'user' },
            body: { status: 'active' },
            headers: {}
        };
        const res1 = {
            status: function(s) { this.statusCode = s; return this; },
            json: function(j) { this.body = j; return this; }
        };

        await updateAd(req1, res1);
        
        const updatedAd1 = await Ad.findByPk(ad1.id);
        console.log('Result Status:', updatedAd1.status);
        if (updatedAd1.status === 'pending') {
            console.log('PASSED: Status remained pending.');
        } else {
            console.error('FAILED: Status was changed to active!');
        }

        // 3. Scenario 2: Sold Ad -> Attempt status: active (The User's specific issue)
        console.log('\n--- Scenario 2: Sold Ad -> Attempt to Activate (Undo) ---');
        const ad2 = await Ad.create({
            title: 'Test Ad 2',
            description: 'Testing sold to active bypass',
            price: 200,
            category: 'Electronics',
            city: 'Cairo',
            status: 'sold',
            userId: user.id
        });

        const req2 = {
            params: { id: ad2.id },
            user: { id: user.id, role: 'user' },
            body: { status: 'active' },
            headers: {}
        };
        
        await updateAd(req2, res1);
        
        const updatedAd2 = await Ad.findByPk(ad2.id);
        console.log('Result Status:', updatedAd2.status);
        if (updatedAd2.status === 'pending') {
            console.log('PASSED: Sold ad reverted to pending when trying to activate.');
        } else {
            console.error('FAILED: Sold ad became active!');
        }

        // 4. Scenario 3: Admin setting status: active
        console.log('\n--- Scenario 3: Admin Action ---');
        const req3 = {
            params: { id: ad1.id },
            user: { id: 999, role: 'admin' }, // Simulated admin
            body: { status: 'active' },
            headers: {}
        };
        
        await updateAd(req3, res1);
        const updatedAd3 = await Ad.findByPk(ad1.id);
        console.log('Result Status:', updatedAd3.status);
        if (updatedAd3.status === 'active') {
            console.log('PASSED: Admin successfully activated the ad.');
        } else {
            console.error('FAILED: Admin could not activate the ad.');
        }

        // Cleanup
        await ad1.destroy();
        await ad2.destroy();
        console.log('\n✨ Verification Complete.');
        process.exit(0);

    } catch (err) {
        console.error('❌ Error during verification:', err);
        process.exit(1);
    }
}

verifyFix();
