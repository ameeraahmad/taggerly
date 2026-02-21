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
            // Disable alter: true to avoid SQLite/Postgres sync validation errors during runtime
            const syncOptions = isTest ? { force: true } : { alter: false };
            await sequelize.sync(syncOptions);
            isSynced = true;
            console.log(`✅ ${databaseUrl ? 'PostgreSQL' : 'SQLite'} Database connected and synced.`);
        } catch (error) {
            console.error('❌ Database connection error:', error.message);
            // Don't exit process, let the server stay alive so we can see logs
            throw error;
        }
    })();

    return syncPromise;
};

module.exports = { sequelize, connectDB, getSyncPromise: () => syncPromise };
