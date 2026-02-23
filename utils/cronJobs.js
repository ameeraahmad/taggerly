const cron = require('node-cron');
const Ad = require('../models/Ad');
const { Op } = require('sequelize');
const { createNotification } = require('./notifications');

const initCronJobs = (io) => {
    // Run every day at MN (midnight)
    cron.schedule('0 0 * * *', async () => {
        console.log('⏰ Running Daily Cron Jobs...');

        try {
            // 1) Expire ads older than 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const expiringAds = await Ad.findAll({
                where: {
                    status: 'active',
                    createdAt: { [Op.lt]: thirtyDaysAgo }
                }
            });

            for (const ad of expiringAds) {
                ad.status = 'expired';
                await ad.save();

                await createNotification(io, {
                    userId: ad.userId,
                    type: 'ad_expiring',
                    title: 'Ad Expired',
                    message: `Your ad "${ad.title}" has expired after 30 days. You can renew it from your dashboard.`,
                    relatedId: ad.id
                });
            }
            console.log(`✅ Expired ${expiringAds.length} old ads.`);

            // 2) Demote featured ads that reached their end date
            const now = new Date();
            const expiringFeatured = await Ad.findAll({
                where: {
                    isFeatured: true,
                    featuredUntil: { [Op.lt]: now }
                }
            });

            for (const ad of expiringFeatured) {
                ad.isFeatured = false;
                ad.featuredUntil = null;
                await ad.save();

                await createNotification(io, {
                    userId: ad.userId,
                    type: 'system',
                    title: 'Promotion Ended',
                    message: `The promotion period for your ad "${ad.title}" has ended.`,
                    relatedId: ad.id
                });
            }
            console.log(`✅ Demoted ${expiringFeatured.length} featured ads.`);

        } catch (err) {
            console.error('❌ Cron Job Error:', err);
        }
    });

    console.log('🚀 Cron Jobs Initialized.');
};

module.exports = initCronJobs;
