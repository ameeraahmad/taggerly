require('dotenv').config();
const { connectDB } = require('./config/db');
const User = require('./models/User');

const email = process.argv[2];

if (!email) {
    console.log("❌ Please provide an email address.");
    console.log("Usage: node make-admin.js user@example.com");
    process.exit(1);
}

const makeAdmin = async () => {
    try {
        await connectDB();
        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.log(`❌ User with email '${email}' not found in the database.`);
            process.exit(1);
        }

        user.role = 'admin';
        await user.save();

        console.log(`✅ Success! The user '${user.name}' (${user.email}) is now an ADMIN.`);
        console.log(`➡️ You can now log into the website as this user, and the 'Admin Panel' option will appear in your account menu.`);
        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    }
};

makeAdmin();
