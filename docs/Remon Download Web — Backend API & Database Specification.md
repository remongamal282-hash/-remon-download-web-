# Remon Download Web
## Backend API & Database Specification

# 1. Backend

Technology:

```text
Node.js
TypeScript
Fastify
REST API
PostgreSQL
```

---

# 2. Backend Structure

```text
backend/
│
├── src/
│   ├── app/
│   ├── config/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── workers/
│   ├── queue/
│   ├── database/
│   ├── middleware/
│   ├── plugins/
│   ├── schemas/
│   ├── types/
│   ├── utils/
│   └── server.ts
│
├── tests/
├── migrations/
├── package.json
└── tsconfig.json
```

---

# 3. Layer Responsibilities

## Routes

تعريف HTTP endpoints.

## Controllers

تحويل HTTP request إلى service call.

## Services

Business logic.

## Repositories

Database access.

## Workers

تنفيذ العمليات الطويلة مثل Downloads.

## Queue

إدارة Jobs.

---

# 4. API Structure

Base:

```text
/api
```

Metadata:

```text
POST /api/metadata
```

Downloads:

```text
POST   /api/downloads
GET    /api/downloads
GET    /api/downloads/:id
POST   /api/downloads/:id/pause
POST   /api/downloads/:id/resume
POST   /api/downloads/:id/stop
POST   /api/downloads/:id/cancel
POST   /api/downloads/:id/retry
```

History:

```text
GET    /api/history
DELETE /api/history/:id
POST   /api/history/:id/redownload
```

Favorites:

```text
GET    /api/favorites
POST   /api/favorites
DELETE /api/favorites/:id
```

Scheduler:

```text
GET    /api/schedules
POST   /api/schedules
PATCH  /api/schedules/:id
DELETE /api/schedules/:id
```

Settings:

```text
GET   /api/settings
PATCH /api/settings
```

---

# 5. Long-running Downloads

ممنوع:

```text
POST /download
```

ثم إبقاء HTTP request مفتوحًا حتى ينتهي الفيديو.

بدلًا من ذلك:

```text
POST /api/downloads
```

يرجع:

```json
{
  "id": "job-id",
  "status": "queued"
}
```

ثم Frontend يتابع الحالة.

---

# 6. Download Worker

Worker مسؤول عن:

```text
yt-dlp
   ↓
FFmpeg
   ↓
Output
```

ويقوم بتحديث:

```text
status
progress
speed
eta
error
completedAt
```

في Database.

---

# 7. Queue

في البداية يمكن تنفيذ Queue داخل Backend/Worker architecture.

عند زيادة الاستخدام يمكن الانتقال إلى Queue infrastructure مخصصة دون تغيير API.

الهدف هو أن يكون:

```text
API
```

مستقلًا عن:

```text
Download Worker
```

---

# 8. PostgreSQL

الجداول الأساسية المقترحة:

## users

```text
id
email
password_hash
created_at
updated_at
```

Authentication لا يجب فرضه من اليوم الأول إذا لم يكن مطلوبًا.

---

## downloads

```text
id
user_id
url
title
thumbnail_url
status
quality
format
progress
speed
eta
output_path
error
created_at
started_at
completed_at
```

---

## favorites

```text
id
user_id
url
title
thumbnail_url
created_at
```

---

## history

```text
id
user_id
download_id
url
title
thumbnail_url
status
created_at
```

---

## schedules

```text
id
user_id
url
quality
format
scheduled_at
enabled
created_at
updated_at
last_triggered_at
```

---

## settings

```text
id
user_id
default_quality
default_format
language
theme
notifications_enabled
created_at
updated_at
```

---

# 9. Indexing

يجب إنشاء Indexes للبيانات التي يتم البحث فيها كثيرًا.

مثل:

```text
users.email
downloads.user_id
downloads.status
history.user_id
favorites.user_id
schedules.scheduled_at
```

Search fields يمكن تحسينها لاحقًا حسب الاستخدام الفعلي.

