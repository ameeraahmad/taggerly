const { sequelize, connectDB } = require('./config/db');
const User = require('./models/User');

(async () => {
    try {
        await connectDB();
        
        const credentials = [
            { 
                email: 'admin@taggerly.com', 
                password: 'Admin123!', 
                name: 'System Admin', 
                role: 'admin' 
            },
            { 
                email: 'user@example.com', 
                password: 'user', 
                name: 'Test Member', 
                role: 'user' 
            }
        ];

        for (const cred of credentials) {
            let u = await User.findOne({ where: { email: cred.email } });
            if (u) {
                console.log(`Updating existing user: ${cred.email}`);
                u.password = cred.password;
                u.role = cred.role;
                await u.save(); // Hooks will handle hashing
            } else {
                console.log(`Creating new user: ${cred.email}`);
                await User.create({
                    name: cred.name,
                    email: cred.email,
                    password: cred.password,
                    role: cred.role
                });
            }
        }

        console.log('✅ Users updated successfully! You can now log in.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error updating users:', err.message);
        process.exit(1);
    }
})();
