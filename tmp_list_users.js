const { sequelize, connectDB } = require('./config/db');
const User = require('./models/User');

(async () => {
    try {
        await connectDB();
        const users = await User.findAll({ attributes: ['id', 'name', 'email', 'role', 'createdAt'] });
        console.log('--- Current Users in Database ---');
        console.table(users.map(u => u.toJSON()));
        await sequelize.close();
    } catch (err) {
        console.error('Error fetching users:', err.message);
        process.exit(1);
    }
})();
