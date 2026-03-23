const axios = require('axios');

/**
 * Middleware to verify Google reCAPTCHA v3 token
 */
const verifyCaptcha = async (req, res, next) => {
    // Skip captcha check in development if needed, or if no key set
    if (process.env.NODE_ENV === 'development' && !process.env.RECAPTCHA_SECRET_KEY) {
        return next();
    }

    const { captchaToken } = req.body;
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!captchaToken) {
        return res.status(400).json({ success: false, message: 'reCAPTCHA token is required' });
    }

    try {
        const response = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaToken}`
        );

        const { success, score } = response.data;

        if (!success || score < 0.5) {
            return res.status(400).json({ success: false, message: 'reCAPTCHA verification failed. Possible bot detected.' });
        }

        next();
    } catch (err) {
        console.error('reCAPTCHA Error:', err);
        res.status(500).json({ success: false, message: 'Error verifying reCAPTCHA' });
    }
};

module.exports = verifyCaptcha;
