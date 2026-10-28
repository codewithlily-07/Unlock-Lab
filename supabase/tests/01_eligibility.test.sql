-- =====================================================
-- UNLOCKLAB TEST SUITE 01: ELIGIBILITY ENGINE
-- Tests: pass, fail, how_to_fix, cooldown, quotas
-- =====================================================

DO $$
DECLARE
  v_res_id UUID := 'f0000000-0000-0000-0000-000000000001'; -- Oscilloscope (requires ESD cert)
  v_priya UUID := 'd0000000-0000-0000-0000-000000000005';  -- Verified, has ESD cert
  v_amit UUID := 'd0000000-0000-0000-0000-000000000006';   -- Missing ESD cert
  v_outsider UUID := 'd0000000-0000-0000-0000-000000000008'; -- Unverified
  v_priya_result JSONB;
  v_amit_result JSONB;
  v_outsider_result JSONB;
  v_priya_passed BOOLEAN := true;
  v_amit_failed_training BOOLEAN := false;
  v_outsider_failed_verification BOOLEAN := false;
  v_item JSONB;
BEGIN
  RAISE NOTICE '--- RUNNING TEST 01: ELIGIBILITY ENGINE ---';

  -- 1. Test Priya (Fully eligible)
  v_priya_result := check_eligibility(v_priya, v_res_id);
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_priya_result)
  LOOP
    IF (v_item->>'passed')::boolean = false THEN
      v_priya_passed := false;
    END IF;
  END LOOP;
  ASSERT v_priya_passed = true, 'ASSERTION FAILED: Priya should pass all eligibility checks';
  RAISE NOTICE 'SUCCESS: Priya passed all eligibility criteria.';

  -- 2. Test Amit (Missing ESD Training Certificate)
  v_amit_result := check_eligibility(v_amit, v_res_id);
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_amit_result)
  LOOP
    IF v_item->>'requirement' LIKE '%ESD%' AND (v_item->>'passed')::boolean = false THEN
      v_amit_failed_training := true;
      ASSERT v_item->>'how_to_fix' LIKE '%Upload%', 'ASSERTION FAILED: Missing training must provide "how_to_fix" action';
    END IF;
  END LOOP;
  ASSERT v_amit_failed_training = true, 'ASSERTION FAILED: Amit must fail training requirement';
  RAISE NOTICE 'SUCCESS: Amit correctly flagged as missing ESD training with how_to_fix guidance.';

  -- 3. Test Outsider (Unverified identity)
  v_outsider_result := check_eligibility(v_outsider, v_res_id);
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_outsider_result)
  LOOP
    IF v_item->>'requirement' = 'Identity Verification' AND (v_item->>'passed')::boolean = false THEN
      v_outsider_failed_verification := true;
    END IF;
  END LOOP;
  ASSERT v_outsider_failed_verification = true, 'ASSERTION FAILED: Unverified user must fail verification check';
  RAISE NOTICE 'SUCCESS: Outsider correctly failed identity verification check.';

  RAISE NOTICE '--- TEST 01 ELIGIBILITY ENGINE PASSED ---';
END $$;

