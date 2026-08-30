# Phase 7 Download Engine

## Scope

Phase 7 adds authenticated download job creation and lifecycle control. It does not implement Scheduler, Notifications, Favorites, History business logic, or later phases.

## Architecture

`downloads` routes use `DownloadService`, which validates ownership and state transitions, persists through `DownloadRepository`, and queues asynchronous work in the bounded in-process `DownloadQueue`. `DownloadEngine` invokes yt-dlp with `spawn`, `shell: false`, and argument arrays, then stores media outside the source/runtime directories.

## Endpoints

- `POST /api/downloads`
- `GET /api/downloads`
- `GET /api/downloads/:id`
- `POST /api/downloads/:id/pause`
- `POST /api/downloads/:id/resume`
- `POST /api/downloads/:id/stop`
- `POST /api/downloads/:id/cancel`
- `POST /api/downloads/:id/retry`

All endpoints require the Phase 5 HTTP-only authenticated session and enforce `user_id` ownership.

## Runtime configuration

- `YTDLP_PATH`: configured yt-dlp executable; production can resolve from `process.resourcesPath/runtime`.
- `FFMPEG_PATH`: configured FFmpeg executable; no binaries are downloaded automatically.
- `DOWNLOAD_DIRECTORY`: user-accessible media directory, defaulting to the local application data directory.
- `DOWNLOAD_MAX_CONCURRENT`: queue concurrency, default `3`.
- `DOWNLOAD_TIMEOUT_MS`: process timeout, default one hour.

## Lifecycle and safety

Jobs use the database status enum and reject invalid transitions. Pause keeps yt-dlp continuation files, resume continues the same job where supported, stop terminates the active process and marks it failed, cancel terminates and cleans temporary files, and retry is limited to failed jobs. API errors remain generic and never expose process output or filesystem paths.