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
            // Enable alter: true to sync new fields (bio, location) and new chat tables
            const syncOptions = isTest ? { force: true } : { alter: true };
            await sequelize.sync(syncOptions);

            // Manual fallback for SQLite column additions if 'alter' failed
            if (!databaseUrl && !isTest) {
                const queryInterface = sequelize.getQueryInterface();
                const tableInfo = await queryInterface.describeTable('Ads');

                if (!tableInfo.year) {
                    await queryInterface.addColumn('Ads', 'year', { type: Sequelize.INTEGER, allowNull: true });
                }
                if (!tableInfo.kilometers) {
                    await queryInterface.addColumn('Ads', 'kilometers', { type: Sequelize.INTEGER, allowNull: true });
                }
                if (!tableInfo.itemCondition) {
                    await queryInterface.addColumn('Ads', 'itemCondition', { type: Sequelize.STRING, allowNull: true });
                }
            }

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
