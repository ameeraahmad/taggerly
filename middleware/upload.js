const multer = require('multer');
const path = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary only if variables are present
if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}

const sharp = require('sharp');
const fs = require('fs');

let storage;

if (process.env.CLOUDINARY_CLOUD_NAME) {
    // Cloudinary Storage
    storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'taggerly_ads',
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
            transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }]
        },
    });
} else {
    // Local Memory Storage for processing
    storage = multer.memoryStorage();
}

// Init upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

// Image Processing Middleware (Only for Local)
const resizeImages = async (req, res, next) => {
    if (!req.files || process.env.CLOUDINARY_CLOUD_NAME) return next();

    req.body.images = [];

    await Promise.all(
        req.files.map(async (file, i) => {
            const filename = `ad-${Date.now()}-${i + 1}.webp`;

            await sharp(file.buffer)
                .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
                .toFormat('webp')
                .webp({ quality: 80 })
                .toFile(path.join(__dirname, '../uploads', filename));

            req.body.images.push(filename);
            // Optionally update the original file object if needed, but we'll use req.body.images
        })
    );

    next();
};

// Check file type
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

module.exports = { upload, resizeImages };

