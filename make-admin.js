const User = require('./models/User');
const { sequelize } = require('./config/db');

async function makeAdmin(email) {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        const user = await User.findOne({ where: { email } });
        if (!user) {
            console.error(`User with email ${email} not found.`);
            process.exit(1);
        }

        user.role = 'admin';
        await user.save();

        console.log(`Success! User ${user.name} (${email}) is now an admin.`);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

const email = process.argv[2];
if (!email) {
    console.log('Usage: node make-admin.js <email>');
    process.exit(1);
}

makeAdmin(email);
