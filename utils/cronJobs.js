const cron = require('node-cron');
const Ad = require('../models/Ad');
const User = require('../models/User');
const { Op } = require('sequelize');
const { createNotification } = require('./notifications');
const sendEmail = require('./email');
const { adExpiringSoonEmail } = require('./emailTemplates');

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
                },
                include: [{ model: User, as: 'user', attributes: ['name', 'email'] }]
            });

            for (const ad of expiringAds) {
                ad.status = 'expired';
                await ad.save();

                await createNotification(io, {
                    userId: ad.userId,
                    type: 'ad_expiring',
                    title: 'Ad Expired',
                    message: `Your ad "${ad.title}" has expired after 30 days. You can renew it from your dashboard.`,
                    link: `ad-details.html?id=${ad.id}`,
                    relatedId: ad.id
                });
            }
            console.log(`✅ Expired ${expiringAds.length} old ads.`);

            // 2) Reminder for ads expiring in 3 days (created 27 days ago)
            const twentySevenDaysAgoStart = new Date();
            twentySevenDaysAgoStart.setDate(twentySevenDaysAgoStart.getDate() - 27);
            twentySevenDaysAgoStart.setHours(0, 0, 0, 0);

            const twentySevenDaysAgoEnd = new Date();
            twentySevenDaysAgoEnd.setDate(twentySevenDaysAgoEnd.getDate() - 27);
            twentySevenDaysAgoEnd.setHours(23, 59, 59, 999);

            const adsToRemind = await Ad.findAll({
                where: {
                    status: 'active',
                    createdAt: {
                        [Op.between]: [twentySevenDaysAgoStart, twentySevenDaysAgoEnd]
                    }
                },
                include: [{ model: User, as: 'user', attributes: ['name', 'email'] }]
            });

            for (const ad of adsToRemind) {
                if (ad.user && ad.user.email) {
                    sendEmail({
                        email: ad.user.email,
                        subject: `⚠️ Reminder: Your ad on Taggerly is expiring soon!`,
                        message: `Your ad "${ad.title}" will expire in 3 days.`,
                        html: adExpiringSoonEmail({
                            userName: ad.user.name,
                            adTitle: ad.title,
                            daysLeft: 3,
                            dashboardURL: 'https://taggerly.com/dashboard.html'
                        })
                    }).catch(err => console.error('Expiry reminder email failed:', err));
                }
            }
            console.log(`✅ Sent ${adsToRemind.length} expiry reminders.`);

            // 3) Demote featured ads that reached their end date
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
                    link: `ad-details.html?id=${ad.id}`,
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
