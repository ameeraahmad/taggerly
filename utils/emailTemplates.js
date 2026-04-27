const brandColor = '#FF6B00';
const secondaryColor = '#0B2447';

const emailHeader = `
<div style="background-color: ${secondaryColor}; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-family: sans-serif;">Taggerly</h1>
</div>
`;

const emailFooter = `
<div style="text-align: center; padding: 20px; color: #666; font-size: 12px; font-family: sans-serif;">
    <p>&copy; 2026 Taggerly. All rights reserved.</p>
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
        <p>Happy trading!<br>The Taggerly Team</p>
    </div>
    ${emailFooter}
</div>
`;

/**
 * Email Verification Template
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
        <p>Best regards,<br>The Taggerly Team</p>
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
        <p>Stay safe,<br>The Taggerly Team</p>
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
        <p>Thank you,<br>The Taggerly Team</p>
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
        <p>Best regards,<br>The Taggerly Team</p>
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
        <p>Thank you for posting on Taggerly. Unfortunately, your ad "<strong>${options.adTitle}</strong>" was not approved at this time.</p>
        
        <div style="background-color: #FFF9C4; padding: 20px; border-left: 4px solid #FBC02D; margin: 20px 0;">
            <strong>Reason for rejection:</strong><br>
            ${options.reason}
        </div>
        
        <p>Please review our posting guidelines and update your ad details accordingly.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/dashboard.html" style="background-color: ${secondaryColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 50px; font-weight: bold;">Go to My Ads</a>
        </div>
        
        <p>Best regards,<br>The Taggerly Team</p>
    </div>
    ${emailFooter}
</div>
`;

/**
 * Ad Expiring Soon Template
 */
exports.adExpiringSoonEmail = (options) => `
<div style="${containerStyle}">
    ${emailHeader}
    <div style="padding: 40px; font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: ${brandColor};">Your Ad is Expiring Soon!</h2>
        <p>Hi ${options.userName},</p>
        <p>This is a friendly reminder that your ad "<strong>${options.adTitle}</strong>" will expire in <strong>${options.daysLeft} days</strong>.</p>
        <p>Once it expires, it will no longer be visible to potential buyers. To keep it live, you can renew it from your dashboard.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${options.dashboardURL}" style="background-color: ${brandColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 50px; font-weight: bold;">Renew My Ad</a>
        </div>
        
        <p>Best regards,<br>The Taggerly Team</p>
    </div>
    ${emailFooter}
</div>
`;

/**
 * Newsletter Welcome Template
 */
exports.newsletterWelcomeEmail = (options) => `
<div style="${containerStyle}">
    ${emailHeader}
    <div style="padding: 40px; font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: ${secondaryColor};">Welcome to the Taggerly Newsletter!</h2>
        <p>Hi there,</p>
        <p>Thanks for subscribing to our newsletter! You're now on the list to receive the latest tips, news, and best deals straight to your inbox.</p>
        
        <p>What you can expect from us:</p>
        <ul style="padding-left: 20px;">
            <li>Exclusive buying and selling tips to help you get the best value.</li>
            <li>Early access to new features and community updates.</li>
            <li>Curated highlights of the most interesting listings each week.</li>
        </ul>
        
        <p>We're excited to help you make the most of Taggerly!</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}" style="background-color: ${brandColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 50px; font-weight: bold;">Browse Latest Ads</a>
        </div>
        
        <p>If you ever want to stop receiving these emails, you can <a href="${options.unsubscribeURL}" style="color: ${secondaryColor};">unsubscribe here</a> at any time.</p>
        <p>Best regards,<br>The Taggerly Team</p>
    </div>
    ${emailFooter}
</div>
`;

/**
 * New Blog Post Notification Template
 */
exports.newBlogPostEmail = (options) => `
<div style="${containerStyle}">
    ${emailHeader}
    <div style="padding: 40px; font-family: sans-serif; line-height: 1.6; color: #333;">
        <p style="text-transform: uppercase; color: ${brandColor}; font-weight: bold; letter-spacing: 1px; font-size: 12px; margin-bottom: 10px;">New Article Published</p>
        <h2 style="color: ${secondaryColor}; margin-top: 0;">${options.title}</h2>
        
        ${options.image ? `<div style="margin-bottom: 20px;"><img src="${options.image}" style="width: 100%; border-radius: 8px;" alt="${options.title}"></div>` : ''}
        
        <p>${options.excerpt}</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${options.postURL}" style="background-color: ${secondaryColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 50px; font-weight: bold;">Read Full Article</a>
        </div>
        
        <p>Stay informed with the latest tips and news from Taggerly!</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 11px; color: #999;">You're receiving this because you're subscribed to the Taggerly Newsletter. 
        <a href="${options.unsubscribeURL}" style="color: ${secondaryColor};">Unsubscribe</a></p>
    </div>
    ${emailFooter}
</div>
`;
