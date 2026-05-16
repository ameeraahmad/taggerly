require('dotenv').config();
const sendEmail = require('../utils/email');

const testEmail = async () => {
    try {
        console.log('Testing email with config:');
        console.log('Host:', process.env.EMAIL_HOST);
        console.log('User:', process.env.EMAIL_USER);
        
        await sendEmail({
            email: process.env.EMAIL_USER,
            subject: 'Test Email from Tagger',
            message: 'If you receive this, the email configuration is working!'
        });
        console.log('✅ SUCCESS: Test email sent.');
    } catch (err) {
        console.error('❌ FAILURE: Test email failed.');
        console.error(err);
    }
};

testEmail();
