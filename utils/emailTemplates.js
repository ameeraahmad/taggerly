/**
 * Professional HTML Email Templates
 * All templates use inline CSS for maximum email client compatibility
 */

const BASE_STYLES = `
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f4f6f9;
  margin: 0;
  padding: 0;
`;

const BRAND_COLOR = '#e74c3c';
const BRAND_COLOR_DARK = '#c0392b';
const TEXT_COLOR = '#2d3748';
const MUTED_COLOR = '#718096';

function baseLayout(content, previewText = '') {
    return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Dubizzle Clone</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="${BASE_STYLES}">
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#f4f6f9;">${previewText}</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6f9; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND_COLOR} 0%, ${BRAND_COLOR_DARK} 100%); border-radius: 12px 12px 0 0; padding: 32px 40px; text-align: center;">
              <h1 style="margin:0; color:#ffffff; font-size:28px; font-weight:800; letter-spacing:-0.5px;">
                🏪 Dubizzle Clone
              </h1>
              <p style="margin:8px 0 0; color:rgba(255,255,255,0.85); font-size:14px;">Your trusted marketplace</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background:#ffffff; padding: 40px 40px 32px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
              ${content}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 24px 40px; text-align:center;">
              <p style="margin:0 0 8px; color:${MUTED_COLOR}; font-size:13px;">
                You received this email because you have an account on Dubizzle Clone.
              </p>
              <p style="margin:0; color:${MUTED_COLOR}; font-size:12px;">
                © ${new Date().getFullYear()} Dubizzle Clone. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buttonStyle(color = BRAND_COLOR) {
    return `display:inline-block; background:${color}; color:#ffffff; text-decoration:none; padding:14px 32px; border-radius:8px; font-size:15px; font-weight:700; letter-spacing:0.3px; margin: 24px 0;`;
}

function dividerStyle() {
    return `border:none; border-top: 1px solid #e2e8f0; margin: 24px 0;`;
}

// ─────────────────────────────────────────────
// 1. Welcome Email
// ─────────────────────────────────────────────
function welcomeEmail({ name, verifyURL }) {
    const content = `
      <h2 style="margin:0 0 8px; color:${TEXT_COLOR}; font-size:24px; font-weight:700;">Welcome, ${name}! 🎉</h2>
      <p style="margin:0 0 20px; color:${MUTED_COLOR}; font-size:15px; line-height:1.6;">
        We're excited to have you on board. Dubizzle Clone is your go-to platform for buying and selling anything — from cars to electronics, properties, and more.
      </p>
      <hr style="${dividerStyle()}" />
      <p style="margin:0 0 8px; color:${TEXT_COLOR}; font-size:15px; font-weight:600;">✅ First step: Verify your email</p>
      <p style="margin:0 0 20px; color:${MUTED_COLOR}; font-size:14px; line-height:1.6;">
        Please confirm your email address to activate all features of your account.
      </p>
      <div style="text-align:center;">
        <a href="${verifyURL}" style="${buttonStyle()}">Verify My Email</a>
      </div>
      <p style="margin:16px 0 0; color:${MUTED_COLOR}; font-size:12px; text-align:center;">
        This link expires in 24 hours. If you didn't create an account, please ignore this email.
      </p>
      <hr style="${dividerStyle()}" />
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="33%" style="text-align:center; padding:8px;">
            <div style="font-size:24px;">📢</div>
            <p style="margin:4px 0 0; color:${TEXT_COLOR}; font-size:13px; font-weight:600;">Post Ads</p>
          </td>
          <td width="33%" style="text-align:center; padding:8px;">
            <div style="font-size:24px;">💬</div>
            <p style="margin:4px 0 0; color:${TEXT_COLOR}; font-size:13px; font-weight:600;">Live Chat</p>
          </td>
          <td width="33%" style="text-align:center; padding:8px;">
            <div style="font-size:24px;">🛡️</div>
            <p style="margin:4px 0 0; color:${TEXT_COLOR}; font-size:13px; font-weight:600;">Safe & Secure</p>
          </td>
        </tr>
      </table>
    `;
    return baseLayout(content, `Welcome to Dubizzle Clone, ${name}! Verify your email to get started.`);
}

// ─────────────────────────────────────────────
// 2. Reset Password Email
// ─────────────────────────────────────────────
function resetPasswordEmail({ name, resetURL }) {
    const content = `
      <div style="text-align:center; margin-bottom:24px;">
        <div style="display:inline-block; background:#fff5f5; border-radius:50%; width:64px; height:64px; line-height:64px; font-size:28px;">🔐</div>
      </div>
      <h2 style="margin:0 0 8px; color:${TEXT_COLOR}; font-size:24px; font-weight:700; text-align:center;">Reset Your Password</h2>
      <p style="margin:0 0 20px; color:${MUTED_COLOR}; font-size:15px; line-height:1.6; text-align:center;">
        Hi ${name}, we received a request to reset your password. Click the button below to choose a new password.
      </p>
      <div style="text-align:center;">
        <a href="${resetURL}" style="${buttonStyle()}">Reset Password</a>
      </div>
      <hr style="${dividerStyle()}" />
      <p style="margin:0; color:${MUTED_COLOR}; font-size:13px; line-height:1.6;">
        ⏰ This link is valid for <strong>10 minutes</strong> only.<br/>
        🔒 If you didn't request a password reset, please ignore this email — your account is safe.<br/>
        🛡️ Never share this link with anyone.
      </p>
    `;
    return baseLayout(content, 'Password reset requested for your Dubizzle Clone account.');
}

// ─────────────────────────────────────────────
// 3. Email Verification (standalone)
// ─────────────────────────────────────────────
function emailVerificationEmail({ name, verifyURL }) {
    const content = `
      <div style="text-align:center; margin-bottom:24px;">
        <div style="display:inline-block; background:#f0fff4; border-radius:50%; width:64px; height:64px; line-height:64px; font-size:28px;">✉️</div>
      </div>
      <h2 style="margin:0 0 8px; color:${TEXT_COLOR}; font-size:24px; font-weight:700; text-align:center;">Verify Your Email Address</h2>
      <p style="margin:0 0 20px; color:${MUTED_COLOR}; font-size:15px; line-height:1.6; text-align:center;">
        Hi ${name}, please click the button below to verify your email address and activate your account.
      </p>
      <div style="text-align:center;">
        <a href="${verifyURL}" style="${buttonStyle('#27ae60')}">Verify Email Address</a>
      </div>
      <hr style="${dividerStyle()}" />
      <p style="margin:0; color:${MUTED_COLOR}; font-size:13px; line-height:1.6; text-align:center;">
        This link expires in 24 hours. If you didn't create an account, please ignore this email.
      </p>
    `;
    return baseLayout(content, `Verify your email for Dubizzle Clone.`);
}

// ─────────────────────────────────────────────
// 4. New Message Notification
// ─────────────────────────────────────────────
function newMessageEmail({ recipientName, senderName, adTitle, messagePreview, chatURL }) {
    const content = `
      <div style="text-align:center; margin-bottom:24px;">
        <div style="display:inline-block; background:#eff6ff; border-radius:50%; width:64px; height:64px; line-height:64px; font-size:28px;">💬</div>
      </div>
      <h2 style="margin:0 0 8px; color:${TEXT_COLOR}; font-size:24px; font-weight:700;">New Message From ${senderName}</h2>
      <p style="margin:0 0 20px; color:${MUTED_COLOR}; font-size:15px; line-height:1.6;">
        Hi ${recipientName}, you have a new message regarding your ad <strong>"${adTitle}"</strong>.
      </p>
      <div style="background:#f8fafc; border-left: 4px solid ${BRAND_COLOR}; border-radius: 0 8px 8px 0; padding: 16px 20px; margin-bottom:24px;">
        <p style="margin:0 0 4px; color:${MUTED_COLOR}; font-size:12px; text-transform:uppercase; letter-spacing:1px;">Message Preview</p>
        <p style="margin:0; color:${TEXT_COLOR}; font-size:15px; font-style:italic;">"${messagePreview}"</p>
      </div>
      <div style="text-align:center;">
        <a href="${chatURL}" style="${buttonStyle()}">View & Reply</a>
      </div>
      <hr style="${dividerStyle()}" />
      <p style="margin:0; color:${MUTED_COLOR}; font-size:13px; text-align:center;">
        Reply quickly to increase your chances of a successful sale!
      </p>
    `;
    return baseLayout(content, `${senderName} sent you a message about "${adTitle}"`);
}

// ─────────────────────────────────────────────
// 5. Payment Receipt
// ─────────────────────────────────────────────
function paymentReceiptEmail({ userName, plan, amount, currency = 'USD', transactionId, date, features = [] }) {
    const featuresList = features.map(f => `
      <tr>
        <td style="padding: 8px 0; color:${TEXT_COLOR}; font-size:14px; border-bottom: 1px solid #f0f0f0;">
          ✅ ${f}
        </td>
      </tr>
    `).join('');

    const content = `
      <div style="text-align:center; margin-bottom:24px;">
        <div style="display:inline-block; background:#f0fff4; border-radius:50%; width:64px; height:64px; line-height:64px; font-size:28px;">🎉</div>
      </div>
      <h2 style="margin:0 0 8px; color:${TEXT_COLOR}; font-size:24px; font-weight:700; text-align:center;">Payment Successful!</h2>
      <p style="margin:0 0 24px; color:${MUTED_COLOR}; font-size:15px; line-height:1.6; text-align:center;">
        Hi ${userName}, thank you for your purchase. Your payment has been processed successfully.
      </p>

      <!-- Receipt Box -->
      <div style="background:#f8fafc; border: 1px solid #e2e8f0; border-radius:10px; padding: 24px; margin-bottom:24px;">
        <h3 style="margin:0 0 16px; color:${TEXT_COLOR}; font-size:16px; font-weight:700; text-align:center; text-transform:uppercase; letter-spacing:1px;">Payment Receipt</h3>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 0; color:${MUTED_COLOR}; font-size:13px;">Plan</td>
            <td style="padding:8px 0; color:${TEXT_COLOR}; font-size:14px; font-weight:600; text-align:right;">${plan}</td>
          </tr>
          <tr>
            <td style="padding:8px 0; color:${MUTED_COLOR}; font-size:13px; border-top:1px solid #e2e8f0;">Amount</td>
            <td style="padding:8px 0; color:${TEXT_COLOR}; font-size:14px; font-weight:600; text-align:right; border-top:1px solid #e2e8f0;">${amount} ${currency.toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding:8px 0; color:${MUTED_COLOR}; font-size:13px; border-top:1px solid #e2e8f0;">Transaction ID</td>
            <td style="padding:8px 0; color:${TEXT_COLOR}; font-size:12px; font-weight:600; text-align:right; border-top:1px solid #e2e8f0; word-break:break-all;">${transactionId}</td>
          </tr>
          <tr>
            <td style="padding:8px 0; color:${MUTED_COLOR}; font-size:13px; border-top:1px solid #e2e8f0;">Date</td>
            <td style="padding:8px 0; color:${TEXT_COLOR}; font-size:14px; font-weight:600; text-align:right; border-top:1px solid #e2e8f0;">${date}</td>
          </tr>
        </table>
      </div>

      ${featuresList ? `
      <h3 style="margin:0 0 8px; color:${TEXT_COLOR}; font-size:15px; font-weight:700;">What's Included:</h3>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${featuresList}
      </table>
      ` : ''}

      <div style="text-align:center; margin-top:24px;">
        <a href="/dashboard.html" style="${buttonStyle()}">Go to Dashboard</a>
      </div>
    `;
    return baseLayout(content, `Payment confirmed! Your ${plan} is now active.`);
}

// ─────────────────────────────────────────────
// 6. Ad Approved
// ─────────────────────────────────────────────
function adApprovedEmail({ userName, adTitle, adURL }) {
    const content = `
      <div style="text-align:center; margin-bottom:24px;">
        <div style="display:inline-block; background:#f0fff4; border-radius:50%; width:64px; height:64px; line-height:64px; font-size:28px;">✅</div>
      </div>
      <h2 style="margin:0 0 8px; color:${TEXT_COLOR}; font-size:24px; font-weight:700; text-align:center;">Your Ad is Now Live!</h2>
      <p style="margin:0 0 20px; color:${MUTED_COLOR}; font-size:15px; line-height:1.6; text-align:center;">
        Hi ${userName}, great news! Your ad has been reviewed and approved by our team.
      </p>
      <div style="background:#f0fff4; border: 1px solid #c6f6d5; border-radius:10px; padding:16px 20px; margin-bottom:24px; text-align:center;">
        <p style="margin:0; color:#276749; font-size:16px; font-weight:700;">"${adTitle}"</p>
        <p style="margin:4px 0 0; color:#48bb78; font-size:13px;">is now visible to all users</p>
      </div>
      <div style="text-align:center;">
        <a href="${adURL}" style="${buttonStyle('#27ae60')}">View My Ad</a>
      </div>
      <hr style="${dividerStyle()}" />
      <p style="margin:0; color:${MUTED_COLOR}; font-size:13px; text-align:center;">
        💡 Tip: Share your ad on social media to get more visibility and sell faster!
      </p>
    `;
    return baseLayout(content, `Your ad "${adTitle}" has been approved and is now live!`);
}

// ─────────────────────────────────────────────
// 7. Ad Rejected
// ─────────────────────────────────────────────
function adRejectedEmail({ userName, adTitle, reason }) {
    const content = `
      <div style="text-align:center; margin-bottom:24px;">
        <div style="display:inline-block; background:#fff5f5; border-radius:50%; width:64px; height:64px; line-height:64px; font-size:28px;">❌</div>
      </div>
      <h2 style="margin:0 0 8px; color:${TEXT_COLOR}; font-size:24px; font-weight:700; text-align:center;">Ad Requires Attention</h2>
      <p style="margin:0 0 20px; color:${MUTED_COLOR}; font-size:15px; line-height:1.6; text-align:center;">
        Hi ${userName}, unfortunately your ad <strong>"${adTitle}"</strong> was not approved.
      </p>
      ${reason ? `
      <div style="background:#fff5f5; border: 1px solid #feb2b2; border-radius:10px; padding:16px 20px; margin-bottom:24px;">
        <p style="margin:0 0 4px; color:#c53030; font-size:12px; text-transform:uppercase; letter-spacing:1px; font-weight:700;">Reason</p>
        <p style="margin:0; color:#742a2a; font-size:14px; line-height:1.6;">${reason}</p>
      </div>
      ` : ''}
      <div style="text-align:center;">
        <a href="/post-ad.html" style="${buttonStyle()}">Post a New Ad</a>
      </div>
      <hr style="${dividerStyle()}" />
      <p style="margin:0; color:${MUTED_COLOR}; font-size:13px; text-align:center;">
        If you believe this was a mistake, please contact our support team.
      </p>
    `;
    return baseLayout(content, `Action required: Your ad "${adTitle}" was not approved.`);
}

module.exports = {
    welcomeEmail,
    resetPasswordEmail,
    emailVerificationEmail,
    newMessageEmail,
    paymentReceiptEmail,
    adApprovedEmail,
    adRejectedEmail
};
