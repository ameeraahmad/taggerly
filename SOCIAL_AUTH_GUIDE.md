# دليل إعداد تسجيل الدخول الاجتماعي (Google & Facebook)

هذا الدليل سيساعدك في الحصول على المعرفات (IDs) اللازمة لتشغيل ميزات تسجيل الدخول عبر جوجل وفيسبوك.

## 1. الحصول على Google Client ID
1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com/).
2. قم بإنشاء مشروع جديد (أو اختر مشروعاً موجوداً).
3. في القائمة الجانبية، اذهب إلى **APIs & Services** > **OAuth consent screen**.
4. اختر **External** واضغط **Create**.
5. املأ البيانات الأساسية (اسم التطبيق، البريد الإلكتروني للدعم).
6. اذهب إلى **Credentials** > **Create Credentials** > **OAuth client ID**.
7. اختر نوع التطبيق: **Web application**.
8. أضف الروابط التالية في **Authorized JavaScript origins**:
   - `http://localhost:5000`
   - `http://localhost:3000`
   - `https://taggerly-production.up.railway.app`
9. اضغط **Create** وانسخ الـ `Client ID`.

---

## 2. الحصول على Facebook App ID
1. اذهب إلى [Facebook for Developers](https://developers.facebook.com/).
2. اضغط على **My Apps** > **Create App**.
3. اختر **Allow people to log in with their Facebook account**.
4. ادخل اسم التطبيق واضغط **Create app**.
5. في لوحة التحكم، ابحث عن **Facebook Login** واضغط **Set Up**.
6. اختر **Web**.
7. في الإعدادات (**Settings > Basic**)، ستجد الـ **App ID**.
8. اذهب إلى **Facebook Login > Settings** وأضف الروابط التالية في **Valid OAuth Redirect URIs**:
   - `https://taggerly-production.up.railway.app/`
   - `http://localhost:5000/`

---

## 3. التفعيل في الكود
بعد الحصول على المعرفات، قم بتحديث الملفات التالية:

### في ملف `login.html`:
- ابحث عن `client_id` في وظيفة `loginWithGoogle` واستبدلها بالمعرف الخاص بك.
- ابحث عن `appId` في وظيفة `window.fbAsyncInit` واستبدلها بالمعرف الخاص بك.

### في لوحة تحكم Railway (Settings):
أضف المتغير الجديد:
- `GOOGLE_CLIENT_ID` = (المعرف الذي حصلت عليه)

---

**تم إعداد البنية التحتية للكود (Backend & Frontend) بنجاح. بمجرد إضافة المعرفات الصحيحة، سيعمل النظام مباشرة.**
