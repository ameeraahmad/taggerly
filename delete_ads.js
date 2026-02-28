const { sequelize } = require('./config/db');
const Ad = require('./models/Ad');

const truncateAds = async () => {
    try {
        await sequelize.authenticate();
        await Ad.destroy({ where: {}, truncate: true }); // truncate deletes all data
        console.log('Successfully deleted all ads.');
        process.exit(0);
    } catch (err) {
        console.error('Error deleting ads:', err);
        process.exit(1);
    }
};

truncateAds();
