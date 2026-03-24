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
    if (!req.files || req.files.length === 0 || process.env.CLOUDINARY_CLOUD_NAME) return next();

    req.body.images = [];

    await Promise.all(
        req.files.map(async (file, i) => {
            const filename = `ad-${Date.now()}-${i + 1}.webp`;
            const filepath = path.join(__dirname, '../uploads', filename);

            await sharp(file.buffer)
                .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
                .toFormat('webp')
                .webp({ quality: 80 })
                .toFile(filepath);

            req.body.images.push(`/uploads/${filename}`);
        })
    );

    next();
};

const resizeAvatar = async (req, res, next) => {
    if (!req.file || process.env.CLOUDINARY_CLOUD_NAME) return next();

    const filename = `avatar-${req.user.id}-${Date.now()}.webp`;
    const filepath = path.join(__dirname, '../uploads', filename);

    if (!process.env.VERCEL) {
        if (!fs.existsSync(path.join(__dirname, '../uploads'))) {
            fs.mkdirSync(path.join(__dirname, '../uploads'), { recursive: true });
        }
    }

    await sharp(req.file.buffer)
        .resize(400, 400, { fit: 'cover' })
        .toFormat('webp')
        .webp({ quality: 80 })
        .toFile(filepath);

    req.file.path = `/uploads/${filename}`;
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

module.exports = { upload, resizeImages, resizeAvatar };

