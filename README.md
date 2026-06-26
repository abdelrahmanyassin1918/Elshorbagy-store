---
title: Elshorbagy Store
emoji: 🛍️
colorFrom: green
colorTo: emerald
sdk: docker
app_port: 7860
pinned: false
---

# متجر الشوربجي (Elshorbagy Store) 🛒

متجر إلكتروني حديث وسريع مخصص لمتجر الشوربجي، تم بناؤه باستخدام **React** و**TypeScript** و**Tailwind CSS** مع واجهة خلفية مبنية على **Express.js**.

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

## 🌐 الربط مع GitHub و Hugging Face (مزامنة التعديلات تلقائياً)

لكي تظهر التعديلات التي تقوم بعملها من الفيجوال ستوديو (VS Code) للمستخدمين مباشرة على موقع Hugging Face، اتبع هذه الخطوات بدقة:

### 1. ربط المشروع بمستودع GitHub الخاص بك لأول مرة
إذا كنت لم تربط المجلد المحلي بجيت هاب بعد، أو تريد تعديل الرابط الخاطئ، اكتب الأوامر التالية في الـ Terminal:

```bash
# 1. تهيئة مستودع جيت محلي
git init

# 2. إضافة جميع الملفات للتجهيز
git add .

# 3. عمل حفظ (Commit) للتغييرات
git commit -m "تحديث واجهة المتجر وإضافة ميزات جديدة"

# 4. تغيير اسم الفرع الافتراضي إلى main
git branch -M main

# 5. ربط المجلد المحلي برابط المستودع الخاص بك على جيت هاب (استبدل الرابط أدناه برابط مستودعك الفعلي!)
git remote add origin https://github.com/abdelrahmanyassin1918/Elshorbagy-Store.git

# ملاحظة: إذا كان هناك ريموت قديم وتريد تغييره، اكتب أولاً:
# git remote remove origin
# ثم أعد كتابة الأمر رقم 5 بالرابط الصحيح.
```

### 2. إعداد مفتاح المزامنة (Secret Token) على GitHub
لكي يقوم GitHub بنشر التعديلات تلقائياً إلى Hugging Face عند كل `git push`:
1. اذهب إلى صفحة مستودعك على **GitHub**.
2. اضغط على **Settings** ⚙️ ثم اختر من القائمة الجانبية **Secrets and variables** -> **Actions**.
3. اضغط على زر **New repository secret**.
4. في خانة **Name** اكتب: `HF_TOKEN`
5. في خانة **Value** ضع كود الـ **Write Access Token** الذي جلبته من حسابك على Hugging Face (من إعدادات حسابك Access Tokens).
6. اضغط **Add secret**.

### 3. رفع التعديلات (Git Push) لتعمل المزامنة الفورية
الآن، في أي وقت تقوم فيه بالتعديل على الأكواد وتريد رفعها لتعمل مباشرة، اكتب الأوامر الثلاثة التالية فقط:
```bash
git add .
git commit -m "تعديل واجهة المتجر"
git push origin main
```
سيقوم الـ **GitHub Action** بتلقي الكود وبنائه ورفعه تلقائياً لـ Hugging Face خلال دقائق معدودة!

---

## 🛠️ تفاصيل البناء الفني
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS 4, Motion.
- **Backend**: Express.js server in `server.ts` compiled with `esbuild`.
- **Database**: Cloud Firestore (Firebase) with a local filesystem fallback (`data-db.json`) if credentials are not provided.
- **Hosting**: Docker-ready container running Node.js 20-alpine.
