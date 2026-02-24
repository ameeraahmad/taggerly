const nodemailer = require('nodemailer');

const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
        port: process.env.EMAIL_PORT || 2525,
        auth: {
            user: process.env.EMAIL_USERNAME || 'f4762391b1e95c',
            pass: process.env.EMAIL_PASSWORD || '8e7f1a3074d08b'
        }
    });
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
    const transporter = createTransporter();

    const mailOptions = {
        from: `"Dubizzle Clone" <${process.env.EMAIL_FROM || 'noreply@dubizzleclone.com'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message || '',   // plain-text fallback
        html: options.html || undefined
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
