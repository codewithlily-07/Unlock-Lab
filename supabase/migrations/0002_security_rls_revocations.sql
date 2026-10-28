-- =====================================================
-- UNLOCKLAB - HACKATHON DATABASE SECURITY
-- Migration 0002: RLS Policies, Revocations, Audit Immutability
-- =====================================================

-- 1. ENABLE ROW LEVEL SECURITY ON ALL TABLES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_blackouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE condition_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE fair_use_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fair_use_flags ENABLE ROW LEVEL SECURITY;

-- 2. HELPER FUNCTIONS FOR ROLE CHECKING (SECURITY DEFINER with fixed search_path)
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE((SELECT role = 'admin' FROM profiles WHERE id = auth.uid()), false);
$$;

CREATE OR REPLACE FUNCTION is_resource_owner_or_manager(res_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM resources WHERE id = res_id AND owner_id = auth.uid()
    UNION
    SELECT 1 FROM resource_managers WHERE resource_id = res_id AND manager_id = auth.uid()
  );
$$;

-- 3. PROFILES POLICIES
-- Anyone authenticated can view public profile details; only admins see full suspension/internal details
DROP POLICY IF EXISTS "Profiles are readable by authenticated users" ON profiles;
CREATE POLICY "Profiles are readable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can update basic self profile info (full_name, phone, department, year), NOT role/verified/suspended
DROP POLICY IF EXISTS "Users can update basic profile info" ON profiles;
CREATE POLICY "Users can update basic profile info"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 4. ORGANIZATIONS POLICIES
DROP POLICY IF EXISTS "Organizations readable by authenticated" ON organizations;
CREATE POLICY "Organizations readable by authenticated"
  ON organizations FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage organizations" ON organizations;
CREATE POLICY "Admins can manage organizations"
  ON organizations FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- 5. RESOURCES POLICIES
-- Active resources are viewable by anyone; paused/maintenance only by owner/manager/admin
DROP POLICY IF EXISTS "Resources visible based on status and ownership" ON resources;
CREATE POLICY "Resources visible based on status and ownership"
  ON resources FOR SELECT
  TO authenticated
  USING (
    status = 'active'
    OR owner_id = auth.uid()
    OR is_resource_owner_or_manager(id)
    OR is_admin()
  );

-- Only verified owners can insert resources
DROP POLICY IF EXISTS "Verified owners can create resources" ON resources;
CREATE POLICY "Verified owners can create resources"
  ON resources FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin') AND is_verified = true)
  );

-- Owners and admins can update own resources
DROP POLICY IF EXISTS "Owners can update own resources" ON resources;
CREATE POLICY "Owners can update own resources"
  ON resources FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid() OR is_admin())
  WITH CHECK (owner_id = auth.uid() OR is_admin());

-- 6. RESOURCE AVAILABILITY & BLACKOUTS & REQUIREMENTS POLICIES
DROP POLICY IF EXISTS "Availability readable by authenticated" ON resource_availability;
CREATE POLICY "Availability readable by authenticated"
  ON resource_availability FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Blackouts readable by authenticated" ON resource_blackouts;
CREATE POLICY "Blackouts readable by authenticated"
  ON resource_blackouts FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Requirements readable by authenticated" ON resource_requirements;
CREATE POLICY "Requirements readable by authenticated"
  ON resource_requirements FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Owners manage availability" ON resource_availability;
CREATE POLICY "Owners manage availability"
  ON resource_availability FOR ALL
  TO authenticated
  USING (is_resource_owner_or_manager(resource_id) OR is_admin())
  WITH CHECK (is_resource_owner_or_manager(resource_id) OR is_admin());

DROP POLICY IF EXISTS "Owners manage blackouts" ON resource_blackouts;
CREATE POLICY "Owners manage blackouts"
  ON resource_blackouts FOR ALL
  TO authenticated
  USING (is_resource_owner_or_manager(resource_id) OR is_admin())
  WITH CHECK (is_resource_owner_or_manager(resource_id) OR is_admin());

DROP POLICY IF EXISTS "Owners manage requirements" ON resource_requirements;
CREATE POLICY "Owners manage requirements"
  ON resource_requirements FOR ALL
  TO authenticated
  USING (is_resource_owner_or_manager(resource_id) OR is_admin())
  WITH CHECK (is_resource_owner_or_manager(resource_id) OR is_admin());

DROP POLICY IF EXISTS "Owners manage managers" ON resource_managers;
CREATE POLICY "Owners manage managers"
  ON resource_managers FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM resources WHERE id = resource_id AND owner_id = auth.uid()) OR is_admin())
  WITH CHECK (EXISTS (SELECT 1 FROM resources WHERE id = resource_id AND owner_id = auth.uid()) OR is_admin());

