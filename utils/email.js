const nodemailer = require('nodemailer');

const createTransporter = () => {
    const isGmail = (process.env.EMAIL_HOST || '').includes('gmail');
    
    const config = {
        host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
        port: process.env.EMAIL_PORT || 2525,
        secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USERNAME || process.env.EMAIL_USER || 'f4762391b1e95c',
            pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || '8e7f1a3074d08b'
        }
    };

    if (isGmail) {
        config.service = 'gmail';
        // Gmail often works better when just specifying the service
        delete config.host;
        delete config.port;
    }

    return nodemailer.createTransport(config);
};

/**
 * Send an email
 * @param {Object} options
 * @param {string} options.email       - Recipient email address
 * @param {string} options.subject     - Email subject
 * @param {string} [options.message]   - Plain text fallback
 * @param {string} [options.html]      - HTML body (takes priority over message)
 */
const sendEmail = async (options) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: `"Tagger" <${process.env.EMAIL_FROM || 'noreply@tagger.com'}>`,
            to: options.email,
            subject: options.subject,
            text: options.message || '',   // plain-text fallback
            html: options.html || undefined
        };

        await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent successfully to: ${options.email}`);
    } catch (err) {
        console.error('🔥 Email Send Error:', err);
        throw err; // Re-throw to handle in controller
    }
};

module.exports = sendEmail;
