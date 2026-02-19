const { Sequelize } = require('sequelize');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL;

const sequelize = databaseUrl
    ? new Sequelize(databaseUrl, {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        logging: false
    })
    : new Sequelize({
        dialect: 'sqlite',
        storage: path.join(__dirname, '../database.sqlite'),
        logging: false
    });

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        // Use alter: true in dev, but be careful in production
        await sequelize.sync({ alter: !isProduction });
        console.log(`✅ ${databaseUrl ? 'PostgreSQL' : 'SQLite'} Database connected and synced.`);
    } catch (error) {
        console.error('❌ Database connection error:', error.message);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
