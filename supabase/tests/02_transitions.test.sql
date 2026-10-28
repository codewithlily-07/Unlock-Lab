-- =====================================================
-- UNLOCKLAB TEST SUITE 02: BOOKING STATE MACHINE & LIFECYCLE
-- Tests: Legal & Illegal Transitions, Role Checks, Required Reasons
-- Damage flow -> Disputed -> Resolved -> Closed
-- =====================================================

DO $$
DECLARE
  v_owner UUID := 'b0000000-0000-0000-0000-000000000002';
  v_student UUID := 'd0000000-0000-0000-0000-000000000005';
  v_res_id UUID := 'f0000000-0000-0000-0000-000000000001';
  v_booking bookings;
  v_booking_id UUID;
  v_test_failed BOOLEAN;
  v_incident incidents;
BEGIN
  RAISE NOTICE '--- RUNNING TEST 02: STATE MACHINE & TRANSITIONS ---';

  -- 1. Create a test booking in pending_review
  INSERT INTO bookings (
    resource_id, user_id, start_at, end_at, purpose, status
  ) VALUES (
    v_res_id, v_student, now() + INTERVAL '5 days', now() + INTERVAL '5 days 2 hours',
    'State machine verification test', 'pending_review'
  ) RETURNING * INTO v_booking;
  v_booking_id := v_booking.id;

  -- 2. ILLEGAL TRANSITION: Transition without reason must FAIL
  v_test_failed := false;
  BEGIN
    -- Set auth context to owner
    PERFORM set_config('request.jwt.claim.sub', v_owner::text, true);
    PERFORM transition_booking(v_booking_id, 'approved', '');
  EXCEPTION WHEN OTHERS THEN
    v_test_failed := true;
  END;
  ASSERT v_test_failed = true, 'ASSERTION FAILED: Approving without reason must fail';
  RAISE NOTICE 'SUCCESS: Blank reason transition rejected.';

  -- 3. ILLEGAL TRANSITION: Non-owner/manager attempting approval must FAIL
  v_test_failed := false;
  BEGIN
    -- Student attempts to approve own booking
    PERFORM set_config('request.jwt.claim.sub', v_student::text, true);
    PERFORM transition_booking(v_booking_id, 'approved', 'Student self-approval attempt');
  EXCEPTION WHEN OTHERS THEN
    v_test_failed := true;
  END;
  ASSERT v_test_failed = true, 'ASSERTION FAILED: Borrower must not be able to approve own booking';
  RAISE NOTICE 'SUCCESS: Borrower self-approval attempt blocked.';

  -- 4. LEGAL TRANSITION: Owner approves with plain-language reason
  PERFORM set_config('request.jwt.claim.sub', v_owner::text, true);
  v_booking := transition_booking(v_booking_id, 'approved', 'Prerequisites checked and bench scheduled.');
  ASSERT v_booking.status = 'approved', 'ASSERTION FAILED: Booking should now be approved';
  ASSERT v_booking.decided_by = v_owner, 'ASSERTION FAILED: Decided_by must match owner';
  RAISE NOTICE 'SUCCESS: Owner approval with reason succeeded.';

  -- 5. LEGAL CHECK-IN: Student checks in and records initial condition
  PERFORM set_config('request.jwt.claim.sub', v_student::text, true);
  v_booking := check_in(v_booking_id, 'good', 'Power cord verified, screen flawless', ARRAY['photo_before.jpg']);
  ASSERT v_booking.status = 'checked_out', 'ASSERTION FAILED: Status must be checked_out';
  ASSERT v_booking.checked_in_at IS NOT NULL, 'ASSERTION FAILED: checked_in_at must be set';
  RAISE NOTICE 'SUCCESS: Check-in recorded with before-condition report.';

  -- 6. DAMAGE REPORT ON RETURN: Return with damage flag transitions to disputed
  v_booking := return_booking(
    v_booking_id,
    'damaged',
    'Ch1 BNC connector loose',
    ARRAY['damage_photo.jpg'],
    true,
    'BNC outer shield detached during probe disconnect'
  );
  ASSERT v_booking.status = 'disputed', 'ASSERTION FAILED: Damaged return must transition to disputed';
  ASSERT v_booking.returned_at IS NOT NULL, 'ASSERTION FAILED: returned_at must be set';

  -- Check incident created
  SELECT * INTO v_incident FROM incidents WHERE booking_id = v_booking_id LIMIT 1;
  ASSERT v_incident.id IS NOT NULL, 'ASSERTION FAILED: Damage incident must be created';
  ASSERT v_incident.status = 'open', 'ASSERTION FAILED: Incident must be open';
  RAISE NOTICE 'SUCCESS: Damaged return created dispute and open incident.';

  -- 7. RESOLVE INCIDENT -> TRANSITION TO CLOSED
  PERFORM set_config('request.jwt.claim.sub', v_owner::text, true);
  v_incident := resolve_incident(v_incident.id, 'resolved', 'BNC connector retightened and recalibrated by lab tech.');
  ASSERT v_incident.status = 'resolved', 'ASSERTION FAILED: Incident must be marked resolved';

  SELECT * INTO v_booking FROM bookings WHERE id = v_booking_id;
  ASSERT v_booking.status = 'closed', 'ASSERTION FAILED: Booking must transition to closed after incident resolution';
  RAISE NOTICE 'SUCCESS: Incident resolution automatically transitioned booking to closed.';

  RAISE NOTICE '--- TEST 02 STATE MACHINE PASSED ---';
END $$;
