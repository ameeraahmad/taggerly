const Ad = require('./models/Ad');
const { connectDB } = require('./config/db');

const check = async () => {
    try {
        await connectDB();
        const counts = await Ad.findAll({
            attributes: ['category', [require('sequelize').fn('COUNT', 'id'), 'count']],
            group: ['category']
        });
        console.log(JSON.stringify(counts, null, 2));
    } catch (e) {
        console.error(e.message);
    }
    process.exit(0);
};
check();
