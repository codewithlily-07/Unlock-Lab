-- =====================================================
-- UNLOCKLAB TEST SUITE 03: SECURITY ATTACK RESISTANCE (Section 11A)
-- Tests: Assert that raw Supabase direct-write attacks FAIL for normal users
-- 1. Direct write to approve a booking
-- 2. Direct write to mark an incident resolved
-- 3. Direct write to promote own role to admin or set is_verified = true
-- 4. Direct UPDATE or DELETE on audit_log
-- =====================================================

DO $$
DECLARE
  v_attacker UUID := 'd0000000-0000-0000-0000-000000000005'; -- Student (normal user)
  v_booking_id UUID := '10000000-0000-0000-0000-000000000006'; -- Pending review booking
  v_incident_id UUID := '20000000-0000-0000-0000-000000000001'; -- Open incident
  v_audit_id UUID;
  v_test_failed BOOLEAN;
BEGIN
  RAISE NOTICE '--- RUNNING TEST 03: DIRECT-WRITE SECURITY ATTACK VULNERABILITY CHECKS ---';

  -- Simulate authenticated attacker
  PERFORM set_config('request.jwt.claim.sub', v_attacker::text, true);
  PERFORM set_config('role', 'authenticated', true);

  -- ATTACK 1: Attacker attempts direct UPDATE on bookings table to set status = 'approved'
  v_test_failed := false;
  BEGIN
    UPDATE bookings SET status = 'approved' WHERE id = v_booking_id;
  EXCEPTION WHEN OTHERS THEN
    v_test_failed := true;
  END;
  ASSERT v_test_failed = true, 'SECURITY FLAW: Direct UPDATE on bookings must be blocked by revoked permissions!';
  RAISE NOTICE 'DEFENSE PASSED 1: Direct client write to approve booking was BLOCKED.';

  -- ATTACK 2: Attacker attempts direct UPDATE on incidents table to set status = 'resolved'
  v_test_failed := false;
  BEGIN
    UPDATE incidents SET status = 'resolved' WHERE id = v_incident_id;
  EXCEPTION WHEN OTHERS THEN
    v_test_failed := true;
  END;
  ASSERT v_test_failed = true, 'SECURITY FLAW: Direct UPDATE on incidents must be blocked by revoked permissions!';
  RAISE NOTICE 'DEFENSE PASSED 2: Direct client write to resolve incident was BLOCKED.';

  -- ATTACK 3: Attacker attempts direct UPDATE on profiles table to elevate role to 'admin'
  v_test_failed := false;
  BEGIN
    UPDATE profiles SET role = 'admin' WHERE id = v_attacker;
  EXCEPTION WHEN OTHERS THEN
    v_test_failed := true;
  END;
  ASSERT v_test_failed = true, 'SECURITY FLAW: Direct privilege escalation on profiles(role) must be BLOCKED!';
  RAISE NOTICE 'DEFENSE PASSED 3: Direct privilege escalation to admin was BLOCKED.';

  -- ATTACK 4: Attacker attempts direct UPDATE on profiles table to set is_verified = true
  v_test_failed := false;
  BEGIN
    UPDATE profiles SET is_verified = true WHERE id = v_attacker;
  EXCEPTION WHEN OTHERS THEN
    v_test_failed := true;
  END;
  ASSERT v_test_failed = true, 'SECURITY FLAW: Direct verification bypass on profiles(is_verified) must be BLOCKED!';
  RAISE NOTICE 'DEFENSE PASSED 4: Direct self-verification was BLOCKED.';

  -- ATTACK 5: Attacker attempts to DELETE an audit_log row to erase forensic evidence
  SELECT id INTO v_audit_id FROM audit_log LIMIT 1;
  v_test_failed := false;
  BEGIN
    DELETE FROM audit_log WHERE id = v_audit_id;
  EXCEPTION WHEN OTHERS THEN
    v_test_failed := true;
  END;
  ASSERT v_test_failed = true, 'SECURITY FLAW: audit_log records must never be deletable!';
  RAISE NOTICE 'DEFENSE PASSED 5: Audit log deletion was BLOCKED by immutability trigger & revocation.';

  -- ATTACK 6: Attacker attempts to UPDATE an audit_log row
  v_test_failed := false;
  BEGIN
    UPDATE audit_log SET action = 'ALTERED_ACTION' WHERE id = v_audit_id;
  EXCEPTION WHEN OTHERS THEN
    v_test_failed := true;
  END;
  ASSERT v_test_failed = true, 'SECURITY FLAW: audit_log records must never be editable!';
  RAISE NOTICE 'DEFENSE PASSED 6: Audit log modification was BLOCKED by immutability trigger & revocation.';

  -- Reset role
  PERFORM set_config('role', 'postgres', true);
  RAISE NOTICE '--- TEST 03 SECURITY ATTACK RESISTANCE PASSED (ALL 6 ATTACKS NEUTRALIZED) ---';
END $$;

