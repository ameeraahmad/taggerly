const Payment = require('../models/Payment');
const Ad = require('../models/Ad');
const User = require('../models/User');
const { createNotification } = require('../utils/notifications');

// Lazy Stripe initialization - won't crash server if key is missing
let _stripe = null;
function getStripe() {
    if (!_stripe) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key || key.includes('YOUR_STRIPE_SECRET_KEY')) {
            return null; // Stripe not configured yet
        }
        _stripe = require('stripe')(key);
    }
    return _stripe;
}

function stripeNotConfigured(res) {
    return res.status(503).json({
        success: false,
        message: 'Payment system is not configured yet. Please add your Stripe secret key to the environment variables.'
    });
}

const PLANS = {
    basic: {
        name: 'Basic Plan',
        price: 999,       // in cents ($9.99)
        duration: 30,
        features: ['5 Ads per month', 'Standard listing', 'Email support']
    },
    standard: {
        name: 'Standard Plan',
        price: 2999,      // $29.99
        duration: 30,
        features: ['20 Ads per month', 'Priority listing', 'Chat support', '3 Featured Ads']
    },
    premium: {
        name: 'Premium Plan',
        price: 5999,      // $59.99
        duration: 30,
        features: ['Unlimited Ads', 'Top listing', 'Dedicated support', 'Unlimited Featured Ads', 'Analytics']
    },
    featured_ad: {
        name: 'Feature an Ad',
        price: 499,       // $4.99
        duration: 7,
        features: ['Ad appears at top of search', 'Featured badge', '7 days duration']
    }
};

// @desc    Create Stripe checkout session
// @route   POST /api/payments/create-checkout-session
// @access  Private
exports.createCheckoutSession = async (req, res) => {
    const stripe = getStripe();
    if (!stripe) return stripeNotConfigured(res);

    try {
        const { plan, adId } = req.body;
        const userId = req.user.id;

        if (!PLANS[plan]) {
            return res.status(400).json({ success: false, message: 'Invalid plan selected' });
        }

        const planConfig = PLANS[plan];
        const host = `${req.protocol}://${req.get('host')}`;

        const metadata = {
            userId: String(userId),
            plan,
            adId: adId ? String(adId) : null
        };

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: planConfig.name,
                        description: planConfig.features.join(' \u2022 ')
                    },
                    unit_amount: planConfig.price
                },
                quantity: 1
            }],
            metadata,
            success_url: `${host}/plans.html?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${host}/plans.html?canceled=true`
        });

        await Payment.create({
            userId,
            adId: adId || null,
            stripeSessionId: session.id,
            amount: planConfig.price / 100,
            currency: 'usd',
            plan,
            durationDays: planConfig.duration,
            status: 'pending',
            metadata
        });

        res.status(200).json({ success: true, url: session.url, sessionId: session.id });

    } catch (err) {
        console.error('Stripe Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Stripe webhook - handle payment events
// @route   POST /api/payments/webhook
// @access  Public (Stripe calls this)
exports.handleWebhook = async (req, res) => {
    const stripe = getStripe();
    if (!stripe) return res.status(200).json({ received: true }); // silently ignore if not configured

    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature error:', err.message);
        return res.status(400).json({ message: `Webhook Error: ${err.message}` });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        await fulfillOrder(session, req.io);
    }

    res.json({ received: true });
};

const { sendEmail } = require('../utils/email'); // Ensure this is exported or imported correctly
const { paymentReceiptEmail } = require('../utils/emailTemplates');

// ... (existing fulfillOrder function) ...

async function fulfillOrder(session, io) {
    try {
        const payment = await Payment.findOne({
            where: { stripeSessionId: session.id },
            include: [{ model: User, as: 'user', attributes: ['name', 'email'] }]
        });
        if (!payment || payment.status === 'completed') return;

        // Mark payment as completed
        await payment.update({
            status: 'completed',
            stripePaymentIntentId: session.payment_intent
        });

        const { userId, plan, adId } = payment.metadata || {};
        const featuredUntil = new Date();
        featuredUntil.setDate(featuredUntil.getDate() + payment.durationDays);

        // Feature a specific ad
        if (plan === 'featured_ad' && adId) {
            await Ad.update(
                { isFeatured: true, featuredUntil },
                { where: { id: adId } }
            );

            await createNotification(io, {
                userId: parseInt(userId),
                type: 'payment',
                title: '🌟 Your Ad is now Featured!',
                message: `Your ad has been featured successfully for ${payment.durationDays} days.`,
                relatedId: parseInt(adId)
            });
        } else {
            // Subscription plan - feature all user ads
            if (plan === 'premium') {
                await Ad.update(
                    { isFeatured: true, featuredUntil },
                    { where: { userId: parseInt(userId), status: 'active' } }
                );
            }

            await createNotification(io, {
                userId: parseInt(userId),
                type: 'payment',
                title: '✅ Payment Successful!',
                message: `Your ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan is now active for ${payment.durationDays} days.`,
            });
        }

        // Send Email Receipt
        const user = payment.user || await User.findByPk(userId);
        if (user && user.email) {
            const planName = PLANS[plan]?.name || 'Taggerly Plan';
            require('../utils/email')({
                email: user.email,
                subject: '🧾 Payment Receipt - Taggerly',
                html: paymentReceiptEmail({
                    userName: user.name,
                    plan: planName,
                    amount: payment.amount,
                    currency: payment.currency,
                    transactionId: session.payment_intent || session.id,
                    date: new Date().toLocaleDateString()
                })
            }).catch(err => console.error('Receipt email failed:', err));
        }

        console.log(`✅ Payment fulfilled for user ${userId}, plan: ${plan}`);
    } catch (err) {
        console.error('Error fulfilling order:', err);
    }
}

// @desc    Get payment history for current user
// @route   GET /api/payments/my-payments
// @access  Private
exports.getMyPayments = async (req, res) => {
    try {
        const payments = await Payment.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({ success: true, data: payments });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get all payments (admin)
// @route   GET /api/payments/all
// @access  Admin
exports.getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.findAll({
            include: [{ model: User, as: 'user', attributes: ['name', 'email'] }],
            order: [['createdAt', 'DESC']]
        });

        const totalRevenue = payments
            .filter(p => p.status === 'completed')
            .reduce((sum, p) => sum + p.amount, 0);

        res.status(200).json({
            success: true,
            data: payments,
            stats: {
                totalRevenue: totalRevenue.toFixed(2),
                totalTransactions: payments.length,
                completedTransactions: payments.filter(p => p.status === 'completed').length
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get plan prices (public)
// @route   GET /api/payments/plans
// @access  Public
exports.getPlans = async (req, res) => {
    res.status(200).json({ success: true, data: PLANS });
};


// @desc    Verify session after redirect (polling fallback if webhook is slow)
// @route   GET /api/payments/verify-session/:sessionId  
// @access  Private
exports.verifySession = async (req, res) => {
    const stripe = getStripe();
    try {
        let payment = await Payment.findOne({
            where: { stripeSessionId: req.params.sessionId }
        });

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment record not found' });
        }

        // If not completed yet, check directly with Stripe (fallback for webhooks)
        if (payment.status === 'pending' && stripe) {
            const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
            if (session.payment_status === 'paid') {
                await fulfillOrder(session, req.io);
                payment = await payment.reload(); // get updated status
            }
        }

        res.status(200).json({ success: true, data: { status: payment.status, plan: payment.plan } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
