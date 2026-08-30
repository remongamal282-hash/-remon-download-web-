# Remon Download Web
## Project Structure & Architecture

### 1. Project Overview

Remon Download Web هو الإصدار الويب من Remon Download.

المشروع منفصل تمامًا عن تطبيق Desktop الحالي، ولا يعتمد على Electron أو Windows APIs.

الهدف هو إنشاء موقع Web حديث يسمح للمستخدم بـ:

- تحليل روابط الفيديو.
- اختيار الجودة والصيغة.
- إنشاء عمليات تحميل.
- متابعة حالة التحميل.
- دعم الفيديوهات العادية.
- دعم Shorts.
- دعم Playlists.
- توفير تجربة عربية وإنجليزية.
- توفير صفحة لتحميل تطبيق Remon Download Desktop.
- عرض معلومات المشروع والمطور.
- تحقيق الدخل مستقبلًا باستخدام Google AdSense.

---

# 2. Architecture

المشروع يتكون من ثلاثة أجزاء رئيسية:

```text
remon-download-web/
│
├── frontend/
│
├── backend/
│
└── docs/
```

Frontend وBackend مشروعان منفصلان منطقيًا وتقنيًا.

```text
User Browser
     │
     ▼
React Frontend
     │
     │ HTTPS REST API
     ▼
Fastify Backend
     │
     ├── PostgreSQL
     │
     ├── Download Queue
     │
     ├── yt-dlp
     │
     └── FFmpeg
```

---

# 3. Frontend

## Technology

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Zustand عند الحاجة
- i18next
- Lucide React

Frontend مسؤول عن:

- UI
- Routing
- Forms
- URL submission
- Metadata display
- Quality selection
- Download status
- User settings
- Language switching
- Responsive design
- Ads placement

Frontend لا ينفذ yt-dlp أو FFmpeg مباشرة.

Frontend لا يتصل مباشرة بـ PostgreSQL.

Frontend يتعامل فقط مع REST API.

---

# 4. Backend

## Technology

- Node.js
- TypeScript
- Fastify
- REST API

Backend مسؤول عن:

- API
- Authentication إذا تم إضافتها مستقبلًا
- URL validation
- Metadata extraction
- Download jobs
- Queue management
- Scheduler عند الحاجة
- yt-dlp
- FFmpeg
- Database access
- Rate limiting
- Security
- Logging
- Error handling

Backend هو الطبقة الوحيدة التي تتعامل مع:

- PostgreSQL
- yt-dlp
- FFmpeg
- Server filesystem

---

# 5. Database

Database:

```text
PostgreSQL
```

لا يتصل بها Frontend مباشرة.

Backend فقط هو المسؤول عن Database access.

الجداول الأساسية المقترحة:

```text
users
downloads
download_items
favorites
history
schedules
settings
```

يمكن إضافة جداول أخرى لاحقًا إذا احتاجت Architecture ذلك.

---

# 6. Download Architecture

لا يجب تنفيذ Download داخل HTTP request طويل.

العملية الصحيحة:

```text
POST /api/downloads
        │
        ▼
Create Download Job
        │
        ▼
Queue
        │
        ▼
Worker
        │
        ├── yt-dlp
        │
        └── FFmpeg
        │
        ▼
Update Database
        │
        ▼
Frontend polls / receives status
```

الهدف هو منع:

- HTTP timeout
- تجمد Backend
- تجمد Frontend
- استهلاك connection طويل
- انهيار الطلب عند تحميل ملف كبير

---

# 7. Queue

يجب أن تكون عمليات التحميل Queue-based.

مثال:

```text
QUEUED
   ↓
ANALYZING
   ↓
DOWNLOADING
   ↓
CONVERTING
   ↓
COMPLETED
```

وفي حالات الخطأ:

```text
FAILED
RETRYING
CANCELED
```

يجب ألا يعتمد النظام على Request واحد مفتوح طوال مدة التحميل.

---

# 8. Frontend Download Flow

```text
User enters URL
        ↓
POST /api/metadata
        ↓
Backend analyzes URL
        ↓
Metadata returned
        ↓
Frontend displays:
    - Thumbnail
    - Title
    - Duration
    - Available qualities
    - Formats
        ↓
User selects quality
        ↓
POST /api/downloads
        ↓
Backend creates Job
        ↓
Frontend receives Job ID
        ↓
Frontend monitors status
```

