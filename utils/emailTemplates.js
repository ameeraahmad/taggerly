const brandColor = '#FF6B00';
const secondaryColor = '#0B2447';

const emailHeader = `
<div style="background-color: ${secondaryColor}; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-family: sans-serif;">Dubizzle Clone</h1>
</div>
`;

const emailFooter = `
<div style="text-align: center; padding: 20px; color: #666; font-size: 12px; font-family: sans-serif;">
    <p>&copy; 2026 Dubizzle Clone. All rights reserved.</p>
    <p>The best place to buy and sell anything in the UAE.</p>
</div>
`;

const containerStyle = `
max-width: 600px; 
margin: 20px auto; 
background-color: white; 
border: 1px solid #eee; 
border-radius: 8px; 
box-shadow: 0 4px 6px rgba(0,0,0,0.05);
`;

/**
 * Welcome Email Template
 */
exports.welcomeEmail = (options) => `
<div style="${containerStyle}">
    ${emailHeader}
    <div style="padding: 40px; font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: ${secondaryColor};">Welcome to the Club, ${options.name}!</h2>
        <p>We're thrilled to have you join our community. Whether you're looking to find your next car, a new home, or just some cool gadgets, you're in the right place.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${options.verifyURL}" style="background-color: ${brandColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 50px; font-weight: bold;">Verify Your Email</a>
        </div>
        
        <p>If you have any questions, our support team is always here to help.</p>
        <p>Happy trading!<br>The Dubizzle Clone Team</p>
    </div>
    ${emailFooter}
</div>
`;

/**
 * Email Verification Template (Alternative simple version if needed)
 */
exports.emailVerificationEmail = (options) => `
<div style="${containerStyle}">
    ${emailHeader}
    <div style="padding: 40px; font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: ${secondaryColor};">Verify Your Email Address</h2>
        <p>Hi ${options.name},</p>
        <p>Thank you for signing up! Please verify your email by clicking the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${options.verifyURL}" style="background-color: ${brandColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 50px; font-weight: bold;">Verify Email</a>
        </div>
        
        <p>If you didn't create an account, you can safely ignore this email.</p>
        <p>Best regards,<br>The Dubizzle Clone Team</p>
    </div>
    ${emailFooter}
</div>
`;

/**
 * Reset Password Template
 */
exports.resetPasswordEmail = (options) => `
<div style="${containerStyle}">
    ${emailHeader}
    <div style="padding: 40px; font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: ${secondaryColor};">Reset Your Password</h2>
        <p>Hello ${options.name},</p>
        <p>We received a request to reset your password. If you didn't make this request, you can ignore this email.</p>
        <p>To reset your password, click the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${options.resetURL}" style="background-color: ${brandColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 50px; font-weight: bold;">Reset Password</a>
        </div>
        
        <p>This link will expire in 10 minutes.</p>
        <p>Stay safe,<br>The Dubizzle Clone Team</p>
    </div>
    ${emailFooter}
</div>
`;

/**
 * New Message Notification Template
 */
exports.newMessageEmail = (options) => `
<div style="${containerStyle}">
    ${emailHeader}
    <div style="padding: 40px; font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: ${secondaryColor};">New Message Received!</h2>
        <p>Hi ${options.userName},</p>
        <p><strong>${options.senderName}</strong> sent you a new message:</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-left: 4px solid ${brandColor}; margin: 20px 0; font-style: italic;">
            "${options.messageText}"
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${options.chatUrl}" style="background-color: ${secondaryColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 50px; font-weight: bold;">Reply Now</a>
        </div>
        
        <p>See you on the site!</p>
    </div>
    ${emailFooter}
</div>
`;

/**
 * Payment Receipt Template
 */
exports.paymentReceiptEmail = (options) => `
<div style="${containerStyle}">
    ${emailHeader}
    <div style="padding: 40px; font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #00C853;">Payment Successful!</h2>
        <p>Hello ${options.userName},</p>
        <p>Thank you for your purchase! Your payment for the <strong>${options.plan}</strong> plan has been confirmed.</p>
        
        <div style="margin: 30px 0; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #f9f9f9; padding: 15px; font-weight: bold; border-bottom: 1px solid #eee;">Order Summary</div>
            <div style="padding: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span>Plan:</span>
                    <strong>${options.plan}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span>Amount:</span>
                    <strong>${options.amount} ${options.currency || 'AED'}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Transaction ID:</span>
                    <span style="font-size: 11px; color: #888;">${options.transactionId}</span>
                </div>
            </div>
        </div>
        
        <p>Your features are now active. Go ahead and get more eyes on your ads!</p>
        <p>Thank you,<br>The Dubizzle Clone Team</p>
    </div>
    ${emailFooter}
</div>
`;

/**
 * Ad Approved Template
 */
exports.adApprovedEmail = (options) => `
<div style="${containerStyle}">
    ${emailHeader}
    <div style="padding: 40px; font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #00C853;">Great News! Your Ad is Approved</h2>
        <p>Hi ${options.userName},</p>
        <p>Your ad "<strong>${options.adTitle}</strong>" has been reviewed and approved by our moderation team.</p>
        <p>It is now live and visible to everyone on the platform.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${options.adURL}" style="background-color: ${brandColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 50px; font-weight: bold;">View Your Ad</a>
        </div>
        
        <p>Good luck with your sale!</p>
        <p>Best regards,<br>The Dubizzle Clone Team</p>
    </div>
    ${emailFooter}
</div>
`;

/**
 * Ad Rejected Template
 */
exports.adRejectedEmail = (options) => `
<div style="${containerStyle}">
    ${emailHeader}
    <div style="padding: 40px; font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #F44336;">Your Ad Requires Attention</h2>
        <p>Hi ${options.userName},</p>
        <p>Thank you for posting on Dubizzle Clone. Unfortunately, your ad "<strong>${options.adTitle}</strong>" was not approved at this time.</p>
        
        <div style="background-color: #FFF9C4; padding: 20px; border-left: 4px solid #FBC02D; margin: 20px 0;">
            <strong>Reason for rejection:</strong><br>
            ${options.reason}
        </div>
        
        <p>Please review our posting guidelines and update your ad details accordingly.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://dubizzleclone.com/dashboard.html" style="background-color: ${secondaryColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 50px; font-weight: bold;">Go to My Ads</a>
        </div>
        
        <p>Best regards,<br>The Dubizzle Clone Team</p>
    </div>
    ${emailFooter}
</div>
`;
