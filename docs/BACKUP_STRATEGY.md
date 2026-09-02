# SaveIt Web — Backup & Disaster Recovery Strategy

## Overview

This document describes the recommended backup and recovery strategy for SaveIt Web production deployments.

## What to Backup vs. What NOT to Backup

### ✅ MUST Backup

1. **PostgreSQL Database**
   - Contains all user data (accounts, downloads, history, favorites, settings, scheduler)
   - Essential for system recovery
   - Loss = complete data loss for all users

2. **Environment Configuration**
   - `.env` file with AUTH_SECRET and DATABASE_URL
   - Essential for recovery
   - Must be stored separately and securely (encrypted)

3. **User Media Files** (Optional but Recommended)
   - Downloaded media in `DOWNLOAD_DIRECTORY`
   - May contain user content
   - Consider storage costs vs. recovery needs

### ❌ DO NOT Backup

1. **Application Code**
   - Stored in Git repository
   - Can be deployed from version control

2. **Node Modules**
   - Dependencies can be reinstalled via `npm install`
   - Wastes storage space

3. **Build Artifacts**
   - `backend/dist/`
   - `frontend/dist/`
   - Can be rebuilt from source

4. **Temporary Files**
   - `.part` files
   - `.ytdl` metadata files
   - Logs (beyond retention period)

## Backup Strategy

### Database Backups (Critical)

PostgreSQL database is the critical production asset. Use `pg_dump` for reliable backups.

#### Backup Frequency
- **Production**: Every 6 hours (4 backups/day)
- **Staging**: Daily
- **Development**: As needed

#### Retention Policy
- Keep last 30 backups (roughly 7.5 days of 6-hourly backups)
- Archive older backups to cold storage for 90 days
- Delete backups older than 90 days

#### Backup Script

Create `/usr/local/bin/remon-backup.sh`:

```bash
#!/bin/bash

set -e

# Configuration
BACKUP_DIR="/var/backups/remon-download"
DATABASE_NAME="remon_download"
DATABASE_USER="remon_user"
MAX_BACKUPS=30
LOG_FILE="/var/log/remon-backup.log"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/remon_download_${TIMESTAMP}.sql.gz"

echo "[$(date)] Starting database backup..." >> "$LOG_FILE"

# Perform backup
if pg_dump -U "$DATABASE_USER" "$DATABASE_NAME" | gzip > "$BACKUP_FILE"; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "[$(date)] Backup successful: $BACKUP_FILE ($BACKUP_SIZE)" >> "$LOG_FILE"
else
    echo "[$(date)] BACKUP FAILED" >> "$LOG_FILE"
    exit 1
fi

# Cleanup old backups
echo "[$(date)] Cleaning up old backups (keeping last $MAX_BACKUPS)..." >> "$LOG_FILE"
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/remon_download_*.sql.gz | wc -l)
if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
    BACKUPS_TO_DELETE=$((BACKUP_COUNT - MAX_BACKUPS))
    ls -1tr "$BACKUP_DIR"/remon_download_*.sql.gz | head -n "$BACKUPS_TO_DELETE" | xargs rm -f
    echo "[$(date)] Deleted $BACKUPS_TO_DELETE old backups" >> "$LOG_FILE"
fi

echo "[$(date)] Backup process completed" >> "$LOG_FILE"
```

Make executable:
```bash
chmod +x /usr/local/bin/remon-backup.sh
```

#### Cron Schedule (Every 6 hours)

Add to `/etc/cron.d/remon-backup`:

```bash
# Run database backup every 6 hours (0, 6, 12, 18)
0 0,6,12,18 * * * root /usr/local/bin/remon-backup.sh
```

Or using systemd timer (more reliable):

Create `/etc/systemd/system/remon-backup.service`:
```ini
[Unit]
Description=SaveIt Web Database Backup
After=postgresql.service

[Service]
Type=oneshot
ExecStart=/usr/local/bin/remon-backup.sh
User=root
StandardOutput=journal
StandardError=journal
```

Create `/etc/systemd/system/remon-backup.timer`:
```ini
[Unit]
Description=SaveIt Web Backup Timer
Requires=remon-backup.service

[Timer]
OnBootSec=10min
OnUnitActiveSec=6h

[Install]
WantedBy=timers.target
```

Enable timer:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now remon-backup.timer
sudo systemctl status remon-backup.timer
```

### Environment Configuration Backups

The `.env` file contains secrets and must be backed up securely.

#### Secure Backup Process

```bash
# Create encrypted backup
sudo openssl enc -aes-256-cbc -salt -in /path/to/backend/.env -out /path/to/backups/.env.enc

