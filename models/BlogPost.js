const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const BlogPost = sequelize.define('BlogPost', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    title_en: {
        type: DataTypes.STRING,
        allowNull: false
    },
    title_ar: {
        type: DataTypes.STRING,
        allowNull: false
    },
    slug: {
        type: DataTypes.STRING,
        unique: true
    },
    excerpt_en: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    excerpt_ar: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    content_en: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    content_ar: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    category: {
        type: DataTypes.ENUM('motors', 'property', 'electronics', 'classifieds', 'jobs', 'services'),
        defaultValue: 'motors'
    },
    featuredImage: {
        type: DataTypes.STRING,
        defaultValue: 'assets/images/placeholder-blog.jpg'
    },
    status: {
        type: DataTypes.ENUM('draft', 'published'),
        defaultValue: 'published'
    },
    views: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    authorId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    isImportant: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    country: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'blog_posts',
    timestamps: true,
    hooks: {
        beforeSave: (post) => {
            if (post.title_en && !post.slug) {
                post.slug = post.title_en.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + Date.now();
            }
        }
    }
});

module.exports = BlogPost;
