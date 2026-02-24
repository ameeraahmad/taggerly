const { check, validationResult } = require('express-validator');

exports.validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    const extractedErrors = [];
    errors.array().map(err => extractedErrors.push({ [err.path]: err.msg }));

    return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: extractedErrors,
    });
};

exports.registerValidation = [
    check('name', 'Name is required').not().isEmpty().trim(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
];

exports.loginValidation = [
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('password', 'Password is required').exists(),
];

exports.adValidation = [
    check('title', 'Title is required and should be at least 5 chars').isLength({ min: 5 }).trim(),
    check('price', 'Please provide a valid price').isNumeric(),
    check('category', 'Category is required').not().isEmpty(),
];

exports.reviewValidation = [
    check('sellerId', 'Seller ID is required').not().isEmpty(),
    check('rating', 'Rating must be between 1 and 5').isInt({ min: 1, max: 5 }),
    check('comment', 'Comment is required').not().isEmpty().trim(),
];
