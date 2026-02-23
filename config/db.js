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
                        if (!tableInfo.isFeatured) {
                            console.log('➕ Adding "isFeatured" column to Ads...');
                            await queryInterface.addColumn('Ads', 'isFeatured', { type: Sequelize.BOOLEAN, defaultValue: false });
                        }
                        if (!tableInfo.featuredUntil) {
                            console.log('➕ Adding "featuredUntil" column to Ads...');
                            await queryInterface.addColumn('Ads', 'featuredUntil', { type: Sequelize.DATE, allowNull: true });
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
                        if (!userTableInfo.isEmailVerified) {
                            console.log('➕ Adding "isEmailVerified" column to Users...');
                            await queryInterface.addColumn('Users', 'isEmailVerified', { type: Sequelize.BOOLEAN, defaultValue: false });
                        }
                        if (!userTableInfo.emailVerificationToken) {
                            console.log('➕ Adding "emailVerificationToken" column to Users...');
                            await queryInterface.addColumn('Users', 'emailVerificationToken', { type: Sequelize.STRING, allowNull: true });
                        }
                        if (!userTableInfo.passwordResetToken) {
                            console.log('➕ Adding "passwordResetToken" column to Users...');
                            await queryInterface.addColumn('Users', 'passwordResetToken', { type: Sequelize.STRING, allowNull: true });
                        }
                        if (!userTableInfo.passwordResetExpires) {
                            console.log('➕ Adding "passwordResetExpires" column to Users...');
                            await queryInterface.addColumn('Users', 'passwordResetExpires', { type: Sequelize.DATE, allowNull: true });
                        }
                        if (!userTableInfo.bio) {
                            console.log('➕ Adding "bio" column to Users...');
                            await queryInterface.addColumn('Users', 'bio', { type: Sequelize.TEXT, allowNull: true });
                        }
                        if (!userTableInfo.location) {
                            console.log('➕ Adding "location" column to Users...');
                            await queryInterface.addColumn('Users', 'location', { type: Sequelize.STRING, allowNull: true });
                        }
                    } catch (mErr) {
                        console.log('ℹ️ SQLite columns for Users might already exist.');
                    }
                }

                // Check Ads table for additional columns
                if (tableInfo.id) {
                    try {
                        if (!tableInfo.subCategory) {
                            console.log('➕ Adding "subCategory" column to Ads...');
                            await queryInterface.addColumn('Ads', 'subCategory', { type: Sequelize.STRING, allowNull: true });
                        }
                        if (!tableInfo.area) {
                            console.log('➕ Adding "area" column to Ads...');
                            await queryInterface.addColumn('Ads', 'area', { type: Sequelize.STRING, allowNull: true });
                        }
                    } catch (mErr) {
                        console.log('ℹ️ Additional SQLite columns for Ads might already exist.');
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

            // Disable alter: true for SQLite as it's buggy with column additions
            // Use manual migrations above instead. For Postgres, alter: true is fine.
            const syncOptions = isTest ? { force: true } : (databaseUrl ? { alter: true } : { alter: false });
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
