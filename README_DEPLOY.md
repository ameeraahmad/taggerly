# 🚀 Deployment Guide | دليل رفع الموقع (Hostinger)

This guide will help you deploy **Taggerly** on Hostinger or any other Node.js hosting service.

هذا الدليل سيساعدك على رفع موقع **Taggerly** على استضافة Hostinger أو أي استضافة Node.js أخرى.

---

## 🛠 Prerequisites | المتطلبات الأساسية
- **Node.js**: v18.0 or higher.
- **Database**: PostgreSQL (Recommended) or MySQL / MariaDB.
- **Media Storage**: Cloudinary account (Free tier is enough).

---

## 📂 Method 1: Hostinger Shared/Cloud Hosting (hPanel)
## 📂 الطريقة الأولى: الاستضافة المشتركة (hPanel)

1. **Upload Files**: Upload all project files to your public directory (except `node_modules` and `.git`).
2. **Node.js Setup**:
   - Go to your hPanel -> **Node.js**.
   - Select the version (v18+).
   - Set **Entry File** to `server.js`.
   - Click **Install Dependencies** (This will run `npm install`).
3. **Environment Variables**:
   - Create a `.env` file in the root directory.
   - Copy the content from `.env.example` and fill in your real credentials (Database, Cloudinary, etc.).
4. **Database**:
   - Create a MySQL database in hPanel.
   - Fill the DB details in your `.env` file.
5. **Start App**: Click **Start** or **Restart** from the Node.js dashboard.

---

## ☁️ Method 2: Hostinger VPS (Ubuntu/Linux)
## ☁️ الطريقة الثانية: السيرفر الخاص (VPS)

1. **Access VPS**: Connect via SSH: `ssh root@your_vps_ip`.
2. **Install Node.js & PM2**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   ```
3. **Clone & Install**:
   ```bash
   git clone <your_repo_url>
   cd taggerly-project
   npm install
   ```
4. **Setup Environment**:
   ```bash
   cp .env.example .env
   nano .env # Edit with your production values
   ```
5. **Start with PM2**:
   ```bash
   pm2 start server.js --name "taggerly"
   pm2 save
   pm2 startup
   ```

---

## 🔑 Environment Variables | شرح متغيرات البيئة

| Variable | Description | الوصف |
|----------|-------------|-------|
| `PORT` | Server port (default 5000) | منفذ السيرفر |
| `DB_DIALECT` | mysql / postgres | نوع قاعدة البيانات |
| `DB_HOST` | Database host (e.g. localhost) | رابط قاعدة البيانات |
| `DATABASE_URL` | Full connection string (if available) | الرابط الكامل للقاعدة (اختياري) |
| `JWT_SECRET` | Strong secret for security | مفتاح تشفير البيانات |
| `CLOUDINARY_*` | For image uploads | لرفع الصور |
| `STRIPE_*` | For payment processing | لمعالجة المدفوعات |

---

## 🏗️ Database Setup | إعداد قاعدة البيانات
After configuring your `.env` and starting the app, you may want to populate the database with initial categories and data:
بعد ضبط الإعدادات وتشغيل التطبيق، قد ترغب في ملأ قاعدة البيانات بالتصنيفات والبيانات الأساسية:

```bash
# Run database seeder
npm run seed
```

---

## 💡 Important Notes | ملاحظات هامة
- **SSL**: Ensure your domain has an active SSL certificate (HTTPS).
- **Security**: Never share your `.env` file or commit it to a public repository.
- **Port**: Hostinger usually assigns a specific port; make sure to update it in `.env` if required.

---

**Need Help?** Contact the developer or refer to the `PROJECT_OVERVIEW.md`.
**هل تحتاج مساعدة؟** تواصل مع المطور أو راجع ملف `PROJECT_OVERVIEW.md`.
