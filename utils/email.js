const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1) Create a transporter
    // For production, use a real service like SendGrid or Mailgun
    // For development, use Mailtrap
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
        port: process.env.EMAIL_PORT || 2525,
        auth: {
            user: process.env.EMAIL_USERNAME || 'f4762391b1e95c',
            pass: process.env.EMAIL_PASSWORD || '8e7f1a3074d08b'
        }
    });

    // 2) Define the email options
    const mailOptions = {
        from: 'Dubizzle Clone <noreply@dubizzleclone.com>',
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    // 3) Actually send the email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
