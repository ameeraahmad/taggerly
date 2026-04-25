const { Sequelize } = require('sequelize');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL;

const sequelize = databaseUrl
    ? new Sequelize(databaseUrl, {
        dialect: process.env.DB_DIALECT || 'postgres',
        protocol: process.env.DB_DIALECT || 'postgres',
        dialectOptions: (process.env.DB_DIALECT || 'postgres') === 'postgres' ? {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        } : {},
        logging: false
    })
    : (process.env.DB_NAME ? new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT || 'mysql',
        logging: false
    }) : new Sequelize({
        dialect: 'sqlite',
        storage: path.join(__dirname, '../database.sqlite'),
        logging: false
    }));

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
                        if (!userTableInfo.emailNotifications) {
                            console.log('➕ Adding "emailNotifications" column to Users...');
                            await queryInterface.addColumn('Users', 'emailNotifications', { type: Sequelize.BOOLEAN, defaultValue: true });
                        }
                        if (!userTableInfo.chatNotifications) {
                            console.log('➕ Adding "chatNotifications" column to Users...');
                            await queryInterface.addColumn('Users', 'chatNotifications', { type: Sequelize.BOOLEAN, defaultValue: true });
                        }
                        if (!userTableInfo.isBanned) {
                            console.log('➕ Adding "isBanned" column to Users...');
                            await queryInterface.addColumn('Users', 'isBanned', { type: Sequelize.BOOLEAN, defaultValue: false });
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
                        if (!tableInfo.country) {
                            console.log('➕ Adding "country" column to Ads...');
                            await queryInterface.addColumn('Ads', 'country', { type: Sequelize.STRING, allowNull: true, defaultValue: 'uae' });
                        }
                        if (!tableInfo.rejectionReason) {
                            console.log('➕ Adding "rejectionReason" column to Ads...');
                            await queryInterface.addColumn('Ads', 'rejectionReason', { type: Sequelize.TEXT, allowNull: true });
                        }
                        if (!tableInfo.views) {
                            console.log('➕ Adding "views" column to Ads...');
                            await queryInterface.addColumn('Ads', 'views', { type: Sequelize.INTEGER, defaultValue: 0 });
                        }
                        if (!tableInfo.bedrooms) {
                            console.log('➕ Adding "bedrooms" column to Ads...');
                            await queryInterface.addColumn('Ads', 'bedrooms', { type: Sequelize.INTEGER, allowNull: true });
                        }
                        if (!tableInfo.bathrooms) {
                            console.log('➕ Adding "bathrooms" column to Ads...');
                            await queryInterface.addColumn('Ads', 'bathrooms', { type: Sequelize.INTEGER, allowNull: true });
                        }
                        if (!tableInfo.propertyType) {
                            console.log('➕ Adding "propertyType" column to Ads...');
                            await queryInterface.addColumn('Ads', 'propertyType', { type: Sequelize.STRING, allowNull: true });
                        }
                        if (!tableInfo.editCount) {
                            console.log('➕ Adding "editCount" column to Ads...');
                            await queryInterface.addColumn('Ads', 'editCount', { type: Sequelize.INTEGER, defaultValue: 0 });
                        }
                        if (!tableInfo.lastEditedAt) {
                            console.log('🏗️ Adding missing column: lastEditedAt to Ads table');
                            await queryInterface.addColumn('Ads', 'lastEditedAt', { type: Sequelize.DATE, allowNull: true });
                        }
                        if (!tableInfo.latitude) {
                            console.log('🏗️ Adding missing column: latitude to Ads table');
                            await queryInterface.addColumn('Ads', 'latitude', { type: Sequelize.DOUBLE, allowNull: true });
                        }
                        if (!tableInfo.longitude) {
                            console.log('🏗️ Adding missing column: longitude to Ads table');
                            await queryInterface.addColumn('Ads', 'longitude', { type: Sequelize.DOUBLE, allowNull: true });
                        }
                        if (!tableInfo.paymentMethod) {
                            console.log('🏗️ Adding missing column: paymentMethod to Ads table');
                            await queryInterface.addColumn('Ads', 'paymentMethod', { type: Sequelize.STRING, allowNull: true });
                        }
                        if (!tableInfo.completionStatus) {
                            console.log('🏗️ Adding missing column: completionStatus to Ads table');
                            await queryInterface.addColumn('Ads', 'completionStatus', { type: Sequelize.STRING, allowNull: true });
                        }
                        if (!tableInfo.furnished) {
                            console.log('🏗️ Adding missing column: furnished to Ads table');
                            await queryInterface.addColumn('Ads', 'furnished', { type: Sequelize.STRING, allowNull: true });
                        }
                        if (!tableInfo.amenities) {
                            console.log('🏗️ Adding missing column: amenities to Ads table');
                            await queryInterface.addColumn('Ads', 'amenities', { type: Sequelize.TEXT, allowNull: true, defaultValue: '[]' });
                        }
                        
                        // Ensure Favorites table exists
                        const tables = await queryInterface.showAllTables();
                        if (!tables.includes('Favorites')) {
                            console.log('🏗️ Creating missing table: Favorites');
                            await queryInterface.createTable('Favorites', {
                                id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
                                userId: { type: Sequelize.INTEGER, allowNull: false },
                                adId: { type: Sequelize.INTEGER, allowNull: false },
                                createdAt: { type: Sequelize.DATE, allowNull: false },
                                updatedAt: { type: Sequelize.DATE, allowNull: false }
                            });
                        }
                    } catch (mErr) {
                        console.log('ℹ️ Additional SQLite columns for Ads might already exist.');
                    }
                }

                // Check Conversations table
                const convTableInfo = await queryInterface.describeTable('Conversations').catch(() => ({}));
                if (convTableInfo.id) {
                    try {
                        if (!convTableInfo.deletedByBuyer) {
                            console.log('➕ Adding "deletedByBuyer" column to Conversations...');
                            await queryInterface.addColumn('Conversations', 'deletedByBuyer', { type: Sequelize.BOOLEAN, defaultValue: false });
                        }
                        if (!convTableInfo.deletedBySeller) {
                            console.log('➕ Adding "deletedBySeller" column to Conversations...');
                            await queryInterface.addColumn('Conversations', 'deletedBySeller', { type: Sequelize.BOOLEAN, defaultValue: false });
                        }
                    } catch (mErr) {
                        console.log('ℹ️ SQLite columns for Conversations might already exist.');
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

                // Check support_requests table
                const supportTableInfo = await queryInterface.describeTable('support_requests').catch(() => ({}));
                if (supportTableInfo.id) {
                    try {
                        if (!supportTableInfo.status) {
                            console.log('➕ Adding "status" column to support_requests...');
                            await queryInterface.addColumn('support_requests', 'status', { type: Sequelize.STRING, defaultValue: 'pending' });
                        }
                        if (!supportTableInfo.isRead) {
                            console.log('➕ Adding "isRead" column to support_requests...');
                            await queryInterface.addColumn('support_requests', 'isRead', { type: Sequelize.BOOLEAN, defaultValue: false });
                        }
                        if (!supportTableInfo.isReplied) {
                            console.log('➕ Adding "isReplied" column to support_requests...');
                            await queryInterface.addColumn('support_requests', 'isReplied', { type: Sequelize.BOOLEAN, defaultValue: false });
                        }
                        if (!supportTableInfo.replyMessage) {
                            console.log('➕ Adding "replyMessage" column to support_requests...');
                            await queryInterface.addColumn('support_requests', 'replyMessage', { type: Sequelize.TEXT, allowNull: true });
                        }
                        if (!supportTableInfo.phone) {
                            console.log('➕ Adding "phone" column to support_requests...');
                            await queryInterface.addColumn('support_requests', 'phone', { type: Sequelize.STRING, allowNull: true });
                        }
                        if (!supportTableInfo.isImportant) {
                            console.log('➕ Adding "isImportant" column to support_requests...');
                            await queryInterface.addColumn('support_requests', 'isImportant', { type: Sequelize.BOOLEAN, defaultValue: false });
                        }
                    } catch (mErr) {
                        console.log('ℹ️ support_requests columns might already exist.');
                    }
                }

                // Check blog_posts table
                const blogTableInfo = await queryInterface.describeTable('blog_posts').catch(() => ({}));
                if (blogTableInfo.id) {
                    try {
                        if (!blogTableInfo.isImportant) {
                            console.log('➕ Adding "isImportant" column to blog_posts...');
                            await queryInterface.addColumn('blog_posts', 'isImportant', { type: Sequelize.BOOLEAN, defaultValue: false });
                        }
                    } catch (mErr) {
                        console.log('ℹ️ blog_posts columns might already exist.');
                    }
                }
            }

            // Disable alter: true for SQLite as it's buggy with column additions
            // Use manual migrations above instead. For Postgres, alter: true is fine UNLESS on Vercel (to avoid timeouts).
            const isServerless = !!(process.env.VERCEL);
            const syncOptions = isTest ? { force: true } : (databaseUrl ? { alter: !isServerless } : { alter: false });
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
