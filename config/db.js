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

let isSynced = false;
let syncPromise = null;

const isTest = process.env.NODE_ENV === 'test';

const connectDB = async () => {
    if (syncPromise) return syncPromise;

    syncPromise = (async () => {
        try {
            await sequelize.authenticate();
            // In production/dev, we use alter: true to create/update tables
            // In test, we use force: true for a clean slate
            const syncOptions = isTest ? { force: true } : { alter: true };
            await sequelize.sync(syncOptions);
            isSynced = true;
            console.log(`✅ ${databaseUrl ? 'PostgreSQL' : 'SQLite'} Database connected and synced.`);
        } catch (error) {
            console.error('❌ Database connection error:', error.message);
            if (!isTest) process.exit(1);
            throw error;
        }
    })();

    return syncPromise;
};

module.exports = { sequelize, connectDB, getSyncPromise: () => syncPromise };
