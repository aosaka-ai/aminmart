# AminMart Website Specifications | مواصفات موقع أمين مارت

This document outlines the full functional and technical specifications of the AminMart e-commerce application.
توضح هذه الوثيقة المواصفات الوظيفية والفنية الكاملة لتطبيق التجارة الإلكترونية "أمين مارت".

---

## 1. Overview | نظرة عامة
**English:** AminMart is a modern full-stack web application designed for retail groceries and household goods. It provides a seamless shopping experience for customers and a robust management dashboard for administrators.
**بالعربية:** "أمين مارت" هو تطبيق ويب حديث متكامل مصمم لتجارة التجزئة في المواد الغذائية والسلع المنزلية. يوفر تجربة تسوق سلسة للعملاء ولوحة تحكم قوية للمسؤولين.

---

## 2. User Roles | أدوار المستخدمين
### A. Customer | العميل
- **Registration & Login:** Secure authentication via Firebase (Email/Google).
- **Profile Management:** Edit personal info, addresses, and view order history.
- **Verification:** Identity verification process via email/SMS link.
- **التسجيل والدخول:** مصادقة آمنة عبر Firebase.
- **إدارة الملف الشخصي:** تعديل المعلومات الشخصية والعناوين وعرض سجل الطلبات.
- **التحقق:** عملية التحقق من الهوية عبر رابط البريد الإلكتروني.

### B. Administrator/Staff | المدير والموظفون
- **Inventory Management:** Full control over products, categories, and stock.
- **Order Processing:** Monitor and update order statuses (Pending -> Delivered).
- **Customer Insights:** View registered customers and their spending patterns.
- **Reports:** Analyze revenue, profit (based on cost vs. retail price), and best-selling items.
- **إدارة المخزون:** تحكم كامل في المنتجات والفئات والمخزون.
- **معالجة الطلبات:** مراقبة وتحديث حالات الطلب (قيد الانتظار -> تم التوصيل).
- **بيانات العملاء:** عرض العملاء المسجلين وأنماط إنفاقهم.
- **التقارير:** تحليل الإيرادات والأرباح (بناءً على التكلفة مقابل سعر البيع) والأصناف الأكثر مبيعًا.

---

## 3. Key Features | الميزات الرئيسية

### Shopping Experience | تجربة التسوق
- **Dynamic Search:** Global search bar in the navbar to find products by name or company.
- **Product Details Dialog:** View company branding, full specifications, and high-quality images.
- **Smart Cart:** Supports both unit-based items (pc) and weighted items (gm/kg). 
- **Stock Guard:** Prevents customers from adding more than the current available stock.
- **البحث الديناميكي:** شريط بحث عالمي في القائمة الرئيسية للعثور على المنتجات بالاسم أو الشركة.
- **نافذة تفاصيل المنتج:** عرض العلامة التجارية للشركة والمواصفات الكاملة وصور عالية الجودة.
- **السلة الذكية:** تدعم المنتجات بالقطعة والمنتجات التي تباع بالوزن (جرام/كيلو).
- **حماية المخزون:** يمنع العملاء من إضافة كميات أكبر من المخزون المتاح حالياً.

### Administrative Control | الرقابة الإدارية
- **Categorized Inventory:** Products are automatically grouped by category for easy navigation.
- **Cost Analysis:** Admin can set "Cost Price" to automatically calculate real profits in reports.
- **Media Cleanup:** Automatic deletion of images from Cloudinary when a product/category is removed.
- **Staff Registry:** Management of administrative credentials separate from public customer accounts.
- **المخزون المصنف:** يتم تجميع المنتجات تلقائياً حسب الفئة لسهولة التصفح.
- **تحليل التكاليف:** يمكن للمدير تحديد "سعر التكلفة" لحساب الأرباح الحقيقية تلقائياً في التقارير.
- **تنظيف الوسائط:** حذف تلقائي للصور من Cloudinary عند إزالة منتج أو فئة.
- **سجل الموظفين:** إدارة بيانات دخول الموظفين بشكل منفصل عن حسابات العملاء العامة.

---

## 4. Technical Stack | المكونات التقنية
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Motion (Animations).
- **Backend/API:** Node.js Express Server (for secure Cloudinary operations).
- **Database:** Firebase Firestore (Real-time NoSQL).
- **Authentication:** Firebase Auth.
- **Asset Storage:** Cloudinary (Secure image hosting).
- **الواجهة الأمامية:** React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Motion.
- **الواجهة الخلفية:** خادم Node.js Express (للعمليات الآمنة مع Cloudinary).
- **قاعدة البيانات:** Firebase Firestore (قاعدة بيانات في الوقت الفعلي).
- **المصادقة:** Firebase Auth.
- **تخزين الملفات:** Cloudinary (استضافة صور آمنة).

---

## 5. Data Invariants | قواعد البيانات الثابتة
- **Weights:** Base unit for weighted items is 250gm; conversions to KG are handled automatically.
- **Pricing:** All retail operations use EGP (Egyptian Pound).
- **Security:** Firestore Security Rules (ABAC) prevent unauthorized access to customer PII or admin data.
- **الأوزان:** الوحدة الأساسية للمنتجات الموزونة هي 250 جرام؛ ويتم التحويل إلى كيلوجرام تلقائياً.
- **التسعير:** جميع عمليات البيع بالتجزئة تستخدم الجنيه المصري (EGP).
- **الأمان:** قواعد أمان Firestore تمنع الوصول غير المصرح به لبيانات العملاء أو بيانات الإدارة.

---

*Generated for AminMart - 2026*
*تم إنشاؤه لأمين مارت - 2026*
