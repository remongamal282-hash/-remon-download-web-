CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  display_name TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  thumbnail_url TEXT,
  media_type TEXT,
  quality TEXT,
  format TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'analyzing', 'downloading', 'paused', 'merging', 'converting', 'completed', 'failed', 'canceled', 'retrying')),
  progress NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  file_path TEXT,
  file_size BIGINT CHECK (file_size IS NULL OR file_size >= 0),
  duration NUMERIC(12, 3) CHECK (duration IS NULL OR duration >= 0),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  download_id UUID REFERENCES downloads(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  title TEXT,
  thumbnail_url TEXT,
  media_type TEXT,
  quality TEXT,
  format TEXT,
  file_size BIGINT CHECK (file_size IS NULL OR file_size >= 0),
  duration NUMERIC(12, 3) CHECK (duration IS NULL OR duration >= 0),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  thumbnail_url TEXT,
  media_type TEXT,
  duration NUMERIC(12, 3) CHECK (duration IS NULL OR duration >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT favorites_user_url_unique UNIQUE (user_id, url)
);

CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  thumbnail_url TEXT,
  media_type TEXT,
  quality TEXT,
  format TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'active', 'completed', 'failed', 'canceled')),
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  download_path TEXT,
  default_quality TEXT,
  default_format TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  theme TEXT NOT NULL DEFAULT 'system',
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  concurrent_downloads INTEGER NOT NULL DEFAULT 2 CHECK (concurrent_downloads > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT settings_one_per_user UNIQUE (user_id)
);

CREATE INDEX downloads_user_id_idx ON downloads (user_id);
CREATE INDEX downloads_status_idx ON downloads (status);
CREATE INDEX downloads_created_at_idx ON downloads (created_at);
CREATE INDEX history_user_id_idx ON history (user_id);
CREATE INDEX history_created_at_idx ON history (created_at);
CREATE INDEX favorites_user_id_idx ON favorites (user_id);
CREATE INDEX schedules_user_id_idx ON schedules (user_id);
CREATE INDEX schedules_scheduled_at_idx ON schedules (scheduled_at);
CREATE INDEX schedules_status_idx ON schedules (status);
CREATE INDEX settings_user_id_idx ON settings (user_id);