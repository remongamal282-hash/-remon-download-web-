# SaveIt Web — Production Deployment Guide

## Overview

This document provides step-by-step instructions for deploying SaveIt Web to a production environment. SaveIt Web consists of a React frontend, a Fastify REST API backend, and a PostgreSQL database.

## System Requirements

### Server Software

- **Node.js**: v20 or newer (LTS recommended)
- **PostgreSQL**: v13 or newer
- **Operating System**: Linux (Debian/Ubuntu), macOS, or Windows Server 2019+
- **yt-dlp**: Latest version (for download engine)
- **FFmpeg**: Latest version with libmp3lame support (for audio/video processing)

### Hardware Recommendations

- **CPU**: 2+ cores minimum
- **RAM**: 4GB minimum (8GB+ recommended for concurrent downloads)
- **Storage**: SSD with adequate space for media files and temporary files
- **Network**: Stable internet connection for media downloads

## Environment Variables

### Create Backend `.env` File

Before deployment, create a `.env` file in the `backend/` directory with the following required and optional variables:

```bash
# Required: Database Connection
DATABASE_URL=postgresql://user:password@localhost:5432/remon_download

# Required: Security
AUTH_SECRET=your-strong-random-secret-here-minimum-32-characters
NODE_ENV=production

# Required: Server Configuration
PORT=3000
HOST=0.0.0.0

# Required: CORS and Frontend Origin
CORS_ORIGIN=https://yourdomain.com

# Optional: Reverse Proxy Support (true, false, or comma-separated proxy IP/CIDR values)
TRUST_PROXY=true

# Optional: Runtime Tools Paths (defaults to PATH if not specified)
YTDLP_PATH=/usr/bin/yt-dlp
FFMPEG_PATH=/usr/bin/ffmpeg

# Optional: Download Configuration
DOWNLOAD_DIRECTORY=/var/lib/remon-download/media
DOWNLOAD_MAX_CONCURRENT=3
DOWNLOAD_TIMEOUT_MS=3600000

# Optional: Metadata Analysis Configuration
METADATA_TIMEOUT_MS=30000
METADATA_MAX_CONCURRENT=2
```

### Frontend Environment Variables

Create a `.env.production` file in the `frontend/` directory:

```bash
VITE_SITE_URL=https://yourdomain.com
VITE_API_URL=https://yourdomain.com/api
```

## Database Setup

### 1. PostgreSQL Installation

On Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Create Database and User

```bash
sudo -u postgres psql
```

```sql
CREATE USER remon_user WITH PASSWORD 'secure_password_here';
CREATE DATABASE remon_download OWNER remon_user;
GRANT ALL PRIVILEGES ON DATABASE remon_download TO remon_user;
\q
```

### 3. Run Migrations

```bash
cd backend
npm run db:migrate
```

Expected output:
```
Applied migration 001_initial_schema.sql
Applied migration 002_auth_sessions.sql
```

If migrations fail, verify:
- PostgreSQL is running: `sudo systemctl status postgresql`
- DATABASE_URL is correct in `.env`
- User has proper permissions: `psql -U remon_user -d remon_download`

## Building for Production

### Backend Build

```bash
cd backend
npm install
npm run typecheck
npm test
npm run build
```

Output:
- Compiled JavaScript in `backend/dist/`
- TypeScript types checked
- Tests must pass before considering deployment
- Database migrations copied to `dist/database/migrations/`

### Frontend Build

```bash
cd frontend
npm install
npm run build
```

Output:
- Static files in `frontend/dist/`
- SEO files generated (`robots.txt`, `sitemap.xml`)
- Optimized bundle with gzip

## Reverse Proxy Setup

SaveIt Web is designed to run behind a reverse proxy (Nginx, Caddy, or similar).

### Example Nginx Configuration

