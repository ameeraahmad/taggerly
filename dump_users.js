const { sequelize, connectDB } = require('./config/db');
const User = require('./models/User');
const fs = require('fs');

(async () => {
    try {
        await connectDB();
        const users = await User.findAll({ attributes: ['id', 'name', 'email', 'role', 'password'] });
        const output = users.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            hashedPassword: u.password.substring(0, 15) + '...' // Show only start of hash
        }));
        
        fs.writeFileSync('db_users_dump.json', JSON.stringify(output, null, 2));
        console.log('✅ Users written to db_users_dump.json');
        process.exit(0);
    } catch (err) {
        fs.writeFileSync('db_users_dump.json', JSON.stringify({ error: err.message }, null, 2));
        process.exit(1);
    }
})();