# Store password securely (write to secure location, NOT in code)
# Example: Print to console for manual recording
openssl enc -aes-256-cbc -P -pass file:/dev/stdin <<< "your-secure-password"
```

#### Recovery Process

```bash
# Decrypt backup
openssl enc -d -aes-256-cbc -in /path/to/backups/.env.enc -out /path/to/backend/.env
```

### Media Files Backup (Optional)

If backing up user-downloaded media:

```bash
#!/bin/bash
# Backup media files to external storage
MEDIA_DIR="/var/lib/remon-download/media"
BACKUP_DIR="/mnt/media-backup"

mkdir -p "$BACKUP_DIR"

# Incremental backup (only changed files)
rsync -av --delete "$MEDIA_DIR/" "$BACKUP_DIR/media/"

echo "Media backup completed: $(du -sh $BACKUP_DIR/media)"
```

## Recovery Procedures

### Database Recovery

#### Complete Restore from Latest Backup

```bash
# 1. Stop the backend application
sudo systemctl stop remon-backend

# 2. Drop existing database (DESTRUCTIVE - verify first!)
sudo -u postgres psql -c "DROP DATABASE remon_download;"

# 3. Create fresh database
sudo -u postgres psql -c "CREATE DATABASE remon_download OWNER remon_user;"

# 4. Restore from backup
gunzip < /var/backups/remon-download/remon_download_LATEST.sql.gz | \
  sudo -u postgres psql -d remon_download

# 5. Verify restoration
sudo -u postgres psql -d remon_download -c "SELECT COUNT(*) FROM schema_migrations;"

# 6. Start backend
sudo systemctl start remon-backend

# 7. Verify health
curl http://localhost:3000/api/health
```

#### Point-in-Time Recovery

If you need data from a specific time:

```bash
# 1. Identify correct backup file from timestamp
ls -la /var/backups/remon-download/remon_download_*.sql.gz

# 2. Follow database recovery steps above with specific backup
gunzip < /var/backups/remon-download/remon_download_20240615_120000.sql.gz | \
  sudo -u postgres psql -d remon_download
```

#### Verify Backup Integrity

```bash
# Test backup file is valid (without restoring)
gunzip -t /var/backups/remon-download/remon_download_LATEST.sql.gz
echo $?  # Returns 0 if valid

# List tables in backup
gunzip < /var/backups/remon-download/remon_download_LATEST.sql.gz | \
  grep "^CREATE TABLE" | wc -l
```

### Environment Configuration Recovery

```bash
# Decrypt and restore
openssl enc -d -aes-256-cbc -in /path/to/backups/.env.enc -out /path/to/backend/.env
sudo chown remon:remon /path/to/backend/.env
sudo chmod 600 /path/to/backend/.env
```

### Application Recovery

If application code is corrupted or needs rollback:

```bash
# 1. Clone from Git
cd /opt/remon-download
git fetch origin
git checkout main  # or specific commit

# 2. Rebuild
cd backend && npm install && npm run build
cd ../frontend && npm install && npm run build

# 3. Restart
sudo systemctl restart remon-backend

# 4. Run migrations if needed
cd backend && npm run db:migrate
```

## Backup Storage

### Local Storage

**Minimum**: Store backups on separate filesystem from production

```
/var/backups/remon-download/  ← Separate mount point recommended
├── remon_download_20240614_000000.sql.gz
├── remon_download_20240614_060000.sql.gz
└── ...
```

**Retention**: Keep last 30 backups (7.5 days of 6-hourly)

### Remote/Cloud Storage (Recommended for Production)

#### Sync to S3-Compatible Storage

```bash
#!/bin/bash
# Sync daily backups to S3
AWS_ACCESS_KEY_ID="your-key" \
AWS_SECRET_ACCESS_KEY="your-secret" \
aws s3 sync /var/backups/remon-download \
  s3://remon-backups/production/database \
  --delete \
  --sse AES256

# Keep older backups in glacier for archival
aws s3 lifecycle put-bucket-lifecycle-configuration \
  --bucket remon-backups \
  --lifecycle-configuration file://lifecycle.json
```

#### Sync to Google Cloud Storage

```bash
gsutil rsync -r -d /var/backups/remon-download gs://remon-backups/database/
```

#### Sync to Backblaze B2

```bash
b2 sync --keepDays 90 /var/backups/remon-download \
  b2://remon-backups/database/
```

## Backup Verification & Testing

### Monthly Restore Test

Every month, perform a full restoration to verify backups are valid:

```bash
#!/bin/bash
# Monthly restore test script
echo "Testing backup from $(date -d '1 month ago' +%Y%m%d)"

# Use test database
TEST_DB="remon_download_test"

# Drop test database if it exists
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $TEST_DB;"

# Create test database
sudo -u postgres psql -c "CREATE DATABASE $TEST_DB OWNER remon_user;"

