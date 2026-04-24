const NewsletterSubscriber = require('../models/NewsletterSubscriber');
const { connectDB } = require('../config/db');

async function checkSubscribers() {
    await connectDB();
    const subs = await NewsletterSubscriber.findAll();
    console.log(JSON.stringify(subs, null, 2));
    process.exit();
}

checkSubscribers();
