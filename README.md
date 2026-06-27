# متجر الشوربجي (Elshorbagy Store) 🛒

متجر إلكتروني حديث وسريع مخصص لمتجر الشوربجي، تم بناؤه باستخدام **React** و**TypeScript** و**Tailwind CSS** مع واجهة خلفية مبنية على **Express.js**.

تمت تهيئة المشروع وتجهيزه بالكامل لكي يعمل على **Vercel** مجاناً وبأعلى أداء!

---

## 🚀 التشغيل المحلي (Localhost)

لتشغيل المتجر على جهاز الكمبيوتر الخاص بك، اتبع الخطوات التالية بالترتيب:

### 1. تثبيت المكتبات والاعتماديات
افتح منفذ الأوامر (Terminal) في مجلد المشروع واكتب:
```bash
npm install
```

### 2. تشغيل السيرفر المحلي في بيئة التطوير
قم بتشغيل الأمر التالي لبدء الخادم المحلي:
```bash
npm run dev
```
سيفتح المتجر على الرابط المحلي: [http://localhost:3000](http://localhost:3000)

---

## 🌐 رفع وتفعيل الموقع على Vercel (موقع مجاني دائم وسريع)

لتشغيل متجرك على الإنترنت لكي يستخدمه أي شخص من أي مكان في العالم، اتبع هذه الخطوات البسيطة:

### الخطوة 1: ارفع كود المشروع إلى مستودع GitHub الخاص بك
إذا لم تكن قد رفعت الكود إلى GitHub بعد، اكتب الأوامر التالية في منفذ الأوامر (Terminal):
```bash
git init
git add .
git commit -m "إعداد النشر والتهيئة لـ Vercel"
git branch -M main
git remote add origin https://github.com/abdelrahmanyassin1918/Elshorbagy-Store.git
git push -u origin main
```
*(إذا واجهت مشكلة في الربط بالريموت القديم، اكتب `git remote remove origin` أولاً ثم أعد الربط).*

---

### الخطوة 2: ربط مستودع GitHub بموقع Vercel
1. اذهب إلى موقع **[Vercel](https://vercel.com/)** وسجل الدخول باستخدام حساب **GitHub** الخاص بك.
2. اضغط على زر **Add New...** ثم اختر **Project**.
3. ستجد قائمة بمستودعاتك على GitHub، ابحث عن مستودع **Elshorbagy-Store** واضغط على زر **Import**.
4. سيقوم Vercel تلقائياً باكتشاف أن المشروع مبني بـ **Vite**.
5. اترك الإعدادات الافتراضية كما هي، واضغط على **Deploy**!

خلال أقل من دقيقة، سيكون موقعك جاهزاً ومباشراً على الإنترنت، وسيعطيك Vercel رابطاً مجانياً (مثل `elshorbagy-store.vercel.app`) لكي تشاركه مع أي شخص!

---

### 🗄️ إعداد قاعدة البيانات Firestore على Vercel (اختياري)
المشروع مجهز للعمل تلقائياً وبشكل كامل. إذا كنت تريد تفعيل الحفظ الدائم على **Firebase Cloud Firestore** بدلاً من الذاكرة المؤقتة لـ Vercel:
1. اذهب إلى لوحة تحكم مشروعك على **Vercel**، ثم اذهب إلى تبويب **Settings** ⚙️ ثم اختر **Environment Variables**.
2. قم بإضافة متغير بيئة جديد بالاسم التالي:
   - **Key**: `FIREBASE_SERVICE_ACCOUNT`
   - **Value**: ضع هنا محتوى ملف المفتاح السري لـ Google Service Account (الذي تحصل عليه من لوحة تحكم Firebase -> Project Settings -> Service Accounts -> Generate New Private Key).
3. بعد إضافة هذا المتغير، سيبدأ الموقع تلقائياً بالحفظ في قاعدة بيانات Firestore السحابية بشكل دائم ومستمر!

---

## 🛠️ تفاصيل البناء الفني
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS 4, Motion.
- **Backend**: Express.js server serverless function (`/api/index.ts`).
- **Database**: Cloud Firestore (Firebase) with a local JSON serverless fallback (`/tmp/data-db.json`) if credentials are not provided.
- **Hosting**: Direct deployment compatibility with Vercel and GitHub.