# Restore from backup
BACKUP_FILE="/var/backups/remon-download/remon_download_$(date -d '1 month ago' +%Y%m%d)*.sql.gz"
gunzip < $(ls $BACKUP_FILE | head -1) | sudo -u postgres psql -d $TEST_DB

# Verify
TABLE_COUNT=$(sudo -u postgres psql -d $TEST_DB -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" | grep -oE '[0-9]+')

echo "Test database contains $TABLE_COUNT tables"

if [ "$TABLE_COUNT" -gt 0 ]; then
    echo "✓ Backup verification SUCCESS"
else
    echo "✗ Backup verification FAILED"
fi

# Cleanup
sudo -u postgres psql -c "DROP DATABASE $TEST_DB;"
```

### Automated Health Checks

Add backup health monitoring:

```bash
#!/bin/bash
# Check backup exists and is recent
LATEST_BACKUP=$(ls -t /var/backups/remon-download/*.sql.gz | head -1)
BACKUP_AGE=$(($(date +%s) - $(stat -L --format %Y "$LATEST_BACKUP")))
MAX_AGE=$((8 * 3600))  # 8 hours (backup interval is 6 hours)

if [ "$BACKUP_AGE" -gt "$MAX_AGE" ]; then
    echo "WARNING: Latest backup is $(($BACKUP_AGE / 3600)) hours old"
    # Send alert
fi

# Check backup file size is reasonable
BACKUP_SIZE=$(stat --format=%s "$LATEST_BACKUP")
if [ "$BACKUP_SIZE" -lt 1000 ]; then
    echo "WARNING: Backup is suspiciously small"
    # Send alert
fi
```

## Disaster Recovery Plan

### Scenarios and Recovery Times

| Scenario | Cause | Recovery Time | RTO | RPO |
|----------|-------|----------------|-----|-----|
| Database corruption | Unknown | 30 minutes | 1 hour | 6 hours |
| Disk failure | Hardware | 1-2 hours | 4 hours | 6 hours |
| Full server loss | Hardware failure | 4-8 hours | 24 hours | 6 hours |
| Accidental data delete | User error | 30 minutes | 1 hour | 6 hours |
| Ransomware attack | Security breach | 2-4 hours | 6 hours | 6 hours |

**RTO** = Recovery Time Objective (how fast to restore service)
**RPO** = Recovery Point Objective (how much data loss is acceptable)

### Priority Recovery Order

1. **Restore PostgreSQL database** (20 minutes)
2. **Verify application health** (5 minutes)
3. **Restore environment config** if needed (5 minutes)
4. **Restore media files** if available (variable)

### Communication During Recovery

- Notify users via status page
- Update backup if downtime extended
- Document recovery steps taken
- Post-incident review after recovery

## Compliance & Documentation

### Backup Documentation

Maintain records of:
- [ ] Backup schedule verification (weekly audit)
- [ ] Monthly restore test results
- [ ] Recovery procedure walkthroughs
- [ ] Backup retention audit (old files deleted)

### Compliance Checklist

- [ ] Backup encryption enabled
- [ ] Encryption keys stored securely (separate from backups)
- [ ] Access logs for backup retrievals
- [ ] Backup integrity verified monthly
- [ ] Disaster recovery plan documented
- [ ] Staff trained on recovery procedures

## Automation & Monitoring

### Backup Status Monitoring

Add to monitoring dashboard:

```bash
# Backup script with monitoring hooks
if /usr/local/bin/remon-backup.sh; then
    # Send success metric
    echo "remon_backup_success 1" | nc -w1 -u localhost 8125
else
    # Send alert
    systemctl restart remon-backend  # Auto-recovery attempt
fi
```

### Alert Conditions

Configure alerts for:
- Backup failed: No backup in last 8 hours
- Backup too small: Backup < 100 KB
- Backup too large: Backup > 1 GB (unexpected growth)
- Restore test failed: Verification returned errors
- Storage full: Backup partition > 80% full

## Backup Storage Checklist

- [ ] Backups stored on separate filesystem
- [ ] Daily sync to remote storage (cloud or offsite)
- [ ] Backups encrypted at rest
- [ ] Encryption keys stored securely
- [ ] Old backups archived after 30 days
- [ ] Monthly restore test scheduled
- [ ] Backup logs reviewed weekly
- [ ] Retention policy documented
- [ ] Recovery procedure documented and tested

## Summary

**Critical Backup Rules**:

1. Backup database every 6 hours
2. Keep last 30 backups locally
3. Sync to remote storage daily
4. Test restore monthly
5. Encrypt sensitive backups
6. Document all procedures
7. Alert on backup failures
8. Review backups monthly

**Recovery Commitment**:
- Any database loss recoverable within last 6 hours
- Full recovery possible within 1 hour
- Restore test performed monthly