```nginx
upstream backend {
    server 127.0.0.1:3000;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend static files
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API backend
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;

        # WebSocket and streaming support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Redirect HTTP to HTTPS
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### Example Caddy Configuration

```caddy
yourdomain.com {
    # Frontend
    root /path/to/frontend/dist
    try_files {path} {path}/ /index.html

    # Backend API
    reverse_proxy /api/* 127.0.0.1:3000
}
```

## HTTPS/SSL Setup

**Production MUST use HTTPS.**

### Secure Cookie Configuration

The application automatically enables secure cookies in production:
- `Secure` flag: Cookies only sent over HTTPS
- `HttpOnly` flag: Cookies inaccessible to JavaScript
- `SameSite=lax`: CSRF protection

Verify configuration by checking `NODE_ENV=production` is set.

## Starting the Backend

### Manual Start

```bash
cd backend
NODE_ENV=production npm start
```

Expected output:
```
Server is running at http://0.0.0.0:3000
```

### Systemd Service (Recommended)

Create `/etc/systemd/system/remon-backend.service`:

```ini
[Unit]
Description=SaveIt Web Backend
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=remon
WorkingDirectory=/path/to/backend
EnvironmentFile=/path/to/backend/.env
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable remon-backend
sudo systemctl start remon-backend
sudo systemctl status remon-backend
```

View logs:
```bash
sudo journalctl -u remon-backend -f
```

## Health & Readiness Endpoint

The backend exposes a health check endpoint for monitoring:

```bash
curl http://localhost:3000/api/health
```

Response (OK):
```json
{
  "status": "ok",
  "database": "ok"
}
```

Response (Database Unavailable):
```json
{
  "status": "error",
  "database": "error"
}
```

Use this endpoint for:
- Load balancer health checks
- Monitoring and alerting
- Container orchestration (Docker, Kubernetes)

## Download Directory

The application stores downloaded media files in the directory specified by `DOWNLOAD_DIRECTORY`.

### Directory Setup

```bash
sudo mkdir -p /var/lib/remon-download/media
sudo chown remon:remon /var/lib/remon-download/media
sudo chmod 755 /var/lib/remon-download/media
```

### Cleanup

The application automatically cleans up:
- Orphan `.part` files on startup
- Temporary `.ytdl` metadata files after downloads

**Important**: The application does NOT automatically delete user-downloaded media files.

## Database Backups

### Automated Backup Strategy

Create a backup script `/usr/local/bin/backup-remon.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/remon"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/remon_download_$DATE.sql.gz"

mkdir -p "$BACKUP_DIR"
pg_dump -U remon_user remon_download | gzip > "$BACKUP_FILE"

# Keep last 30 days of backups
find "$BACKUP_DIR" -name "remon_download_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
```

Make executable and add to crontab:
```bash
chmod +x /usr/local/bin/backup-remon.sh
```

Add to `/etc/cron.daily/remon-backup`:
```bash
#!/bin/bash
/usr/local/bin/backup-remon.sh
```

### Restore from Backup

```bash
gunzip < /var/backups/remon/remon_download_20240101_120000.sql.gz | psql -U remon_user remon_download
```

### What to Backup

✅ **Must Backup**:
- PostgreSQL database (contains user accounts, download history, settings)
- `.env` file with AUTH_SECRET

❌ **Do NOT Backup**:
- Media files (use separate storage backup strategy)
- Node modules (`node_modules/`)
- Build artifacts (`dist/`)

## Process Management & Restart

### Graceful Shutdown

The application handles `SIGTERM` and `SIGINT` gracefully:

```bash
sudo systemctl stop remon-backend  # Sends SIGTERM
```

During shutdown:
1. Server stops accepting new requests
2. Database connections are closed safely
3. Process exits cleanly

Shutdown typically completes within 30 seconds.

### Restart Procedure

```bash
sudo systemctl restart remon-backend
sudo systemctl status remon-backend
curl http://localhost:3000/api/health  # Verify health
```

## Logs

### Viewing Logs

```bash
# Real-time logs
sudo journalctl -u remon-backend -f

# Last 100 lines
sudo journalctl -u remon-backend -n 100

# Today's logs
sudo journalctl -u remon-backend --since today
```

### Log Levels

- **info**: Important events, successful operations
- **warn**: Warnings and potential issues
- **error**: Errors that require attention

Production logs do NOT contain:
- Passwords or AUTH_SECRET
- Access tokens
- User email addresses
- Filesystem paths (except download directory)

## Firewall & Network

### Required Ports

- **443** (HTTPS): Reverse proxy to public internet
- **80** (HTTP): Redirect to HTTPS only
- **3000** (Backend): Only accessible from reverse proxy/localhost
- **5432** (PostgreSQL): Only accessible from backend server

### Firewall Rules Example (UFW)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS (reverse proxy)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow PostgreSQL (localhost only)
sudo ufw allow from 127.0.0.1 to 127.0.0.1 port 5432

sudo ufw enable
```

## Monitoring & Alerting

### Key Metrics to Monitor

1. **CPU Usage**: Should not exceed 80% sustained
2. **Memory Usage**: Should not exceed 75% of available
3. **Disk Usage**: Alert if download directory > 90% full
4. **Database Connections**: Monitor pool usage
5. **Request Latency**: Alert if > 5 seconds
6. **Error Rate**: Alert if > 1% of requests fail
7. **Download Success Rate**: Track failures

### Health Check Monitoring

```bash
# Example monitoring script
*/5 * * * * curl -f http://localhost:3000/api/health || systemctl restart remon-backend
```

## Troubleshooting

### Backend won't start

```bash
# Check logs
sudo journalctl -u remon-backend -n 50

# Verify DATABASE_URL
echo $DATABASE_URL

# Test database connection
psql -U remon_user -d remon_download -c "SELECT 1"

# Check Node.js
node --version
```

### High memory usage

```bash
# Check active downloads
curl http://localhost:3000/api/downloads | jq '.data[] | select(.status == "downloading")'

# Check for memory leaks in logs
sudo journalctl -u remon-backend | grep -i memory
```

### Download failures

1. Verify yt-dlp is installed: `which yt-dlp`
2. Verify FFmpeg is installed: `which ffmpeg`
3. Check download directory permissions: `ls -la /var/lib/remon-download/media`
4. Review backend logs for error messages

## Scaling Considerations

### Load Balancing

To run multiple backend instances:

1. Use environment variable `PORT` to run on different ports
2. Configure reverse proxy to load balance:
   ```nginx
   upstream backend {
       server 127.0.0.1:3000;
       server 127.0.0.1:3001;
       server 127.0.0.1:3002;
   }
   ```
3. Ensure all instances share same DATABASE_URL
4. Ensure all instances have same AUTH_SECRET

### Database Optimization

- Monitor query performance: `EXPLAIN ANALYZE <query>`
- Vacuum database regularly: `VACUUM ANALYZE remon_download;`
- Review slow query log in PostgreSQL

### Resource Limits

Default configuration limits:
- **Concurrent Downloads**: 3 (configurable via `DOWNLOAD_MAX_CONCURRENT`)
- **Concurrent Metadata Requests**: 2 (configurable via `METADATA_MAX_CONCURRENT`)
- **Request Timeout**: 1 hour (configurable via `DOWNLOAD_TIMEOUT_MS`)

Adjust based on server resources:
```bash
DOWNLOAD_MAX_CONCURRENT=5  # For high-end servers
METADATA_MAX_CONCURRENT=4
```

## Support & Maintenance

### Regular Tasks

- Weekly: Review backend logs for errors
- Weekly: Verify database backups are working
- Monthly: Test restore from backup
- Monthly: Review and rotate logs
- Quarterly: Update yt-dlp/FFmpeg to latest versions

### Version Updates

To update to a new version:

```bash
git pull origin main
cd backend && npm install && npm run build
cd ../frontend && npm install && npm run build
sudo systemctl restart remon-backend
curl http://localhost:3000/api/health  # Verify
```

## Security Checklist

- [ ] DATABASE_URL uses strong password
- [ ] AUTH_SECRET is random and > 32 characters
- [ ] HTTPS is configured with valid certificate
- [ ] CORS_ORIGIN points to actual domain (not wildcard)
- [ ] NODE_ENV=production
- [ ] TRUST_PROXY=true (if behind reverse proxy)
- [ ] Firewall restricts port 3000 to localhost only
- [ ] PostgreSQL password is strong
- [ ] Database backups are encrypted and stored securely
- [ ] SSH keys are used for server access (no passwords)
- [ ] Regular security updates applied to OS

## Support

For issues, refer to:
- Project documentation: `/docs/`
- Backend tests: `backend/test/`
- API specification: `docs/Remon Download Web — Backend API & Database Specification.md`