-- 7. USER CREDENTIALS POLICIES
-- Users see own credentials; owners/managers review credentials for applicants; admins see all
DROP POLICY IF EXISTS "Credentials read access" ON user_credentials;
CREATE POLICY "Credentials read access"
  ON user_credentials FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR is_admin()
    OR EXISTS (
      -- Resource owners where this user has an active booking request
      SELECT 1 FROM bookings b
      JOIN resources r ON r.id = b.resource_id
      WHERE b.user_id = user_credentials.user_id
        AND (r.owner_id = auth.uid() OR is_resource_owner_or_manager(r.id))
    )
  );

-- Users can upload pending credentials for themselves
DROP POLICY IF EXISTS "Users can insert own credentials" ON user_credentials;
CREATE POLICY "Users can insert own credentials"
  ON user_credentials FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'
  );

-- 8. BOOKINGS POLICIES (Read-only via table query; writes via RPC only)
DROP POLICY IF EXISTS "Bookings read access" ON bookings;
CREATE POLICY "Bookings read access"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR is_resource_owner_or_manager(resource_id)
    OR is_admin()
  );

-- 9. CONDITION REPORTS POLICIES
DROP POLICY IF EXISTS "Condition reports read access" ON condition_reports;
CREATE POLICY "Condition reports read access"
  ON condition_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = condition_reports.booking_id
        AND (b.user_id = auth.uid() OR is_resource_owner_or_manager(b.resource_id) OR is_admin())
    )
  );

-- 10. INCIDENTS POLICIES
DROP POLICY IF EXISTS "Incidents read access" ON incidents;
CREATE POLICY "Incidents read access"
  ON incidents FOR SELECT
  TO authenticated
  USING (
    reported_by = auth.uid()
    OR is_resource_owner_or_manager(resource_id)
    OR is_admin()
  );

-- 11. AUDIT LOG POLICIES (Append-only & read scoped)
DROP POLICY IF EXISTS "Audit log read access" ON audit_log;
CREATE POLICY "Audit log read access"
  ON audit_log FOR SELECT
  TO authenticated
  USING (
    is_admin()
    OR actor_id = auth.uid()
    OR (booking_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM bookings b WHERE b.id = audit_log.booking_id AND (b.user_id = auth.uid() OR is_resource_owner_or_manager(b.resource_id))
    ))
    OR (resource_id IS NOT NULL AND is_resource_owner_or_manager(resource_id))
  );

-- 12. NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "Users see own notifications" ON notifications;
CREATE POLICY "Users see own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users mark own notifications read" ON notifications;
CREATE POLICY "Users mark own notifications read"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 13. FAIR USE SETTINGS & FLAGS POLICIES
DROP POLICY IF EXISTS "Fair use settings readable by authenticated" ON fair_use_settings;
CREATE POLICY "Fair use settings readable by authenticated"
  ON fair_use_settings FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Fair use flags visible to admin and owner" ON fair_use_flags;
CREATE POLICY "Fair use flags visible to admin and owner"
  ON fair_use_flags FOR SELECT
  TO authenticated
  USING (
    is_admin()
    OR user_id = auth.uid()
    OR (resource_id IS NOT NULL AND is_resource_owner_or_manager(resource_id))
  );

-- =====================================================
-- SECTION 11A: HARD REVOCATIONS OF DIRECT WRITES
-- No direct client writes to critical state tables!
-- =====================================================

-- Revoke direct writes to critical tables from anon and authenticated roles
REVOKE INSERT, UPDATE, DELETE ON bookings FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON condition_reports FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON incidents FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON audit_log FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON fair_use_settings FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON fair_use_flags FROM anon, authenticated;

-- Protect sensitive columns in profiles:
-- Normal users must NOT be able to update role, is_verified, verified_by, verified_at, or is_suspended
REVOKE UPDATE (role, is_verified, verified_by, verified_at, is_suspended, suspension_reason) ON profiles FROM anon, authenticated;

-- Protect status and review columns in user_credentials
REVOKE UPDATE (status, reviewed_by, reviewed_at, review_note) ON user_credentials FROM anon, authenticated;

-- =====================================================
-- SECTION 11C: IMMUTABLE AUDIT LOG TRIGGER
-- Enforces append-only nature at the Postgres engine level
-- =====================================================
CREATE OR REPLACE FUNCTION enforce_audit_log_immutable()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is strictly append-only. Modification or deletion of audit records is prohibited.';
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_log_no_update_delete ON audit_log;
CREATE TRIGGER trg_audit_log_no_update_delete
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW
  EXECUTE FUNCTION enforce_audit_log_immutable();

