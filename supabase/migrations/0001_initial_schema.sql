-- =====================================================
-- UNLOCKLAB - HACKATHON DATABASE SCHEMA
-- Migration 0001: Initial Schema, Enums, Tables, Indexes, Views
-- Idempotent & Production-Grade
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ENUMS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'owner', 'manager', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE organization_type AS ENUM ('college', 'lab', 'makerspace', 'company');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE resource_category AS ENUM ('instrument', 'fabrication', 'computing', 'camera', 'room', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE resource_status AS ENUM ('active', 'paused', 'maintenance');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE requirement_type AS ENUM ('training', 'role', 'membership', 'year', 'org', 'document', 'faculty_approval');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE credential_type AS ENUM ('training', 'membership', 'id_document');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE credential_status AS ENUM ('pending', 'verified', 'rejected', 'expired');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM (
    'requested',
    'eligibility_failed',
    'pending_review',
    'approved',
    'rejected',
    'waitlisted',
    'cancelled',
    'checked_out',
    'returned',
    'overdue',
    'returned_late',
    'disputed',
    'closed',
    'no_show'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE condition_phase AS ENUM ('before', 'after');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE item_condition AS ENUM ('excellent', 'good', 'fair', 'damaged');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE incident_type AS ENUM ('damage', 'delay', 'misuse', 'conflict', 'safety', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE incident_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE incident_status AS ENUM ('open', 'under_review', 'resolved', 'dismissed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE flag_status AS ENUM ('open', 'dismissed', 'actioned');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 1. ORGANIZATIONS
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type organization_type NOT NULL DEFAULT 'college',
  address TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. PROFILES (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'user',
  organization TEXT NOT NULL DEFAULT 'Apex Institute of Technology',
  department TEXT NOT NULL DEFAULT 'ECE',
  year_or_designation TEXT NOT NULL DEFAULT 'Final Year B.Tech',
  phone TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  is_suspended BOOLEAN NOT NULL DEFAULT false,
  suspension_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. RESOURCES
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category resource_category NOT NULL DEFAULT 'instrument',
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  photos TEXT[] NOT NULL DEFAULT '{}',
  status resource_status NOT NULL DEFAULT 'active',
  min_booking_minutes INTEGER NOT NULL DEFAULT 30,
  max_booking_minutes INTEGER NOT NULL DEFAULT 240,
  advance_booking_days INTEGER NOT NULL DEFAULT 14,
  requires_approval BOOLEAN NOT NULL DEFAULT true,
  requires_deposit BOOLEAN NOT NULL DEFAULT false,
  deposit_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  supervision_required BOOLEAN NOT NULL DEFAULT false,
  usage_rules TEXT[] NOT NULL DEFAULT '{}',
  safety_notes TEXT,
  qr_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. RESOURCE AVAILABILITY (recurring weekly schedule)
CREATE TABLE IF NOT EXISTS resource_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday >= 0 AND weekday <= 6), -- 0=Sun, 1=Mon, ..., 6=Sat
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  CONSTRAINT check_availability_times CHECK (end_time > start_time)
);

-- 5. RESOURCE BLACKOUTS
CREATE TABLE IF NOT EXISTS resource_blackouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL,
  CONSTRAINT check_blackout_times CHECK (end_at > start_at)
);

-- 6. RESOURCE REQUIREMENTS
CREATE TABLE IF NOT EXISTS resource_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  type requirement_type NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  description TEXT NOT NULL
);

-- 7. RESOURCE MANAGERS (delegated management)
CREATE TABLE IF NOT EXISTS resource_managers (
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (resource_id, manager_id)
);

-- 8. USER CREDENTIALS
CREATE TABLE IF NOT EXISTS user_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type credential_type NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT,
  status credential_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  purpose TEXT NOT NULL,
  project_need TEXT,
  status booking_status NOT NULL DEFAULT 'requested',
  decision_reason TEXT,
  rule_applied TEXT,
  eligibility_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  waitlist_position INTEGER,
  priority_score NUMERIC(8,2) NOT NULL DEFAULT 0.00,
  priority_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  decided_at TIMESTAMPTZ,
  checked_in_at TIMESTAMPTZ,
  returned_at TIMESTAMPTZ,
  extension_of UUID REFERENCES bookings(id) ON DELETE SET NULL,
  is_overdue BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT check_booking_times CHECK (end_at > start_at)
);

-- EXCLUSION CONSTRAINT for Concurrency Safety (Section 12)
-- Prevents overlapping approved or checked_out bookings on the same resource at the database engine level
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS no_overlapping_approved_bookings;
ALTER TABLE bookings ADD CONSTRAINT no_overlapping_approved_bookings
  EXCLUDE USING gist (
    resource_id WITH =,
    tstzrange(start_at, end_at, '[)') WITH &&
  )
  WHERE (status IN ('approved', 'checked_out'));

-- 10. CONDITION REPORTS
CREATE TABLE IF NOT EXISTS condition_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  phase condition_phase NOT NULL,
  condition item_condition NOT NULL DEFAULT 'good',
  notes TEXT NOT NULL,
  photos TEXT[] NOT NULL DEFAULT '{}',
  recorded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. INCIDENTS
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE RESTRICT,
  reported_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  type incident_type NOT NULL,
  severity incident_severity NOT NULL DEFAULT 'medium',
  description TEXT NOT NULL,
  status incident_status NOT NULL DEFAULT 'open',
  resolution_note TEXT,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  ai_summary TEXT,
  ai_summary_reviewed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. AUDIT LOG (Append-only)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_role TEXT NOT NULL DEFAULT 'system',
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  booking_id UUID,
  resource_id UUID,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. FAIR USE SETTINGS (Single configuration row)
