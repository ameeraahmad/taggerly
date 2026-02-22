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

            // Manual migration for SQLite (Fix for SQLITE_ERROR: no column named year)
            if (!databaseUrl && !isTest) {
                console.log('🔍 Checking SQLite schema...');
                const queryInterface = sequelize.getQueryInterface();
                const tableInfo = await queryInterface.describeTable('Ads').catch(() => ({}));

                if (tableInfo.id) { // Only if table exists
                    try {
                        if (!tableInfo.year) {
                            console.log('➕ Adding "year" column to Ads...');
                            await queryInterface.addColumn('Ads', 'year', { type: Sequelize.INTEGER, allowNull: true });
                        }
                        if (!tableInfo.kilometers) {
                            console.log('➕ Adding "kilometers" column to Ads...');
                            await queryInterface.addColumn('Ads', 'kilometers', { type: Sequelize.INTEGER, allowNull: true });
                        }
                        if (!tableInfo.itemCondition) {
                            console.log('➕ Adding "itemCondition" column to Ads...');
                            await queryInterface.addColumn('Ads', 'itemCondition', { type: Sequelize.STRING, allowNull: true });
                        }
                        if (!tableInfo.phone) {
                            console.log('➕ Adding "phone" column to Ads...');
                            await queryInterface.addColumn('Ads', 'phone', { type: Sequelize.STRING, allowNull: true });
                        }
                    } catch (mErr) {
                        console.log('ℹ️ SQLite columns for Ads might already exist.');
                    }
                }

                // Check Users table
                const userTableInfo = await queryInterface.describeTable('Users').catch(() => ({}));
                if (userTableInfo.id) {
                    try {
                        if (!userTableInfo.isOnline) {
                            console.log('➕ Adding "isOnline" column to Users...');
                            await queryInterface.addColumn('Users', 'isOnline', { type: Sequelize.BOOLEAN, defaultValue: false });
                        }
                        if (!userTableInfo.lastActive) {
                            console.log('➕ Adding "lastActive" column to Users...');
                            await queryInterface.addColumn('Users', 'lastActive', { type: Sequelize.DATE, defaultValue: Sequelize.NOW });
                        }
                    } catch (mErr) {
                        console.log('ℹ️ SQLite columns for Users might already exist.');
                    }
                }

                // Check ChatMessages table
                const messageTableInfo = await queryInterface.describeTable('ChatMessages').catch(() => ({}));
                if (messageTableInfo.id) {
                    try {
                        if (!messageTableInfo.image) {
                            console.log('➕ Adding "image" column to ChatMessages...');
                            await queryInterface.addColumn('ChatMessages', 'image', { type: Sequelize.STRING, allowNull: true });
                        }
                    } catch (mErr) {
                        console.log('ℹ️ SQLite columns for ChatMessages might already exist.');
                    }
                }
            }

            // Enable alter: true to sync new fields (bio, location) and new chat tables
            const syncOptions = isTest ? { force: true } : { alter: true };
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
