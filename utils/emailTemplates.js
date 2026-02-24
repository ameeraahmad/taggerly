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

const BRAND_COLOR = '#FF6B00'; // Match site accent color
const BRAND_COLOR_DARK = '#e66000';
const TEXT_COLOR = '#1a202c';
const MUTED_COLOR = '#4a5568';
const BG_COLOR = '#f7fafc';

function baseLayout(content, previewText = '', isRTL = false) {
  return `<!DOCTYPE html>
<html lang="${isRTL ? 'ar' : 'en'}" dir="${isRTL ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Taggerly</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Noto+Sans+Arabic:wght@400;700&display=swap');
    * { font-family: 'Inter', 'Noto Sans Arabic', Segoe UI, sans-serif; }
  </style>
</head>
<body style="margin:0; padding:0; background-color:${BG_COLOR};">
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:${BG_COLOR};">${previewText}</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BG_COLOR}; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          
          <!-- HEADER -->
          <tr>
            <td style="background-color: #0B2447; padding: 32px; text-align: center;">
              <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:800; letter-spacing:-0.5px;">
                <span style="color:${BRAND_COLOR};">T</span>aggerly
              </h1>
            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f1f5f9; padding: 24px; text-align:center; border-top: 1px solid #e2e8f0;">
              <p style="margin:0 0 8px; color:${MUTED_COLOR}; font-size:12px;">
                You're receiving this because you're a registered user of Taggerly.
              </p>
              <p style="margin:0; color:${MUTED_COLOR}; font-size:11px;">
                © ${new Date().getFullYear()} Taggerly. All rights reserved.
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
  return `display:inline-block; background-color:${color}; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:10px; font-size:15px; font-weight:700; margin: 20px 0;`;
}

function welcomeEmail({ name, verifyURL }) {
  const content = `
      <div style="text-align:center;">
        <h2 style="color:${TEXT_COLOR}; font-size:22px; margin-bottom:12px;">Welcome to Taggerly, ${name}! 🎉</h2>
        <p style="color:${MUTED_COLOR}; font-size:15px; margin-bottom:24px; line-height:1.5;">
          Your account has been successfully created. Please verify your email to start posting ads.
        </p>
        
        <a href="${verifyURL}" style="${buttonStyle()}">Verify Email Address</a>

        <hr style="border:none; border-top:1px solid #edf2f7; margin:32px 0;" />
        
        <h2 style="color:${TEXT_COLOR}; font-size:22px; margin-bottom:12px; direction:rtl;">أهلاً بك في تاجرلي، ${name}! 🎉</h2>
        <p style="color:${MUTED_COLOR}; font-size:15px; margin-bottom:24px; line-height:1.5; direction:rtl;">
          تم إنشاء حسابك بنجاح. يرجى تفعيل بريدك الإلكتروني لتبدأ في نشر إعلاناتك.
        </p>
        
        <a href="${verifyURL}" style="${buttonStyle()}">تفعيل البريد الإلكتروني</a>
      </div>
    `;
  return baseLayout(content, 'Welcome to Taggerly! / أهلاً بك في تاجرلي');
}

function resetPasswordEmail({ name, resetURL }) {
  const content = `
      <div style="text-align:center;">
        <h2 style="color:${TEXT_COLOR}; font-size:22px; margin-bottom:12px;">Reset Your Password</h2>
        <p style="color:${MUTED_COLOR}; font-size:15px; margin-bottom:24px; line-height:1.5;">
          Hello ${name}, click the button below to reset your password. This link is valid for 10 minutes.
        </p>
        <a href="${resetURL}" style="${buttonStyle('#e53e3e')}">Reset Password</a>

        <hr style="border:none; border-top:1px solid #edf2f7; margin:32px 0;" />
        
        <h2 style="color:${TEXT_COLOR}; font-size:22px; margin-bottom:12px; direction:rtl;">إعادة تعيين كلمة المرور</h2>
        <p style="color:${MUTED_COLOR}; font-size:15px; margin-bottom:24px; line-height:1.5; direction:rtl;">
          مرحباً ${name}، اضغط على الزر أدناه لإعادة تعيين كلمة مرورك. هذا الرابط صالح لمدة 10 دقائق فقط.
        </p>
        <a href="${resetURL}" style="${buttonStyle('#e53e3e')}">إعادة تعيين كلمة المرور</a>
      </div>
    `;
  return baseLayout(content, 'Reset password requested for Taggerly / طلب إعادة تعيين كلمة المرور');
}

function adApprovedEmail({ userName, adTitle, adURL }) {
  const content = `
      <div style="text-align:center;">
        <div style="font-size:40px; margin-bottom:16px;">✅</div>
        <h2 style="color:${TEXT_COLOR}; font-size:22px; margin-bottom:12px;">Your Ad is Live!</h2>
        <p style="color:${MUTED_COLOR}; font-size:15px; margin-bottom:12px; line-height:1.5;">
          Good news, ${userName}! Your ad <strong>"${adTitle}"</strong> has been approved.
        </p>
        <a href="${adURL}" style="${buttonStyle('#38a169')}">View Ad</a>

        <hr style="border:none; border-top:1px solid #edf2f7; margin:32px 0;" />
        
        <h2 style="color:${TEXT_COLOR}; font-size:22px; margin-bottom:12px; direction:rtl;">تمت الموافقة على إعلانك!</h2>
        <p style="color:${MUTED_COLOR}; font-size:15px; margin-bottom:12px; line-height:1.5; direction:rtl;">
          أخبار سارة يا ${userName}! لقد تمت مراجعة إعلانك <strong>"${adTitle}"</strong> والموافقة على نشره.
        </p>
        <a href="${adURL}" style="${buttonStyle('#38a169')}">مشاهدة الإعلان</a>
      </div>
    `;
  return baseLayout(content, `Ad Approved: ${adTitle} / تمت الموافقة على إعلانك`);
}

function adRejectedEmail({ userName, adTitle, reason }) {
  const content = `
      <div style="text-align:center;">
        <div style="font-size:40px; margin-bottom:16px;">❌</div>
        <h2 style="color:${TEXT_COLOR}; font-size:22px; margin-bottom:12px;">Action Required: Ad Rejected</h2>
        <p style="color:${MUTED_COLOR}; font-size:14px; margin-bottom:12px; line-height:1.5;">
          Hello ${userName}, unfortunately your ad <strong>"${adTitle}"</strong> was not approved.
        </p>
        <div style="background:#fff5f5; border-radius:8px; padding:16px; margin:16px 0; text-align:left;">
            <p style="color:#c53030; font-size:13px; margin:0;"><strong>Reason:</strong> ${reason}</p>
        </div>

        <hr style="border:none; border-top:1px solid #edf2f7; margin:32px 0;" />
        
        <h2 style="color:${TEXT_COLOR}; font-size:22px; margin-bottom:12px; direction:rtl;">تنبيه: لم يتم قبول الإعلان</h2>
        <p style="color:${MUTED_COLOR}; font-size:14px; margin-bottom:12px; line-height:1.5; direction:rtl;">
          مرحباً ${userName}، للأسف لم تتم الموافقة على نشر إعلانك <strong>"${adTitle}"</strong>.
        </p>
        <div style="background:#fff5f5; border-radius:8px; padding:16px; margin:16px 0; text-align:right; direction:rtl;">
            <p style="color:#c53030; font-size:13px; margin:0;"><strong>السبب:</strong> ${reason}</p>
        </div>
      </div>
    `;
  return baseLayout(content, `Ad Rejected: ${adTitle} / لم يتم قبول الإعلان`);
}

function newMessageEmail({ recipientName, senderName, adTitle, messagePreview, chatURL }) {
  const content = `
      <div>
        <h2 style="color:${TEXT_COLOR}; font-size:20px; margin-bottom:12px;">New Message!</h2>
        <p style="color:${MUTED_COLOR}; font-size:15px; line-height:1.5;">
          You have a new message from <strong>${senderName}</strong> regarding "<strong>${adTitle}</strong>".
        </p>
        <div style="background:#f7fafc; padding:16px; border-radius:8px; margin:16px 0; font-style:italic;">
          "${messagePreview}"
        </div>
        <div style="text-align:center;">
            <a href="${chatURL}" style="${buttonStyle()}">Reply Now</a>
        </div>

        <hr style="border:none; border-top:1px solid #edf2f7; margin:32px 0;" />
        
        <div style="direction:rtl; text-align:right;">
            <h2 style="color:${TEXT_COLOR}; font-size:20px; margin-bottom:12px;">رسالة جديدة!</h2>
            <p style="color:${MUTED_COLOR}; font-size:15px; line-height:1.5;">
              لديك رسالة جديدة من <strong>${senderName}</strong> بخصوص "<strong>${adTitle}</strong>".
            </p>
            <div style="background:#f7fafc; padding:16px; border-radius:8px; margin:16px 0; font-style:italic;">
              "${messagePreview}"
            </div>
            <div style="text-align:center;">
                <a href="${chatURL}" style="${buttonStyle()}">الرد الآن</a>
            </div>
        </div>
      </div>
    `;
  return baseLayout(content, `New message from ${senderName} / رسالة جديدة`);
}

function emailVerificationEmail({ name, verifyURL }) {
  return welcomeEmail({ name, verifyURL }); // Re-use welcome logic
}

function paymentReceiptEmail({ userName, plan, amount, currency = 'USD', transactionId, date }) {
  const content = `
      <div style="text-align:center;">
        <h2 style="color:${TEXT_COLOR}; font-size:22px; margin-bottom:12px;">Payment Receipt</h2>
        <table width="100%" style="text-align:left; border-collapse:collapse; margin:20px 0; font-size:14px;">
            <tr><td style="padding:8px 0; border-bottom:1px solid #edf2f7;">Plan:</td><td style="padding:8px 0; border-bottom:1px solid #edf2f7; text-align:right;">${plan}</td></tr>
            <tr><td style="padding:8px 0; border-bottom:1px solid #edf2f7;">Amount:</td><td style="padding:8px 0; border-bottom:1px solid #edf2f7; text-align:right;">${amount} ${currency}</td></tr>
            <tr><td style="padding:8px 0; border-bottom:1px solid #edf2f7;">Transaction:</td><td style="padding:8px 0; border-bottom:1px solid #edf2f7; text-align:right;">${transactionId}</td></tr>
        </table>
        <a href="#" style="${buttonStyle()}">Download Invoice</a>

        <hr style="border:none; border-top:1px solid #edf2f7; margin:32px 0;" />
        
        <h2 style="color:${TEXT_COLOR}; font-size:22px; margin-bottom:12px; direction:rtl;">إيصال الدفع</h2>
        <table width="100%" style="text-align:right; direction:rtl; border-collapse:collapse; margin:20px 0; font-size:14px;">
            <tr><td style="padding:8px 0; border-bottom:1px solid #edf2f7;">الباقة:</td><td style="padding:8px 0; border-bottom:1px solid #edf2f7; text-align:left;">${plan}</td></tr>
            <tr><td style="padding:8px 0; border-bottom:1px solid #edf2f7;">المبلغ:</td><td style="padding:8px 0; border-bottom:1px solid #edf2f7; text-align:left;">${amount} ${currency}</td></tr>
            <tr><td style="padding:8px 0; border-bottom:1px solid #edf2f7;">رقم العملية:</td><td style="padding:8px 0; border-bottom:1px solid #edf2f7; text-align:left;">${transactionId}</td></tr>
        </table>
      </div>
    `;
  return baseLayout(content, 'Payment Receipt / إيصال الدفع');
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