CREATE TABLE IF NOT EXISTS fair_use_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  max_hours_per_week_per_user NUMERIC(5,1) NOT NULL DEFAULT 6.0,
  max_active_bookings_per_user INTEGER NOT NULL DEFAULT 3,
  max_pending_requests_per_user INTEGER NOT NULL DEFAULT 5,
  max_consecutive_bookings_same_resource INTEGER NOT NULL DEFAULT 2,
  cooldown_hours_after_late_return INTEGER NOT NULL DEFAULT 48,
  no_show_penalty_points INTEGER NOT NULL DEFAULT 15,
  priority_weights JSONB NOT NULL DEFAULT '{
    "hours_weight": 0.40,
    "wait_time_weight": 0.30,
    "reliability_weight": 0.20,
    "academic_need_weight": 0.10
  }'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default single row if not exists
INSERT INTO fair_use_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 15. FAIR USE FLAGS (Anti-monopolisation)
CREATE TABLE IF NOT EXISTS fair_use_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status flag_status NOT NULL DEFAULT 'open',
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_resources_owner ON resources(owner_id);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status);
CREATE INDEX IF NOT EXISTS idx_resources_qr_token ON resources(qr_token);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_resource ON bookings(resource_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_range ON bookings(start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_booking ON audit_log(booking_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_user_credentials_user ON user_credentials(user_id, status);
CREATE INDEX IF NOT EXISTS idx_incidents_resource ON incidents(resource_id);
CREATE INDEX IF NOT EXISTS idx_incidents_booking ON incidents(booking_id);

-- =====================================================
-- VIEWS
-- =====================================================

-- 1. USAGE STATS VIEW
CREATE OR REPLACE VIEW usage_stats AS
SELECT
  p.id AS user_id,
  p.full_name,
  p.email,
  -- Hours used in last 7 days (approved, checked_out, returned, returned_late, closed)
  COALESCE(SUM(
    CASE
      WHEN b.status IN ('checked_out', 'returned', 'returned_late', 'closed')
       AND b.start_at >= now() - INTERVAL '7 days'
      THEN EXTRACT(EPOCH FROM (LEAST(b.end_at, now()) - b.start_at)) / 3600.0
      ELSE 0
    END
  ), 0)::NUMERIC(6,2) AS hours_last_7_days,
  -- Hours used in last 30 days
  COALESCE(SUM(
    CASE
      WHEN b.status IN ('checked_out', 'returned', 'returned_late', 'closed')
       AND b.start_at >= now() - INTERVAL '30 days'
      THEN EXTRACT(EPOCH FROM (LEAST(b.end_at, now()) - b.start_at)) / 3600.0
      ELSE 0
    END
  ), 0)::NUMERIC(6,2) AS hours_last_30_days,
  -- Total active bookings
  COUNT(CASE WHEN b.status IN ('approved', 'checked_out') THEN 1 END) AS active_bookings_count,
  -- Pending requests
  COUNT(CASE WHEN b.status IN ('requested', 'pending_review') THEN 1 END) AS pending_requests_count,
  -- Late returns
  COUNT(CASE WHEN b.status = 'returned_late' THEN 1 END) AS late_returns_count,
  -- No shows
  COUNT(CASE WHEN b.status = 'no_show' THEN 1 END) AS no_shows_count,
  -- Damage incidents reported against bookings by this user
  COUNT(DISTINCT inc.id) AS damage_incidents_count
FROM profiles p
LEFT JOIN bookings b ON b.user_id = p.id
LEFT JOIN incidents inc ON inc.booking_id = b.id AND inc.type = 'damage'
GROUP BY p.id, p.full_name, p.email;

-- 2. RELIABILITY SCORES VIEW (Section 13)
-- Range 0-100: Base 100 - (late_returns * 10) - (no_shows * 15) - (damage_incidents * 20) + (completed_clean * 2) capped at 100
CREATE OR REPLACE VIEW reliability_scores AS
WITH user_history AS (
  SELECT
    p.id AS user_id,
    p.full_name,
    COUNT(CASE WHEN b.status = 'closed' THEN 1 END) AS clean_returns,
    COUNT(CASE WHEN b.status = 'returned_late' THEN 1 END) AS late_returns,
    COUNT(CASE WHEN b.status = 'no_show' THEN 1 END) AS no_shows,
    COUNT(DISTINCT CASE WHEN inc.type = 'damage' THEN inc.id END) AS damage_count
  FROM profiles p
  LEFT JOIN bookings b ON b.user_id = p.id
  LEFT JOIN incidents inc ON inc.booking_id = b.id
  GROUP BY p.id, p.full_name
)
SELECT
  user_id,
  full_name,
  clean_returns,
  late_returns,
  no_shows,
  damage_count,
  GREATEST(0, LEAST(100,
    100
    - (late_returns * 10)
    - (no_shows * 15)
    - (damage_count * 20)
    + (clean_returns * 2)
  ))::INTEGER AS reliability_score
FROM user_history;
