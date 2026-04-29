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
        if (!user) {
            return res.status(404).json({ success: false, message: 'There is no user with that email address.' });
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
                subject: '🔐 Reset Your Password - Taggerly',
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
    return jwt.sign({ id }, process.env.JWT_SECRET || 'taggerly_secret_key', {
        expiresIn: '30d'
    });
};

exports.register = async (req, res) => {
    try {
        const { name, email, password, phone, country } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
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
                subject: '🎉 Welcome to Taggerly - Verify Your Email',
                message: `Welcome to Taggerly, ${user.name}! Please verify your email: ${verifyURL}`,
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
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials or user not found' });
        }

        const isMatch = await user.correctPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

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
    const { tokenId } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: tokenId,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const { email, name, picture, sub } = ticket.getPayload();

        // Check if user exists
        let user = await User.findOne({ where: { email } });

        if (!user) {
            // Create user if not exists
            user = await User.create({
                name,
                email,
                password: await bcrypt.hash(sub + process.env.JWT_SECRET, 10), // Random password
                avatar: picture,
                role: 'user'
            });
        }

        const token = generateToken(user.id);

        res.status(200).json({
            success: true,
            token,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                country: user.country
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
    const { accessToken } = req.body;

    try {
        // Verify with Facebook Graph API
        const response = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`);
        const data = await response.json();

        if (data.error) {
            return res.status(400).json({ success: false, message: 'Facebook authentication failed' });
        }

        const { id, name, email, picture } = data;

        // Check if user exists
        let user = await User.findOne({ where: { email } });

        if (!user) {
            // Create user if not exists
            user = await User.create({
                name,
                email,
                password: await bcrypt.hash(id + (process.env.JWT_SECRET || 'fallback_secret'), 10),
                avatar: picture ? picture.data.url : null,
                role: 'user'
            });
        }

        const token = generateToken(user.id);

        res.status(200).json({
            success: true,
            token,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                country: user.country
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
            subject: '✉️ Verify Your Email - Taggerly',
            message: `Please verify your email by clicking the link below:\n${verifyURL}`,
            html: emailVerificationEmail({ name: user.name, verifyURL })
        });

        res.status(200).json({ success: true, message: 'Verification email sent!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
