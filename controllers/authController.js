const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sendEmail = require('../utils/email');
const { welcomeEmail, resetPasswordEmail, emailVerificationEmail } = require('../utils/emailTemplates');

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
    try {
        // 1) Get user based on POSTed email
        const user = await User.findOne({ where: { email: req.body.email } });
        // Always return success message to prevent email enumeration
        if (!user) {
            return res.status(200).json({ success: true, message: 'If that email address exists in our system, a reset link has been sent.' });
        }

        // 2) Generate the random reset token
        const resetToken = user.createPasswordResetToken();
        await user.save(); // Save tokens to DB

        // 3) Send it to user's email
        const frontendURL = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
        const resetURL = `${frontendURL}/reset-password.html?token=${resetToken}`;

        try {
            await sendEmail({
                email: user.email,
                subject: '🔐 Reset Your Password - Tagger',
                message: `Reset your password here: ${resetURL} (valid for 10 min)`,
                html: resetPasswordEmail({ name: user.name, resetURL })
            });

            res.status(200).json({
                success: true,
                message: 'Token sent to email!'
            });
        } catch (err) {
            user.passwordResetToken = null;
            user.passwordResetExpires = null;
            await user.save();

            return res.status(500).json({ success: false, message: 'There was an error sending the email. Try again later!' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Reset Password
// @route   PATCH /api/auth/reset-password/:token
exports.resetPassword = async (req, res) => {
    try {
        // 1) Get user based on the token
        const hashedToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const user = await User.findOne({
            where: {
                passwordResetToken: hashedToken,
                passwordResetExpires: { [require('sequelize').Op.gt]: Date.now() }
            }
        });

        // 2) If token has not expired, and there is user, set the new password
        if (!user) {
            return res.status(400).json({ success: false, message: 'Token is invalid or has expired' });
        }

        user.password = req.body.password;
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        await user.save();

        // 3) Log the user in, send JWT
        const token = generateToken(user.id);
        res.status(200).json({ success: true, token });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Verify Email
// @route   GET /api/auth/verify-email/:token
exports.verifyEmail = async (req, res) => {
    try {
        const user = await User.findOne({ where: { emailVerificationToken: req.params.token } });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = null;
        await user.save();

        res.redirect('/index.html?verified=success');
    } catch (err) {
        res.redirect('/index.html?verified=error');
    }
};

const generateToken = (id) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('FATAL: JWT_SECRET is not defined in environment variables');
    }
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

exports.register = async (req, res) => {
    try {
        const { name, email, password, phone, country } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
        }

        if (password.length < 8) {
            return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
        }

        const existing = await User.findOne({ where: { email } });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const crypto = require('crypto');
        const verificationToken = crypto.randomBytes(32).toString('hex');

        const user = await User.create({
            name,
            email,
            password,
            phone,
            country,
            emailVerificationToken: verificationToken
        });

        // Send Verification Email
        try {
            const frontendURL = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
            const verifyURL = `${frontendURL}/api/auth/verify-email/${verificationToken}`;
            await sendEmail({
                email: user.email,
                subject: '🎉 Welcome to Tagger - Verify Your Email',
                message: `Welcome to Tagger, ${user.name}! Please verify your email: ${verifyURL}`,
                html: welcomeEmail({ name: user.name, verifyURL })
            });
        } catch (err) {
            console.error('Email sending failed during registration:', err);
            // We don't block registration if email fails, but user won't be verified
        }

        const token = generateToken(user.id);

        res.status(201).json({
            success: true, token,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                country: user.country,
                isEmailVerified: user.isEmailVerified
            }
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Login
// @route   POST /api/auth/login
exports.login = async (req, res) => {
    const MAX_ATTEMPTS = 5;
    const LOCK_TIME    = 15 * 60 * 1000; // 15 minutes

    try {
        const { email, password, selectedCountry } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const user = await User.findOne({ where: { email } });

        // ── Brute-force: check if account is locked ───────────────────────────
        if (user && user.isLocked()) {
            const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
            return res.status(429).json({
                success: false,
                code: 'ACCOUNT_LOCKED',
                message: `Too many failed attempts. Account locked for ${minutesLeft} more minute(s).`
            });
        }
        // ─────────────────────────────────────────────────────────────────────

        // Always compare password even if user not found (to prevent timing attacks)
        const dummyHash = '$2a$12$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
        const isMatch = user ? await user.correctPassword(password) : await bcrypt.compare(password, dummyHash);

        // ── Wrong password: increment attempts ────────────────────────────────
        if (!user || !isMatch) {
            if (user) {
                const attempts = (user.loginAttempts || 0) + 1;
                const updateData = { loginAttempts: attempts };
                if (attempts >= MAX_ATTEMPTS) {
                    updateData.lockUntil = new Date(Date.now() + LOCK_TIME);
                    await user.update(updateData);
                    return res.status(429).json({
                        success: false,
                        code: 'ACCOUNT_LOCKED',
                        message: `Too many failed attempts. Account locked for 15 minutes.`
                    });
                }
                await user.update(updateData);
                const remaining = MAX_ATTEMPTS - attempts;
                return res.status(401).json({
                    success: false,
                    message: `Invalid email or password. ${remaining} attempt(s) remaining before account lockout.`,
                    suggestReset: attempts >= 3  // hint frontend to show reset link after 3rd attempt
                });
            }
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        // ─────────────────────────────────────────────────────────────────────

        // ── Reset attempts on success ─────────────────────────────────────────
        if (user.loginAttempts > 0 || user.lockUntil) {
            await user.update({ loginAttempts: 0, lockUntil: null });
        }
        // ─────────────────────────────────────────────────────────────────────

        // Check if user is banned
        if (user.isBanned) {
            return res.status(403).json({ 
                success: false, 
                message: 'Your account has been suspended. Please contact support.' 
            });
        }

        // Check if email is verified (skip for admin accounts)
        if (!user.isEmailVerified && user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Please verify your email address before logging in. Check your inbox for the verification link.',
                code: 'EMAIL_NOT_VERIFIED'
            });
        }

        // ── Country Lock ──────────────────────────────────────────────────────
        if (user.role !== 'admin' && selectedCountry && user.country && user.country !== selectedCountry) {
            const countryNames = { egypt: 'Egypt 🇪🇬', uae: 'UAE 🇦🇪', ksa: 'Saudi Arabia 🇸🇦', qatar: 'Qatar 🇶🇦' };
            return res.status(403).json({
                success: false,
                code: 'COUNTRY_MISMATCH',
                message: `This account is registered in ${countryNames[user.country] || user.country}. Please switch to the correct country version.`,
                accountCountry: user.country
            });
        }
        // ─────────────────────────────────────────────────────────────────────

        const token = generateToken(user.id);
        res.status(200).json({
            success: true, token,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                phone: user.phone,
                country: user.country,
                location: user.location,
                isEmailVerified: user.isEmailVerified
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });
        res.status(200).json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/update
exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, avatar } = req.body;
        const user = await User.findByPk(req.user.id);

        if (user) {
            user.name = name || user.name;
            user.phone = phone || user.phone;
            user.avatar = avatar || user.avatar;

            const updatedUser = await user.save();
            res.status(200).json({
                success: true,
                data: {
                    id: updatedUser.id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    phone: updatedUser.phone,
                    avatar: updatedUser.avatar,
                    country: updatedUser.country
                }
            });
        }
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Google Login
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = async (req, res) => {
    const { tokenId, selectedCountry } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: tokenId,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const { email, name, picture, sub } = ticket.getPayload();

        let user = await User.findOne({ where: { email } });

        if (!user) {
            // Generate a random high-entropy password for social accounts
            // This prevents standard login unless they use the "Forgot Password" flow later
            const randomPassword = crypto.randomBytes(64).toString('hex');
            
            user = await User.create({
                name,
                email,
                password: randomPassword,
                avatar: picture,
                role: 'user',
                country: selectedCountry || null,
                isEmailVerified: true  // Google accounts are pre-verified
            });
        } else {
            // ── Existing user: check country lock ─────────────────────────────
            if (user.isBanned) {
                return res.status(403).json({ success: false, message: 'Your account has been suspended. Please contact support.' });
            }

            const countryNames = { egypt: 'Egypt 🇪🇬', uae: 'UAE 🇦🇪', ksa: 'Saudi Arabia 🇸🇦', qatar: 'Qatar 🇶🇦' };
            if (user.role !== 'admin' && selectedCountry && user.country && user.country !== selectedCountry) {
                return res.status(403).json({
                    success: false,
                    code: 'COUNTRY_MISMATCH',
                    message: `This account is registered in ${countryNames[user.country] || user.country}. Please switch to the correct country version.`,
                    accountCountry: user.country
                });
            }

            // Set country if not set yet (first social login without country)
            if (!user.country && selectedCountry) {
                await user.update({ country: selectedCountry, isEmailVerified: true });
            }
        }

        const token = generateToken(user.id);
        res.status(200).json({
            success: true, token,
            data: {
                id: user.id, name: user.name, email: user.email,
                avatar: user.avatar, country: user.country,
                role: user.role, isEmailVerified: user.isEmailVerified
            }
        });

    } catch (err) {
        console.error('Google Auth Error:', err);
        res.status(400).json({ success: false, message: 'Google authentication failed' });
    }
};

// @desc    Facebook Login
// @route   POST /api/auth/facebook
// @access  Public
exports.facebookLogin = async (req, res) => {
    const { accessToken, selectedCountry } = req.body;

    try {
        const response = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`);
        const fbData = await response.json();

        if (fbData.error) {
            return res.status(400).json({ success: false, message: 'Facebook authentication failed' });
        }

        const { id, name, email, picture } = fbData;

        let user = await User.findOne({ where: { email } });

        if (!user) {
            const randomPassword = crypto.randomBytes(64).toString('hex');

            // ── New user: create and lock to current country ──────────────────
            user = await User.create({
                name, email,
                password: randomPassword,
                avatar: picture ? picture.data.url : null,
                role: 'user',
                country: selectedCountry || null,
                isEmailVerified: true  // Facebook accounts are pre-verified
            });
        } else {
            // ── Existing user: check country lock ─────────────────────────────
            if (user.isBanned) {
                return res.status(403).json({ success: false, message: 'Your account has been suspended. Please contact support.' });
            }

            const countryNames = { egypt: 'Egypt 🇪🇬', uae: 'UAE 🇦🇪', ksa: 'Saudi Arabia 🇸🇦', qatar: 'Qatar 🇶🇦' };
            if (user.role !== 'admin' && selectedCountry && user.country && user.country !== selectedCountry) {
                return res.status(403).json({
                    success: false,
                    code: 'COUNTRY_MISMATCH',
                    message: `This account is registered in ${countryNames[user.country] || user.country}. Please switch to the correct country version.`,
                    accountCountry: user.country
                });
            }

            // Set country if not set yet
            if (!user.country && selectedCountry) {
                await user.update({ country: selectedCountry, isEmailVerified: true });
            }
        }

        const token = generateToken(user.id);
        res.status(200).json({
            success: true, token,
            data: {
                id: user.id, name: user.name, email: user.email,
                avatar: user.avatar, country: user.country,
                role: user.role, isEmailVerified: user.isEmailVerified
            }
        });

    } catch (err) {
        console.error('Facebook Auth Error:', err);
        res.status(400).json({ success: false, message: 'Facebook authentication failed' });
    }
};

// @desc    Resend Verification Email
// @route   POST /api/auth/resend-verification
exports.resendVerification = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (user.isEmailVerified) {
            return res.status(400).json({ success: false, message: 'Email already verified' });
        }

        const crypto = require('crypto');
        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.emailVerificationToken = verificationToken;
        await user.save();

        const frontendURL = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
        const verifyURL = `${frontendURL}/api/auth/verify-email/${verificationToken}`;
        await sendEmail({
            email: user.email,
            subject: '✉️ Verify Your Email - Tagger',
            message: `Please verify your email by clicking the link below:\n${verifyURL}`,
            html: emailVerificationEmail({ name: user.name, verifyURL })
        });

        res.status(200).json({ success: true, message: 'Verification email sent!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Resend Verification Email (Public - no auth needed)
// @route   POST /api/auth/resend-verification-public
exports.resendVerificationPublic = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const user = await User.findOne({ where: { email } });

        // Always return success to prevent email enumeration
        if (!user || user.isEmailVerified) {
            return res.status(200).json({ success: true, message: 'If the email exists and is unverified, a link was sent.' });
        }

        const crypto = require('crypto');
        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.emailVerificationToken = verificationToken;
        await user.save();

        const frontendURL = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
        const verifyURL = `${frontendURL}/api/auth/verify-email/${verificationToken}`;
        await sendEmail({
            email: user.email,
            subject: '✉️ Verify Your Email - Tagger',
            message: `Please verify your email by clicking the link below:\n${verifyURL}`,
            html: emailVerificationEmail({ name: user.name, verifyURL })
        });

        res.status(200).json({ success: true, message: 'Verification email sent!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── OTP PASSWORD RESET SYSTEM ───────────────────────────────────────────────

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendSMS = async (to, message) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken  = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
        console.warn('⚠️  Twilio not configured. OTP (dev only):', message);
        return { dev: true };
    }
    const twilio = require('twilio')(accountSid, authToken);
    return twilio.messages.create({ body: message, from: fromNumber, to });
};

// @desc    Send OTP (email or phone)
// @route   POST /api/auth/send-otp
exports.sendResetOTP = async (req, res) => {
    try {
        const { method, value } = req.body;
        if (!method || !value) {
            return res.status(400).json({ success: false, message: 'Method and value are required' });
        }

        const whereClause = method === 'email' ? { email: value } : { phone: value };
        const user = await User.findOne({ where: whereClause });

        // Always success to prevent enumeration
        if (!user) {
            return res.status(200).json({ success: true, message: 'If the account exists, an OTP was sent.' });
        }

        const otp = generateOTP();
        const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
        await user.update({ resetOTP: hashedOTP, resetOTPExpires: new Date(Date.now() + 10 * 60 * 1000) });

        if (method === 'email') {
            const html = `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;background:#fff;border-radius:12px">
                <h2 style="color:#0B2447">🔐 Password Reset OTP</h2>
                <p>Hello <b>${user.name}</b>,</p>
                <p>Your OTP code is:</p>
                <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#FF6B00;text-align:center;padding:16px 0">${otp}</div>
                <p style="color:#888;font-size:12px">Expires in 10 minutes. Never share this code.</p>
            </div>`;
            await sendEmail({ email: user.email, subject: '🔐 Your Password Reset OTP - Tagger', message: `OTP: ${otp}`, html });
        } else {
            let phone = value.trim();
            if (!phone.startsWith('+')) phone = '+' + phone;
            await sendSMS(phone, `Your Tagger OTP: ${otp}\nValid 10 min. Don't share it.`);
        }

        const masked = method === 'email'
            ? user.email.replace(/(.{2}).+(@.+)/, '$1***$2')
            : user.phone.replace(/.(?=.{4})/g, '*');

        res.status(200).json({ success: true, message: 'OTP sent.', sentTo: masked });
    } catch (err) {
        console.error('sendResetOTP error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Verify OTP and issue reset token
// @route   POST /api/auth/verify-otp
exports.verifyResetOTP = async (req, res) => {
    try {
        const { method, value, otp } = req.body;
        if (!method || !value || !otp) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const whereClause = method === 'email' ? { email: value } : { phone: value };
        const user = await User.findOne({ where: whereClause });

        if (!user || !user.resetOTP || !user.resetOTPExpires) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }
        if (user.resetOTPExpires < Date.now()) {
            await user.update({ resetOTP: null, resetOTPExpires: null });
            return res.status(400).json({ success: false, message: 'OTP expired. Request a new one.' });
        }

        const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
        if (hashedOTP !== user.resetOTP) {
            return res.status(400).json({ success: false, message: 'Incorrect OTP. Try again.' });
        }

        // OTP valid — issue a 15-min password reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        await user.update({
            resetOTP: null, resetOTPExpires: null,
            passwordResetToken: hashedToken,
            passwordResetExpires: new Date(Date.now() + 15 * 60 * 1000)
        });

        res.status(200).json({ success: true, resetToken });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
// ─────────────────────────────────────────────────────────────────────────────