---

# 9. API Communication

كل الاتصالات بين Frontend وBackend تكون عبر HTTPS.

مثال:

```text
https://api.example.com/api/...
```

Frontend:

```text
https://www.example.com
```

Backend:

```text
https://api.example.com
```

يفضل فصل الـdomains/subdomains بهذا الشكل بدل تشغيل Backend داخل نفس تطبيق React.

---

# 10. Notifications

Desktop Notifications الخاصة بـ Electron لن يتم نقلها كما هي إلى Web.

في Web يمكن استخدام:

- UI Toast
- Browser Notifications عند توفر Permission
- Download status indicator
- Notification center داخل الموقع

لكن Browser Notification ليست بديلًا مضمونًا لـ Windows Electron Toast.

لذلك:

```text
Desktop App
→ Electron Notification

Web App
→ Web Notification / Toast
```

---

# 11. Desktop Download Section

الموقع سيحتوي على قسم:

```text
Download Remon Download
```

يحتوي على:

- Windows
- macOS
- Linux

مع معلومات:

- Version
- Architecture
- File size
- Release date
- Changelog
- Download button

ويظل Desktop App مشروعًا منفصلًا عن Web Backend.

---

# 12. Web Pages

الهيكل المقترح:

```text
/
├── Home
├── Downloader
├── Downloads
├── History
├── Favorites
├── Scheduler
├── Settings
├── Desktop App
├── About
├── Documentation
├── Privacy Policy
├── Terms of Service
└── Contact
```

ليس مطلوبًا نقل كل صفحات Desktop حرفيًا.

يجب إعادة تصميم تجربة الاستخدام لتكون مناسبة للويب.

---

# 13. UI Design

يتم الاحتفاظ بهوية Remon Download الأساسية:

- Dark Theme
- Light Green Accent
- Modern Cards
- Rounded Components
- Clean Dashboard
- Arabic / English

لكن التصميم يجب أن يصبح:

```text
Desktop-first
        ↓
Web-first
        ↓
Responsive
```

ويجب أن يعمل على:

- Desktop
- Laptop
- Tablet
- Mobile

---

# 14. AdSense

AdSense يجب أن يكون جزءًا من تصميم الموقع، وليس عنصرًا يتم إضافته عشوائيًا بعد الانتهاء.

يجب ترك أماكن مناسبة للإعلانات مثل:

```text
Header
Content Area
Between Sections
Sidebar
Footer
```

لكن لا يجب وضع الإعلانات بطريقة تؤثر على:

- Downloader
- Buttons
- URL input
- Download status
- User experience

كما يجب إنشاء صفحات قانونية مناسبة قبل التقديم إلى AdSense:

```text
Privacy Policy
Terms of Service
Cookie Policy
About
Contact
```

---

# 15. Performance

الهدف الأساسي:

> لا يجب أن يؤدي تحميل أو تحليل فيديو إلى تجميد الموقع أو تعطيل API.

لذلك:

### Frontend

- Code splitting
- Lazy loading
- Image optimization
- Pagination
- Debounced search
- Minimal initial JavaScript
- Avoid unnecessary global state

### Backend

- Fastify
- Async processing
- Queue
- Worker architecture
- Database connection pool
- Rate limiting
- Caching حيث يكون مناسبًا

### Downloads

لا يتم تنفيذ Downloads داخل request lifecycle.

---

# 16. Security

Backend يجب أن يحتوي على:

- HTTPS
- CORS policy
- Rate limiting
- Input validation
- URL validation
- Request size limits
- Error sanitization
- Secure headers
- Database parameterization
- No shell concatenation
- Child process arguments array

يجب الحفاظ على نفس مبدأ الأمان المستخدم في Desktop:

```text
spawn(command, args)
```

بدل:

```text
shell command string
```

---

# 17. Logging

Backend يحتاج إلى logging واضح:

```text
INFO
WARN
ERROR
DEBUG
```

لكن لا يجب تسجيل:

