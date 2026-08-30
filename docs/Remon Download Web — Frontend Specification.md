# Remon Download Web
## Frontend Specification

## 1. Objective

إنشاء Web Frontend حديث باستخدام React، مستوحى من واجهة Remon Download Desktop، ولكن مع إعادة تصميم كاملة لتناسب المتصفح والأجهزة المختلفة.

لا يتم نسخ واجهة Desktop حرفيًا.

---

# 2. Technology Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Zustand عند الحاجة
- i18next
- Lucide React

---

# 3. Responsive Strategy

التصميم يجب أن يكون:

```text
Mobile
   ↓
Tablet
   ↓
Desktop
```

وليس:

```text
Desktop فقط
```

---

# 4. Main Navigation

القائمة الرئيسية المقترحة:

```text
Home
Downloader
History
Favorites
Scheduler
Desktop App
Documentation
About
```

مع:

```text
Language
Theme
```

---

# 5. Home Page

يجب أن تكون الصفحة الرئيسية بسيطة وسريعة.

العناصر الأساسية:

- Logo
- Navigation
- Hero section
- URL input
- Analyze button
- Supported platforms
- Features
- How it works
- Desktop App promotion
- FAQ
- Footer

يجب عدم وضع عناصر كثيرة في الـHero.

---

# 6. Downloader

هذه هي الصفحة الأساسية.

العناصر:

```text
URL Input
Analyze
```

بعد التحليل:

```text
Thumbnail
Title
Channel
Duration

Available Formats

Video
Audio

Quality
Format
Download
```

---

# 7. Download Status

بعد إنشاء Download Job:

```text
Queued
Analyzing
Downloading
Converting
Completed
Failed
Canceled
```

ويظهر:

- Title
- Thumbnail
- Progress
- Speed
- ETA
- Status
- Actions

---

# 8. Browser Notifications

يمكن استخدام:

```text
Toast
```

داخل الموقع.

ويمكن إضافة:

```text
Notification API
```

عند موافقة المستخدم.

لكن يجب ألا يعتمد النظام على Browser Notifications لكي يعمل Download.

---

# 9. History

يجب دعم:

- Search
- Filter
- Pagination
- Re-download
- Delete
- Open details

لا يتم تحميل كل السجل دفعة واحدة.

---

# 10. Favorites

يجب دعم:

- Search
- Filter
- Download
- Delete
- Open details

---

# 11. Scheduler

Web Scheduler مختلف قليلًا عن Desktop.

المستخدم يستطيع:

- Create schedule
- Select URL
- Select quality
- Select date/time
- Enable/disable schedule
- Delete schedule

لكن يجب أن يكون التنفيذ Server-side.

أي أن إغلاق Browser لا يجب أن يوقف Scheduler.

---

# 12. Settings

الإعدادات الخاصة بالويب فقط.

لا يتم نقل إعدادات Windows/Electron مثل:

- System Tray
- Windows startup
- Electron behavior
- Native Windows notifications

يمكن الاحتفاظ بـ:

- Language
- Theme
- Default quality
- Default format
- Notification preference
- Download preferences

---

# 13. Desktop App Page

صفحة منفصلة:

```text
Download Remon Download
```

مع:

```text
Windows
macOS
Linux
```

ويظهر:

- Current version
- Platform
- Architecture
- Size
- Release date
- Download button
- Changelog

---

# 14. SEO

يجب تصميم Frontend بحيث يكون مناسبًا لمحركات البحث.

يشمل:

- Semantic HTML
- Proper headings
- Meta title
- Meta description
- Open Graph
- Canonical URLs
- Sitemap strategy
- Robots strategy
- Structured data حيث يكون مناسبًا

---

# 15. Performance Rules

يجب عدم تحميل:

- ملفات JavaScript ضخمة في الصفحة الرئيسية.
- صور ضخمة بدون حاجة.
- بيانات History كاملة.
- بيانات Favorites كاملة.

استخدام:

```text
Lazy Loading
Code Splitting
Pagination
Optimized Images
```

---

# 16. Frontend API Layer

يجب إنشاء طبقة منفصلة:

```text
src/
├── api/
│   ├── client.ts
│   ├── metadata.ts
│   ├── downloads.ts
│   ├── history.ts
│   ├── favorites.ts
│   ├── scheduler.ts
│   └── settings.ts
```

Components لا تتعامل مباشرة مع `fetch`.

---

# 17. Frontend Structure

```text
frontend/
│
├── src/
│   ├── app/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   ├── api/
│   ├── stores/
│   ├── hooks/
│   ├── i18n/
│   ├── types/
│   ├── utils/
│   └── assets/
│
├── public/
├── tests/
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

# 18. Important Rule

Frontend لا يحتوي:

- yt-dlp
- FFmpeg
- PostgreSQL credentials
- Server secrets
- Database logic

كل ذلك Backend فقط.

---

# 19. Frontend Definition of Done

- [ ] Responsive layout
- [ ] Arabic
- [ ] English
- [ ] RTL
- [ ] LTR
- [ ] Downloader
- [ ] Metadata display
- [ ] Quality selection
- [ ] Download status
- [ ] History
- [ ] Favorites
- [ ] Scheduler UI
- [ ] Settings
- [ ] Desktop App page
- [ ] About
- [ ] Documentation
- [ ] Legal pages
- [ ] SEO foundation
- [ ] AdSense-safe layout