---

# 10. Security

يجب استخدام:

- Environment variables
- Database credentials خارج Git
- HTTPS
- CORS
- Rate limiting
- Input validation
- SQL parameterization
- Secure headers

مثال Environment:

```text
DATABASE_URL
PORT
CORS_ORIGIN
```

لا يتم وضع secrets في Frontend.

---

# 11. yt-dlp Security

لا يتم إنشاء shell command من User input.

الصحيح:

```text
spawn(
    ytDlpPath,
    args
)
```

وليس:

```text
exec("yt-dlp " + userUrl)
```

---

# 12. Rate Limiting

Downloader يمكن أن يكون مكلفًا جدًا.

لذلك يجب تطبيق Rate Limit على:

```text
/api/metadata
/api/downloads
```

والـlimits يمكن تعديلها بعد مراقبة الاستخدام الحقيقي.

---

# 13. Resource Protection

Backend يجب ألا يسمح بعدد غير محدود من Downloads.

يجب أن يكون هناك:

```text
Maximum concurrent downloads
```

مع Queue.

---

# 14. Scheduler

Scheduler يعمل في Backend وليس Frontend.

حتى لو أغلق المستخدم:

```text
Browser
```

يظل Scheduler يعمل.

---

# 15. Error Handling

كل API يجب أن يعيد errors منظمة.

مثال:

```json
{
  "error": {
    "code": "METADATA_FAILED",
    "message": "Unable to analyze the URL."
  }
}
```

لا يتم إرسال:

- Stack traces
- Internal paths
- Database errors
- Secrets

إلى المستخدم.

---

# 16. Database Safety

Database migrations يجب أن تكون منظمة.

مثال:

```text
migrations/
├── 001_initial_schema
├── 002_add_download_status
└── 003_add_scheduler
```

لا يتم تعديل Production Database يدويًا بدون migration.

---

# 17. Backend Performance

يجب:

- استخدام PostgreSQL connection pool.
- عدم تنفيذ عمليات CPU-heavy داخل API process إذا كانت طويلة.
- فصل Workers مستقبلًا.
- استخدام caching عند الحاجة.
- استخدام pagination.
- عدم تحميل آلاف records في Request واحد.

---

# 18. Production Architecture

البنية المبدئية:

```text
                  Internet
                     │
                     ▼
                HTTPS / CDN
                     │
             ┌───────┴───────┐
             │               │
             ▼               ▼
        React Frontend    Fastify API
                             │
                  ┌──────────┼──────────┐
                  │          │          │
                  ▼          ▼          ▼
             PostgreSQL    Queue      Workers
                                      │
                                ┌─────┴─────┐
                                ▼           ▼
                             yt-dlp      FFmpeg
```

---

# 19. Scaling

في البداية:

```text
1 VPS
```

لكن يجب أن يكون التصميم قابلًا للتوسع إلى:

```text
Load Balancer
      │
 ┌────┼────┐
 ▼    ▼    ▼
API  API  API
 │
 ▼
Queue
 │
 ├── Worker
 ├── Worker
 └── Worker
      │
      ▼
 PostgreSQL
```

---

# 20. Important Rule

لا يتم وضع:

```text
yt-dlp
FFmpeg
Database
Worker
```

داخل React.

React يتعامل مع API فقط.

---

# 21. Backend Definition of Done

- [ ] Fastify configured
- [ ] PostgreSQL connected
- [ ] Migrations configured
- [ ] REST API structure
- [ ] Metadata endpoint
- [ ] Download Job endpoint
- [ ] Queue
- [ ] Worker
- [ ] yt-dlp integration
- [ ] FFmpeg integration
- [ ] History
- [ ] Favorites
- [ ] Scheduler
- [ ] Settings
- [ ] Validation
- [ ] Rate limiting
- [ ] Error handling
- [ ] Logging
- [ ] Security headers
- [ ] Production configuration
- [ ] Automated tests