- Passwords
- Tokens
- Sensitive user data
- Full private URLs إذا كانت تحتوي بيانات حساسة

---

# 18. Deployment

الـFrontend والـBackend يمكن نشرهما بشكل منفصل.

مثال:

```text
Frontend
    ↓
CDN / Static Hosting

Backend
    ↓
Linux Server

Database
    ↓
PostgreSQL
```

ويفضل أن يكون PostgreSQL منفصلًا منطقيًا عن ملفات التطبيق.

---

# 19. Scalability

البنية يجب أن تسمح مستقبلًا بـ:

```text
Frontend
     │
     ▼
Load Balancer
     │
     ├── API Server 1
     ├── API Server 2
     └── API Server 3
              │
              ▼
           Queue
              │
       ┌──────┼──────┐
       ▼      ▼      ▼
    Worker Worker Worker
       │      │      │
       └──────┼──────┘
              ▼
         PostgreSQL
```

لا نحتاج هذه البنية من اليوم الأول، لكن Architecture يجب ألا تمنعها.

---

# 20. Initial Server Strategy

في البداية لا نحتاج بنية ضخمة.

الأفضل:

```text
1 Linux VPS
+
PostgreSQL
+
Backend
+
Download Workers
+
Reverse Proxy
```

ثم تتم زيادة الموارد عند زيادة الاستخدام.

---

# 21. Important Architecture Rule

لا يتم خلط:

```text
Frontend
Backend
Database
Download Worker
```

داخل ملفات أو طبقات واحدة.

كل طبقة لها مسؤولية واضحة.

---

# 22. Development Order

التنفيذ لا يبدأ ببناء كل الصفحات مباشرة.

الترتيب:

```text
Phase 0
Documentation & Architecture

        ↓

Phase 1
Frontend Foundation

        ↓

Phase 2
Backend Foundation

        ↓

Phase 3
Database

        ↓

Phase 4
Metadata API

        ↓

Phase 5
Download Queue

        ↓

Phase 6
Frontend ↔ API Integration

        ↓

Phase 7
History / Favorites / Settings

        ↓

Phase 8
Scheduler

        ↓

Phase 9
Authentication (if required)

        ↓

Phase 10
Security / Performance

        ↓

Phase 11
AdSense / SEO / Legal Pages

        ↓

Phase 12
Production Deployment

        ↓

Phase 13
Final Release Verification
```

---

# 23. Core Principle

Remon Download Web ليس مجرد تحويل Electron إلى Browser.

بل هو:

```text
Remon Download
        │
        ├── Desktop Application
        │
        └── Web Application
```

والاثنان يمكن أن يشتركا مستقبلًا في بعض المفاهيم والخدمات، لكنهما ليسا مشروعًا واحدًا.

---

# 24. Definition of Done — Architecture

لا نبدأ Production Development قبل تحقق:

- [ ] Architecture approved
- [ ] Frontend structure approved
- [ ] Backend structure approved
- [ ] Database schema approved
- [ ] API conventions approved
- [ ] Download queue design approved
- [ ] Security rules approved
- [ ] Deployment strategy approved
- [ ] AdSense strategy approved
- [ ] Documentation structure approved

---

# 25. Rule for AI Coding Agents

AI coding agents يجب ألا:

- يقوموا بأي Git operations.
- يقوموا بـ `git add`.
- يقوموا بـ `git commit`.
- يقوموا بـ `git push`.
- يقوموا بإنشاء branches.
- يقوموا بتغيير Architecture دون موافقة.
- يقوموا بإعادة كتابة أجزاء خارج نطاق Phase الحالية.

Git operations تتم يدويًا بواسطة صاحب المشروع.

---

# 26. Current Decision

### Frontend

React + TypeScript + Vite + Tailwind

### Backend

Fastify + TypeScript + REST API

### Database

PostgreSQL

### Architecture

Separated Frontend / Backend

### Download Engine

yt-dlp + FFmpeg

### Deployment

Linux VPS

### Web Identity

Remon Download

### Languages

Arabic + English

### UI

Dark + Green Remon Download identity

### Monetization

Google AdSense

### Desktop Downloads

Windows + macOS + Linux

### Initial Goal

Fast, stable, scalable Web Downloader without blocking the browser or API.