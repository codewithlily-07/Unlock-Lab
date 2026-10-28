-- =====================================================
-- UNLOCKLAB TEST SUITE 04: CONCURRENCY & EXCLUSION CONSTRAINT (Section 12)
-- Tests: Assert that two conflicting slot bookings cannot both be approved.
-- Exactly ONE must succeed and the other must be blocked cleanly.
-- =====================================================

DO $$
DECLARE
  v_owner UUID := 'b0000000-0000-0000-0000-000000000002';
  v_student1 UUID := 'd0000000-0000-0000-0000-000000000005';
  v_student2 UUID := 'd0000000-0000-0000-0000-000000000007';
  v_res_id UUID := 'f0000000-0000-0000-0000-000000000005'; -- FPGA board
  v_slot_start TIMESTAMPTZ := now() + INTERVAL '10 days 10:00';
  v_slot_end TIMESTAMPTZ := now() + INTERVAL '10 days 13:00';
  v_booking1_id UUID;
  v_booking2_id UUID;
  v_second_approval_failed BOOLEAN := false;
  v_error_message TEXT;
BEGIN
  RAISE NOTICE '--- RUNNING TEST 04: CONCURRENCY AND EXCLUSION CONSTRAINT ---';

  -- Create Request 1 (pending review)
  INSERT INTO bookings (
    resource_id, user_id, start_at, end_at, purpose, status
  ) VALUES (
    v_res_id, v_student1, v_slot_start, v_slot_end, 'Competing request 1', 'pending_review'
  ) RETURNING id INTO v_booking1_id;

  -- Create Request 2 (overlapping slot, pending review)
  INSERT INTO bookings (
    resource_id, user_id, start_at, end_at, purpose, status
  ) VALUES (
    v_res_id, v_student2, v_slot_start + INTERVAL '30 minutes', v_slot_end + INTERVAL '30 minutes', 'Competing request 2', 'pending_review'
  ) RETURNING id INTO v_booking2_id;

  -- Set auth context to owner
  PERFORM set_config('request.jwt.claim.sub', v_owner::text, true);

  -- 1. Owner approves Request 1 -> MUST SUCCEED
  PERFORM transition_booking(v_booking1_id, 'approved', 'Approved request 1.');
  RAISE NOTICE 'SUCCESS: First booking approved for slot.';

  -- 2. Owner or race condition attempts to approve Request 2 for overlapping slot -> MUST FAIL
  BEGIN
    PERFORM transition_booking(v_booking2_id, 'approved', 'Simultaneous approval of conflicting slot');
  EXCEPTION WHEN OTHERS THEN
    v_second_approval_failed := true;
    v_error_message := SQLERRM;
  END;

  ASSERT v_second_approval_failed = true, 'CONCURRENCY FLAW: Double booking occurred! Overlapping approval should have been blocked.';
  ASSERT v_error_message LIKE '%slot was just taken%', format('Expected friendly message but received: %s', v_error_message);

  RAISE NOTICE 'SUCCESS: Overlapping approval was intercepted with message: "%s"', v_error_message;
  RAISE NOTICE '--- TEST 04 CONCURRENCY & EXCLUSION CONSTRAINT PASSED ---';
END $$;

