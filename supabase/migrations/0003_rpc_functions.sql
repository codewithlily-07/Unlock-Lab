-- =====================================================
-- UNLOCKLAB - HACKATHON DATABASE BUSINESS LOGIC (RPC)
-- Migration 0003: Tamper-proof Postgres Functions
-- All critical actions execute via SECURITY DEFINER
-- =====================================================

-- Helper: Write to audit_log
CREATE OR REPLACE FUNCTION log_audit_event(
  p_actor_id UUID,
  p_actor_role TEXT,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_booking_id UUID,
  p_resource_id UUID,
  p_details JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO audit_log (
    actor_id, actor_role, action, entity_type, entity_id, booking_id, resource_id, details
  ) VALUES (
    p_actor_id, p_actor_role, p_action, p_entity_type, p_entity_id, p_booking_id, p_resource_id, p_details
  ) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- Helper: Create Notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id, type, title, message, link
  ) VALUES (
    p_user_id, p_type, p_title, p_message, p_link
  ) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- =====================================================
-- 1. ELIGIBILITY ENGINE (Section 6)
-- =====================================================
CREATE OR REPLACE FUNCTION check_eligibility(
  p_user_id UUID,
  p_resource_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_user profiles%ROWTYPE;
  v_resource resources%ROWTYPE;
  v_settings fair_use_settings%ROWTYPE;
  v_results JSONB := '[]'::jsonb;
  v_req RECORD;
  v_cred RECORD;
  v_hours_last_7 NUMERIC;
  v_active_count INTEGER;
  v_pending_count INTEGER;
  v_consecutive_count INTEGER;
  v_open_incidents INTEGER;
  v_cooldown_active BOOLEAN;
  v_req_passed BOOLEAN;
  v_req_msg TEXT;
  v_how_to_fix TEXT;
BEGIN
  -- Load user
  SELECT * INTO v_user FROM profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_array(jsonb_build_object(
      'requirement', 'User Account',
      'passed', false,
      'message', 'User account does not exist',
      'how_to_fix', 'Register or sign in with a valid account'
    ));
  END IF;

  -- Load resource
  SELECT * INTO v_resource FROM resources WHERE id = p_resource_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_array(jsonb_build_object(
      'requirement', 'Resource',
      'passed', false,
      'message', 'Resource does not exist or has been removed',
      'how_to_fix', 'Select an active resource from the catalog'
    ));
  END IF;

  -- Load settings
  SELECT * INTO v_settings FROM fair_use_settings WHERE id = 1;

  -- 1. Account Active / Not Suspended
  IF v_user.is_suspended THEN
    v_results := v_results || jsonb_build_object(
      'requirement', 'Account Standing',
      'passed', false,
      'message', format('Account is suspended: %s', COALESCE(v_user.suspension_reason, 'Policy violation')),
      'how_to_fix', 'Contact department administrator to resolve account suspension'
    );
  ELSE
    v_results := v_results || jsonb_build_object(
      'requirement', 'Account Standing',
      'passed', true,
      'message', 'Account is active in good standing',
      'how_to_fix', ''
    );
  END IF;

  -- 2. User Verification
  IF NOT v_user.is_verified THEN
    v_results := v_results || jsonb_build_object(
      'requirement', 'Identity Verification',
      'passed', false,
      'message', 'Institutional identity has not been verified by an administrator',
      'how_to_fix', 'Submit student/faculty ID credentials on the Credentials page for verification'
    );
  ELSE
    v_results := v_results || jsonb_build_object(
      'requirement', 'Identity Verification',
      'passed', true,
      'message', 'Institutional identity verified',
      'how_to_fix', ''
    );
  END IF;

  -- 3. Late Return Cooldown
  SELECT EXISTS (
    SELECT 1 FROM bookings
    WHERE user_id = p_user_id
      AND status = 'returned_late'
      AND returned_at >= now() - (v_settings.cooldown_hours_after_late_return || ' hours')::interval
  ) INTO v_cooldown_active;

  IF v_cooldown_active THEN
    v_results := v_results || jsonb_build_object(
      'requirement', 'Late Return Cooldown',
      'passed', false,
      'message', format('A %s-hour cooldown is active due to a recent late return', v_settings.cooldown_hours_after_late_return),
      'how_to_fix', 'Wait for the cooldown window to elapse before booking equipment'
    );
  ELSE
    v_results := v_results || jsonb_build_object(
      'requirement', 'Late Return Cooldown',
      'passed', true,
      'message', 'No active late return cooldown penalties',
      'how_to_fix', ''
    );
  END IF;

  -- 4. Open High-Severity Incidents
  SELECT COUNT(*) INTO v_open_incidents
  FROM incidents i
  JOIN bookings b ON b.id = i.booking_id
  WHERE b.user_id = p_user_id
    AND i.status IN ('open', 'under_review')
    AND i.severity IN ('high', 'critical');

  IF v_open_incidents > 0 THEN
    v_results := v_results || jsonb_build_object(
      'requirement', 'Safety Incidents',
      'passed', false,
      'message', format('You have %s unresolved high-severity safety incident(s)', v_open_incidents),
      'how_to_fix', 'Contact your lab manager or admin to review and close open incidents'
    );
  ELSE
    v_results := v_results || jsonb_build_object(
      'requirement', 'Safety Incidents',
      'passed', true,
      'message', 'Clear safety history with no unresolved major incidents',
      'how_to_fix', ''
    );
  END IF;

  -- 5. Weekly Hours Quota (Fair Allocation)
  SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (end_at - start_at)) / 3600.0), 0)
  INTO v_hours_last_7
  FROM bookings
  WHERE user_id = p_user_id
    AND status IN ('requested', 'pending_review', 'approved', 'checked_out')
    AND start_at >= now() - INTERVAL '7 days';

  IF v_hours_last_7 >= v_settings.max_hours_per_week_per_user THEN
    v_results := v_results || jsonb_build_object(
      'requirement', 'Weekly Usage Limit',
      'passed', false,
      'message', format('You have reserved %s of %s allowed hours this week', round(v_hours_last_7, 1), v_settings.max_hours_per_week_per_user),
      'how_to_fix', 'Wait until next week or release an existing upcoming reservation'
    );
  ELSE
    v_results := v_results || jsonb_build_object(
      'requirement', 'Weekly Usage Limit',
      'passed', true,
      'message', format('%s of %s weekly hours used', round(v_hours_last_7, 1), v_settings.max_hours_per_week_per_user),
      'how_to_fix', ''
    );
  END IF;

  -- 6. Active Bookings Limit
  SELECT COUNT(*) INTO v_active_count
  FROM bookings
  WHERE user_id = p_user_id AND status IN ('approved', 'checked_out');

  IF v_active_count >= v_settings.max_active_bookings_per_user THEN
    v_results := v_results || jsonb_build_object(
      'requirement', 'Active Bookings Limit',
      'passed', false,
      'message', format('Maximum %s concurrent active bookings reached', v_settings.max_active_bookings_per_user),
      'how_to_fix', 'Complete or return an active loan before requesting new slots'
    );
  ELSE
    v_results := v_results || jsonb_build_object(
      'requirement', 'Active Bookings Limit',
      'passed', true,
      'message', format('%s of %s active bookings in progress', v_active_count, v_settings.max_active_bookings_per_user),
      'how_to_fix', ''
    );
  END IF;

  -- 7. Resource-Specific Requirements
  FOR v_req IN
    SELECT * FROM resource_requirements WHERE resource_id = p_resource_id
  LOOP
    v_req_passed := false;
    v_req_msg := '';
    v_how_to_fix := '';

    IF v_req.type = 'training' THEN
      SELECT * INTO v_cred
      FROM user_credentials
      WHERE user_id = p_user_id
        AND type = 'training'
        AND LOWER(name) = LOWER(v_req.value)
        AND status = 'verified'
        AND (expires_at IS NULL OR expires_at > now())
      LIMIT 1;

      IF FOUND THEN
        v_req_passed := true;
        v_req_msg := format('Verified training certification: %s', v_req.value);
      ELSE
        v_req_passed := false;
        v_req_msg := format('Requires verified training: "%s" (%s)', v_req.value, v_req.description);
        v_how_to_fix := format('Complete the training and upload certification "%s" in My Credentials', v_req.value);
      END IF;

    ELSIF v_req.type = 'role' THEN
      IF v_user.role::text = v_req.value OR v_user.role = 'admin' THEN
        v_req_passed := true;
        v_req_msg := format('User role qualifies: %s', v_req.value);
      ELSE
        v_req_passed := false;
        v_req_msg := format('Resource restricted to role: %s (your role is %s)', v_req.value, v_user.role);
        v_how_to_fix := 'This equipment requires special role authorization from the lab administrator';
      END IF;

    ELSIF v_req.type = 'org' THEN
      IF LOWER(v_user.organization) = LOWER(v_req.value) THEN
        v_req_passed := true;
        v_req_msg := format('Affiliated with organization: %s', v_req.value);
      ELSE
        v_req_passed := false;
        v_req_msg := format('Restricted to affiliated organization: %s', v_req.value);
        v_how_to_fix := 'Request partner organization guest access from the department chair';
      END IF;

    ELSIF v_req.type = 'document' THEN
      SELECT * INTO v_cred
      FROM user_credentials
      WHERE user_id = p_user_id
        AND type = 'id_document'
        AND status = 'verified'
      LIMIT 1;

      IF FOUND THEN
        v_req_passed := true;
        v_req_msg := format('Verified required document: %s', v_req.description);
      ELSE
        v_req_passed := false;
        v_req_msg := format('Requires document verification: %s', v_req.description);
        v_how_to_fix := 'Upload required ID document in My Credentials';
      END IF;

    ELSE
      -- Generic passed requirement
      v_req_passed := true;
      v_req_msg := format('Requirement verified: %s', v_req.description);
    END IF;

    v_results := v_results || jsonb_build_object(
      'requirement', v_req.description,
      'passed', v_req_passed,
      'message', v_req_msg,
      'how_to_fix', v_how_to_fix
    );
  END LOOP;

  RETURN v_results;
END;
$$;

-- =====================================================
-- 2. PRIORITY SCORE CALCULATION (Section 7)
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_priority_score(
  p_user_id UUID,
  p_requested_at TIMESTAMPTZ,
  p_has_project_need BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_settings fair_use_settings%ROWTYPE;
  v_hours_30 NUMERIC;
  v_rel_score INTEGER;
  v_waiting_hours NUMERIC;
  v_hours_factor NUMERIC;
  v_wait_factor NUMERIC;
  v_rel_factor NUMERIC;
  v_proj_factor NUMERIC;
  v_total_score NUMERIC;
BEGIN
  SELECT * INTO v_settings FROM fair_use_settings WHERE id = 1;

  -- 1. Hours used in last 30 days (fewer hours -> higher score, scale 0 to 40)
  SELECT COALESCE(hours_last_30_days, 0) INTO v_hours_30
  FROM usage_stats WHERE user_id = p_user_id;
  v_hours_factor := GREATEST(0, 40.0 - (COALESCE(v_hours_30, 0) * 1.5));

  -- 2. Time waiting (scale 0 to 30)
  v_waiting_hours := EXTRACT(EPOCH FROM (now() - p_requested_at)) / 3600.0;
  v_wait_factor := LEAST(30.0, v_waiting_hours * 1.0);

  -- 3. Reliability score (scale 0 to 20)
  SELECT COALESCE(reliability_score, 80) INTO v_rel_score
  FROM reliability_scores WHERE user_id = p_user_id;
  v_rel_factor := (COALESCE(v_rel_score, 80) / 100.0) * 20.0;

  -- 4. Academic/Project Need bonus (scale 0 to 10)
  v_proj_factor := CASE WHEN p_has_project_need THEN 10.0 ELSE 0.0 END;

  v_total_score := round(v_hours_factor + v_wait_factor + v_rel_factor + v_proj_factor, 2);

  RETURN jsonb_build_object(
    'priority_score', v_total_score,
    'breakdown', jsonb_build_object(
      'hours_factor', round(v_hours_factor, 1),
      'wait_factor', round(v_wait_factor, 1),
      'reliability_factor', round(v_rel_factor, 1),
      'project_need_bonus', v_proj_factor,
      'hours_used_30_days', round(COALESCE(v_hours_30, 0), 1),
      'reliability_score', COALESCE(v_rel_score, 80)
    )
  );
END;
$$;

-- =====================================================
-- 3. REQUEST BOOKING (Section 5, 6, 7, 12)
-- =====================================================
CREATE OR REPLACE FUNCTION request_booking(
  p_resource_id UUID,
  p_start_at TIMESTAMPTZ,
  p_end_at TIMESTAMPTZ,
  p_purpose TEXT,
  p_project_need TEXT DEFAULT NULL
)
RETURNS bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_caller_role user_role;
  v_resource resources%ROWTYPE;
  v_duration_minutes INTEGER;
  v_start_weekday INTEGER;
  v_has_availability BOOLEAN;
  v_has_blackout BOOLEAN;
  v_eligibility_list JSONB;
  v_all_eligible BOOLEAN := true;
  v_item JSONB;
  v_has_conflict BOOLEAN;
  v_booking bookings;
  v_waitlist_pos INTEGER := NULL;
  v_priority_info JSONB;
  v_initial_status booking_status;
  v_decision_reason TEXT := NULL;
  v_rule_applied TEXT := NULL;
BEGIN
  -- Authenticated check
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to request a booking';
  END IF;

  SELECT role INTO v_caller_role FROM profiles WHERE id = v_user_id;

  -- Input validations
  IF p_start_at >= p_end_at THEN
    RAISE EXCEPTION 'Invalid booking window: start time must be before end time';
  END IF;

  IF p_start_at < now() - INTERVAL '5 minutes' THEN
    RAISE EXCEPTION 'Cannot book a slot in the past';
  END IF;

  IF p_purpose IS NULL OR trim(p_purpose) = '' THEN
    RAISE EXCEPTION 'Booking purpose is required';
  END IF;

  -- SECTION 12: Serialized concurrency lock on resource row
  SELECT * INTO v_resource FROM resources WHERE id = p_resource_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Resource not found';
  END IF;

  IF v_resource.status != 'active' THEN
    RAISE EXCEPTION 'Resource is currently not active (%s)', v_resource.status;
  END IF;

  -- Duration validation
  v_duration_minutes := EXTRACT(EPOCH FROM (p_end_at - p_start_at)) / 60.0;
  IF v_duration_minutes < v_resource.min_booking_minutes THEN
    RAISE EXCEPTION 'Booking duration (%s mins) is below the minimum allowed (%s mins)',
      v_duration_minutes, v_resource.min_booking_minutes;
  END IF;

  IF v_duration_minutes > v_resource.max_booking_minutes THEN
    RAISE EXCEPTION 'Booking duration (%s mins) exceeds the maximum allowed (%s mins)',
      v_duration_minutes, v_resource.max_booking_minutes;
  END IF;

  IF p_start_at > now() + (v_resource.advance_booking_days || ' days')::interval THEN
    RAISE EXCEPTION 'Cannot book more than %s days in advance', v_resource.advance_booking_days;
  END IF;

  -- Weekly schedule availability check
  v_start_weekday := EXTRACT(DOW FROM p_start_at);
  SELECT EXISTS (
    SELECT 1 FROM resource_availability
    WHERE resource_id = p_resource_id
      AND weekday = v_start_weekday
      AND start_time <= p_start_at::time
      AND end_time >= p_end_at::time
  ) INTO v_has_availability;

  -- If specific schedules are defined, enforce them
  IF EXISTS (SELECT 1 FROM resource_availability WHERE resource_id = p_resource_id) AND NOT v_has_availability THEN
    RAISE EXCEPTION 'Requested time falls outside the published operating hours for this resource on this weekday';
  END IF;

  -- Blackout check
  SELECT EXISTS (
    SELECT 1 FROM resource_blackouts
    WHERE resource_id = p_resource_id
      AND tstzrange(start_at, end_at, '[)') && tstzrange(p_start_at, p_end_at, '[)')
  ) INTO v_has_blackout;

  IF v_has_blackout THEN
    RAISE EXCEPTION 'Requested time overlaps with a scheduled maintenance blackout';
  END IF;

  -- Run Eligibility Engine
  v_eligibility_list := check_eligibility(v_user_id, p_resource_id);
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_eligibility_list)
  LOOP
    IF (v_item->>'passed')::boolean = false THEN
      v_all_eligible := false;
      EXIT;
    END IF;
  END LOOP;

  IF NOT v_all_eligible THEN
    v_initial_status := 'eligibility_failed';
    v_decision_reason := 'Automated eligibility check failed. Review requirements and upload needed credentials.';
    v_rule_applied := 'Eligibility Engine (Prerequisites Check)';
  ELSE
    -- Check slot conflict with approved / checked_out bookings
    SELECT EXISTS (
      SELECT 1 FROM bookings
      WHERE resource_id = p_resource_id
        AND status IN ('approved', 'checked_out')
        AND tstzrange(start_at, end_at, '[)') && tstzrange(p_start_at, p_end_at, '[)')
    ) INTO v_has_conflict;

    IF v_has_conflict THEN
      -- Slot taken: place in waitlist
      v_initial_status := 'waitlisted';
      SELECT COALESCE(MAX(waitlist_position), 0) + 1 INTO v_waitlist_pos
      FROM bookings
      WHERE resource_id = p_resource_id AND status = 'waitlisted';

      v_decision_reason := format('Slot is reserved by an active booking. You have been placed on the transparent waitlist at position #%s.', v_waitlist_pos);
      v_rule_applied := 'Waitlist Queuing & Fair Priority Formula';
    ELSIF NOT v_resource.requires_approval THEN
      -- Auto-approve
      v_initial_status := 'approved';
      v_decision_reason := 'Auto-approved: all requirements met; this resource needs no manual approval.';
      v_rule_applied := 'Instant Access (No Manual Review Needed)';
    ELSE
      -- Normal pending review
      v_initial_status := 'pending_review';
      v_decision_reason := 'Requirements verified automatically. Request forwarded to lab manager for slot confirmation.';
      v_rule_applied := 'Manager Authorization Required';
    END IF;
  END IF;

  -- Compute priority score
  v_priority_info := calculate_priority_score(v_user_id, now(), (p_project_need IS NOT NULL AND length(trim(p_project_need)) > 0));

  -- Insert Booking
  INSERT INTO bookings (
    resource_id,
    user_id,
    start_at,
    end_at,
    purpose,
    project_need,
    status,
    decision_reason,
    rule_applied,
    eligibility_snapshot,
    waitlist_position,
    priority_score,
    priority_breakdown,
    requested_at,
    decided_at
  ) VALUES (
    p_resource_id,
    v_user_id,
    p_start_at,
    p_end_at,
    p_purpose,
    p_project_need,
    v_initial_status,
    v_decision_reason,
    v_rule_applied,
    v_eligibility_list,
    v_waitlist_pos,
    (v_priority_info->>'priority_score')::numeric,
    (v_priority_info->'breakdown'),
    now(),
    CASE WHEN v_initial_status = 'approved' THEN now() ELSE NULL END
  ) RETURNING * INTO v_booking;

  -- Audit Log
  PERFORM log_audit_event(
    v_user_id,
    v_caller_role::text,
    'BOOKING_REQUESTED',
    'booking',
    v_booking.id,
    v_booking.id,
    p_resource_id,
    jsonb_build_object(
      'status', v_initial_status,
      'start_at', p_start_at,
      'end_at', p_end_at,
      'waitlist_pos', v_waitlist_pos,
      'rule_applied', v_rule_applied
    )
  );

  -- Notifications
  PERFORM create_notification(
    v_user_id,
    'booking_status',
    format('Booking %s: %s', v_initial_status, v_resource.name),
    v_decision_reason,
    format('/bookings/%s', v_booking.id)
  );

  IF v_initial_status = 'pending_review' THEN
    PERFORM create_notification(
      v_resource.owner_id,
      'pending_review',
      format('New Request: %s', v_resource.name),
      format('A new booking request requires your review from %s to %s', p_start_at, p_end_at),
      format('/owner/requests?resource=%s', p_resource_id)
    );
  END IF;

  RETURN v_booking;
END;
$$;

-- =====================================================
-- 4. PROMOTE WAITLIST (Section 5, 7)
-- =====================================================
CREATE OR REPLACE FUNCTION promote_waitlist(
  p_resource_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_waitlist_booking bookings%ROWTYPE;
  v_resource resources%ROWTYPE;
  v_new_status booking_status;
  v_reason TEXT;
  v_updated_pos INTEGER := 1;
  v_rec RECORD;
BEGIN
  SELECT * INTO v_resource FROM resources WHERE id = p_resource_id;

  -- Select top priority waitlisted booking
  SELECT * INTO v_waitlist_booking
  FROM bookings
  WHERE resource_id = p_resource_id
    AND status = 'waitlisted'
  ORDER BY priority_score DESC, requested_at ASC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF NOT v_resource.requires_approval THEN
    v_new_status := 'approved';
    v_reason := 'Auto-promoted from waitlist: previous booking was cancelled and resource requires no manual approval.';
  ELSE
    v_new_status := 'pending_review';
    v_reason := 'Auto-promoted from waitlist: slot became available; moved to manager review queue.';
  END IF;

  UPDATE bookings
  SET status = v_new_status,
      waitlist_position = NULL,
      decision_reason = v_reason,
      decided_at = CASE WHEN v_new_status = 'approved' THEN now() ELSE decided_at END
  WHERE id = v_waitlist_booking.id;

  -- Renumber remaining waitlist
  FOR v_rec IN
    SELECT id FROM bookings
    WHERE resource_id = p_resource_id AND status = 'waitlisted'
    ORDER BY priority_score DESC, requested_at ASC
  LOOP
    UPDATE bookings SET waitlist_position = v_updated_pos WHERE id = v_rec.id;
    v_updated_pos := v_updated_pos + 1;
  END LOOP;

  -- Audit Log
  PERFORM log_audit_event(
    NULL,
    'system',
    'WAITLIST_PROMOTED',
    'booking',
    v_waitlist_booking.id,
    v_waitlist_booking.id,
    p_resource_id,
    jsonb_build_object(
      'new_status', v_new_status,
      'user_id', v_waitlist_booking.user_id,
      'reason', v_reason
    )
  );

  -- Notify user
  PERFORM create_notification(
    v_waitlist_booking.user_id,
    'waitlist_promoted',
    format('Promoted from Waitlist: %s', v_resource.name),
    v_reason,
    format('/bookings/%s', v_waitlist_booking.id)
  );

  RETURN v_waitlist_booking.id;
END;
$$;

-- =====================================================
-- 5. TRANSITION BOOKING (Section 5 State Machine)
-- Single atomic entry point for all booking state changes
-- =====================================================
CREATE OR REPLACE FUNCTION transition_booking(
  p_booking_id UUID,
  p_new_status booking_status,
  p_reason TEXT
)
RETURNS bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_caller_role user_role;
  v_booking bookings%ROWTYPE;
  v_resource resources%ROWTYPE;
  v_is_owner_or_mgr BOOLEAN;
  v_is_borrower BOOLEAN;
  v_is_adm BOOLEAN;
  v_has_conflict BOOLEAN;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required to update booking state';
  END IF;

  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'A plain-language decision reason is required for every state transition';
  END IF;

  SELECT role INTO v_caller_role FROM profiles WHERE id = v_caller;
  v_is_adm := (v_caller_role = 'admin');

  -- Lock booking and resource
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  SELECT * INTO v_resource FROM resources WHERE id = v_booking.resource_id FOR UPDATE;

  v_is_borrower := (v_booking.user_id = v_caller);
  v_is_owner_or_mgr := (v_resource.owner_id = v_caller OR EXISTS (
    SELECT 1 FROM resource_managers WHERE resource_id = v_resource.id AND manager_id = v_caller
  ));

  -- State Transition Validation Engine
  IF p_new_status = 'approved' THEN
    IF NOT (v_is_owner_or_mgr OR v_is_adm) THEN
      RAISE EXCEPTION 'Only resource owners, managers, or admins can approve bookings';
    END IF;
    IF v_booking.status != 'pending_review' THEN
      RAISE EXCEPTION 'Cannot approve booking from status "%s" (expected "pending_review")', v_booking.status;
    END IF;

    -- Concurrency check: verify no overlapping approved/checked_out booking exists
    SELECT EXISTS (
      SELECT 1 FROM bookings
      WHERE resource_id = v_booking.resource_id
        AND id != v_booking.id
        AND status IN ('approved', 'checked_out')
        AND tstzrange(start_at, end_at, '[)') && tstzrange(v_booking.start_at, v_booking.end_at, '[)')
    ) INTO v_has_conflict;

    IF v_has_conflict THEN
      RAISE EXCEPTION 'This slot was just taken. Please choose another time or join the waitlist.';
    END IF;

    v_booking.status := 'approved';
    v_booking.decided_by := v_caller;
    v_booking.decided_at := now();
    v_booking.decision_reason := p_reason;

  ELSIF p_new_status = 'rejected' THEN
    IF NOT (v_is_owner_or_mgr OR v_is_adm) THEN
      RAISE EXCEPTION 'Only resource owners, managers, or admins can reject bookings';
    END IF;
    IF v_booking.status NOT IN ('pending_review', 'requested') THEN
      RAISE EXCEPTION 'Cannot reject booking from status "%s"', v_booking.status;
    END IF;

    v_booking.status := 'rejected';
    v_booking.decided_by := v_caller;
    v_booking.decided_at := now();
    v_booking.decision_reason := p_reason;

  ELSIF p_new_status = 'waitlisted' THEN
    IF NOT (v_is_owner_or_mgr OR v_is_adm) THEN
      RAISE EXCEPTION 'Only resource owners, managers, or admins can move requests to waitlist';
    END IF;
    IF v_booking.status != 'pending_review' THEN
      RAISE EXCEPTION 'Cannot waitlist booking from status "%s"', v_booking.status;
    END IF;

    SELECT COALESCE(MAX(waitlist_position), 0) + 1 INTO v_booking.waitlist_position
    FROM bookings WHERE resource_id = v_booking.resource_id AND status = 'waitlisted';

    v_booking.status := 'waitlisted';
    v_booking.decided_by := v_caller;
    v_booking.decided_at := now();
    v_booking.decision_reason := p_reason;

  ELSIF p_new_status = 'cancelled' THEN
    IF NOT (v_is_borrower OR v_is_owner_or_mgr OR v_is_adm) THEN
      RAISE EXCEPTION 'Unauthorized to cancel this booking';
    END IF;
    IF v_booking.status NOT IN ('requested', 'pending_review', 'approved', 'waitlisted') THEN
      RAISE EXCEPTION 'Cannot cancel booking in active or finished state "%s"', v_booking.status;
    END IF;

    v_booking.status := 'cancelled';
    v_booking.decision_reason := p_reason;

  ELSIF p_new_status = 'no_show' THEN
    IF NOT (v_is_owner_or_mgr OR v_is_adm) THEN
      RAISE EXCEPTION 'Unauthorized to record no-show';
    END IF;
    IF v_booking.status != 'approved' THEN
      RAISE EXCEPTION 'No-show can only be applied to approved bookings';
    END IF;

    v_booking.status := 'no_show';
    v_booking.decision_reason := p_reason;

  ELSIF p_new_status = 'closed' THEN
    IF NOT (v_is_owner_or_mgr OR v_is_adm) THEN
      RAISE EXCEPTION 'Unauthorized to close booking';
    END IF;
    IF v_booking.status NOT IN ('returned', 'returned_late', 'disputed') THEN
      RAISE EXCEPTION 'Cannot close booking from status "%s"', v_booking.status;
    END IF;

    v_booking.status := 'closed';
    v_booking.decision_reason := p_reason;

  ELSE
    RAISE EXCEPTION 'Direct transition to status "%s" not permitted via transition_booking. Use dedicated action RPC (check_in, return_booking).', p_new_status;
  END IF;

  -- Commit update
  UPDATE bookings
  SET status = v_booking.status,
      decision_reason = v_booking.decision_reason,
      decided_by = v_booking.decided_by,
      decided_at = v_booking.decided_at,
      waitlist_position = v_booking.waitlist_position
  WHERE id = v_booking.id
  RETURNING * INTO v_booking;

  -- Audit Log
  PERFORM log_audit_event(
    v_caller,
    v_caller_role::text,
    format('BOOKING_%s', upper(p_new_status::text)),
    'booking',
    v_booking.id,
    v_booking.id,
    v_resource.id,
    jsonb_build_object(
      'new_status', p_new_status,
      'reason', p_reason
    )
  );

  -- Notification
  PERFORM create_notification(
    v_booking.user_id,
    'booking_status',
    format('Booking %s: %s', upper(p_new_status::text), v_resource.name),
    p_reason,
    format('/bookings/%s', v_booking.id)
  );

  -- Auto-promote waitlist if a previously reserved slot was freed
  IF p_new_status = 'cancelled' THEN
    PERFORM promote_waitlist(v_resource.id);
  END IF;

  RETURN v_booking;
END;
$$;

-- =====================================================
-- 6. CHECK IN (Section 5, 8)
-- =====================================================
CREATE OR REPLACE FUNCTION check_in(
  p_booking_id UUID,
  p_condition item_condition,
  p_notes TEXT,
  p_photos TEXT[] DEFAULT '{}'
)
RETURNS bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_caller_role user_role;
  v_booking bookings%ROWTYPE;
  v_resource resources%ROWTYPE;
  v_is_borrower BOOLEAN;
  v_is_owner_or_mgr BOOLEAN;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required to check in';
  END IF;

  SELECT role INTO v_caller_role FROM profiles WHERE id = v_caller;

  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  SELECT * INTO v_resource FROM resources WHERE id = v_booking.resource_id;

  v_is_borrower := (v_booking.user_id = v_caller);
  v_is_owner_or_mgr := (v_resource.owner_id = v_caller OR EXISTS (
    SELECT 1 FROM resource_managers WHERE resource_id = v_resource.id AND manager_id = v_caller
  ));

  IF NOT (v_is_borrower OR v_is_owner_or_mgr OR v_caller_role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized to perform check-in for this booking';
  END IF;

  IF v_booking.status != 'approved' THEN
    RAISE EXCEPTION 'Check-in is only permitted for approved bookings (current status: %s)', v_booking.status;
  END IF;

  -- Record condition report (phase = before)
  INSERT INTO condition_reports (
    booking_id, phase, condition, notes, photos, recorded_by, recorded_at
  ) VALUES (
    v_booking.id, 'before', p_condition, COALESCE(p_notes, 'Initial condition inspected and accepted'), p_photos, v_caller, now()
  );

  -- Transition booking to checked_out
  UPDATE bookings
  SET status = 'checked_out',
      checked_in_at = now()
  WHERE id = v_booking.id
  RETURNING * INTO v_booking;

  -- Audit Log
  PERFORM log_audit_event(
    v_caller,
    v_caller_role::text,
    'BOOKING_CHECKED_OUT',
    'booking',
    v_booking.id,
    v_booking.id,
    v_resource.id,
    jsonb_build_object(
      'condition', p_condition,
      'notes', p_notes
    )
  );

  -- Notify parties
  PERFORM create_notification(
    v_resource.owner_id,
    'check_in',
    format('Equipment Checked Out: %s', v_resource.name),
    format('User checked in and confirmed initial condition as %s', p_condition),
    format('/bookings/%s', v_booking.id)
  );

  RETURN v_booking;
END;
$$;

-- =====================================================
-- 7. RETURN BOOKING (Section 5, 8)
-- =====================================================
CREATE OR REPLACE FUNCTION return_booking(
  p_booking_id UUID,
  p_condition item_condition,
  p_notes TEXT,
  p_photos TEXT[] DEFAULT '{}',
  p_flag_damage BOOLEAN DEFAULT false,
  p_incident_description TEXT DEFAULT NULL
)
RETURNS bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_caller_role user_role;
  v_booking bookings%ROWTYPE;
  v_resource resources%ROWTYPE;
  v_is_borrower BOOLEAN;
  v_is_owner_or_mgr BOOLEAN;
  v_new_status booking_status;
  v_is_late BOOLEAN;
  v_incident_id UUID := NULL;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required to return equipment';
  END IF;

  SELECT role INTO v_caller_role FROM profiles WHERE id = v_caller;

  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  SELECT * INTO v_resource FROM resources WHERE id = v_booking.resource_id;

  v_is_borrower := (v_booking.user_id = v_caller);
  v_is_owner_or_mgr := (v_resource.owner_id = v_caller OR EXISTS (
    SELECT 1 FROM resource_managers WHERE resource_id = v_resource.id AND manager_id = v_caller
  ));

  IF NOT (v_is_borrower OR v_is_owner_or_mgr OR v_caller_role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized to perform return for this booking';
  END IF;

  IF v_booking.status NOT IN ('checked_out', 'overdue') THEN
    RAISE EXCEPTION 'Cannot return booking from status "%s" (expected checked_out or overdue)', v_booking.status;
  END IF;

  v_is_late := (now() > v_booking.end_at);

  -- Record condition report (phase = after)
  INSERT INTO condition_reports (
    booking_id, phase, condition, notes, photos, recorded_by, recorded_at
  ) VALUES (
    v_booking.id, 'after', p_condition, COALESCE(p_notes, 'Return condition recorded'), p_photos, v_caller, now()
  );

  -- Determine final status & handle damage/incidents
  IF p_flag_damage OR p_condition = 'damaged' THEN
    v_new_status := 'disputed';

    INSERT INTO incidents (
      booking_id, resource_id, reported_by, type, severity, description, status, ai_summary
    ) VALUES (
      v_booking.id,
      v_resource.id,
      v_caller,
      'damage',
      'high',
      COALESCE(p_incident_description, p_notes, 'Equipment returned with observed damage.'),
      'open',
      format('AI-generated summary - review before acting: Damage flagged during return inspection for %s. Borrower recorded condition as %s.', v_resource.name, p_condition)
    ) RETURNING id INTO v_incident_id;

  ELSIF v_is_late THEN
    v_new_status := 'returned_late';
  ELSE
    v_new_status := 'closed';
  END IF;

  UPDATE bookings
  SET status = v_new_status,
      returned_at = now(),
      is_overdue = false
  WHERE id = v_booking.id
  RETURNING * INTO v_booking;

  -- Audit Log
  PERFORM log_audit_event(
    v_caller,
    v_caller_role::text,
    format('BOOKING_%s', upper(v_new_status::text)),
    'booking',
    v_booking.id,
    v_booking.id,
    v_resource.id,
    jsonb_build_object(
      'condition', p_condition,
      'is_late', v_is_late,
      'flag_damage', p_flag_damage,
      'incident_id', v_incident_id
    )
  );

  -- Notifications
  PERFORM create_notification(
    v_booking.user_id,
    'booking_returned',
    format('Equipment Returned: %s', v_resource.name),
    format('Return recorded successfully (%s condition). Status: %s', p_condition, v_new_status),
    format('/bookings/%s', v_booking.id)
  );

  PERFORM create_notification(
    v_resource.owner_id,
    'booking_returned',
    format('Return Completed: %s', v_resource.name),
    format('Item returned by borrower. Final condition: %s. Booking status: %s', p_condition, v_new_status),
    format('/bookings/%s', v_booking.id)
  );

  RETURN v_booking;
END;
$$;

-- =====================================================
-- 8. EXTENSION REQUEST (Section 5)
-- =====================================================
CREATE OR REPLACE FUNCTION request_extension(
  p_booking_id UUID,
  p_new_end_at TIMESTAMPTZ,
  p_reason TEXT
)
RETURNS bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_booking bookings%ROWTYPE;
  v_has_conflict BOOLEAN;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF v_booking.user_id != v_caller THEN
    RAISE EXCEPTION 'Only the borrower can request an extension';
  END IF;

  IF v_booking.status != 'checked_out' THEN
    RAISE EXCEPTION 'Extensions can only be requested for active checked_out bookings';
  END IF;

  IF p_new_end_at <= v_booking.end_at THEN
    RAISE EXCEPTION 'New end time must be later than current end time (%s)', v_booking.end_at;
  END IF;

  -- Conflict check with future bookings
  SELECT EXISTS (
    SELECT 1 FROM bookings
    WHERE resource_id = v_booking.resource_id
      AND id != v_booking.id
      AND status IN ('approved', 'checked_out')
      AND tstzrange(start_at, end_at, '[)') && tstzrange(v_booking.end_at, p_new_end_at, '[)')
  ) INTO v_has_conflict;

  IF v_has_conflict THEN
    RAISE EXCEPTION 'Cannot extend: slot is reserved by another booking or is in a blackout period.';
  END IF;

  UPDATE bookings
  SET end_at = p_new_end_at,
      decision_reason = format('Extended until %s. Reason: %s', p_new_end_at, p_reason)
  WHERE id = v_booking.id
  RETURNING * INTO v_booking;

  PERFORM log_audit_event(
    v_caller,
    'user',
    'BOOKING_EXTENDED',
    'booking',
    v_booking.id,
    v_booking.id,
    v_booking.resource_id,
    jsonb_build_object('new_end_at', p_new_end_at, 'reason', p_reason)
  );

  RETURN v_booking;
END;
$$;

-- =====================================================
-- 9. INCIDENTS (Section 8, 10)
-- =====================================================
CREATE OR REPLACE FUNCTION report_incident(
  p_booking_id UUID,
  p_resource_id UUID,
  p_type incident_type,
  p_severity incident_severity,
  p_description TEXT
)
RETURNS incidents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_caller_role user_role;
  v_incident incidents;
  v_summary TEXT;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required to report incident';
  END IF;

  SELECT role INTO v_caller_role FROM profiles WHERE id = v_caller;

  v_summary := format('AI-generated summary - review before acting: %s incident reported with %s severity: %s',
    p_type, p_severity, substring(p_description, 1, 140));

  INSERT INTO incidents (
    booking_id, resource_id, reported_by, type, severity, description, status, ai_summary
  ) VALUES (
    p_booking_id, p_resource_id, v_caller, p_type, p_severity, p_description, 'open', v_summary
  ) RETURNING * INTO v_incident;

  IF p_booking_id IS NOT NULL AND (p_type = 'damage' OR p_severity IN ('high', 'critical')) THEN
    UPDATE bookings SET status = 'disputed' WHERE id = p_booking_id;
  END IF;

  PERFORM log_audit_event(
    v_caller,
    v_caller_role::text,
    'INCIDENT_REPORTED',
    'incident',
    v_incident.id,
    p_booking_id,
    p_resource_id,
    jsonb_build_object('type', p_type, 'severity', p_severity)
  );

  RETURN v_incident;
END;
$$;

CREATE OR REPLACE FUNCTION resolve_incident(
  p_incident_id UUID,
  p_status incident_status,
  p_resolution_note TEXT
)
RETURNS incidents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_caller_role user_role;
  v_incident incidents%ROWTYPE;
  v_resource resources%ROWTYPE;
  v_is_mgr BOOLEAN;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT role INTO v_caller_role FROM profiles WHERE id = v_caller;

  SELECT * INTO v_incident FROM incidents WHERE id = p_incident_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Incident not found';
  END IF;

  SELECT * INTO v_resource FROM resources WHERE id = v_incident.resource_id;
  v_is_mgr := (v_resource.owner_id = v_caller OR EXISTS (
    SELECT 1 FROM resource_managers WHERE resource_id = v_resource.id AND manager_id = v_caller
  ));

  IF NOT (v_is_mgr OR v_caller_role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized to resolve incidents for this resource';
  END IF;

  UPDATE incidents
  SET status = p_status,
      resolution_note = p_resolution_note,
      resolved_by = v_caller,
      resolved_at = now()
  WHERE id = p_incident_id
  RETURNING * INTO v_incident;

  -- If booking was disputed and incident is resolved/dismissed, close booking if no other open incident
  IF v_incident.booking_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM incidents
      WHERE booking_id = v_incident.booking_id
        AND id != p_incident_id
        AND status IN ('open', 'under_review')
    ) THEN
      UPDATE bookings SET status = 'closed' WHERE id = v_incident.booking_id AND status = 'disputed';
    END IF;
  END IF;

  PERFORM log_audit_event(
    v_caller,
    v_caller_role::text,
    'INCIDENT_RESOLVED',
    'incident',
    v_incident.id,
    v_incident.booking_id,
    v_incident.resource_id,
    jsonb_build_object('status', p_status, 'note', p_resolution_note)
  );

  RETURN v_incident;
END;
$$;

-- =====================================================
-- 10. REFRESH STATUS (Overdue & No-Show Automation)
-- =====================================================
CREATE OR REPLACE FUNCTION refresh_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_overdue_count INTEGER := 0;
  v_noshow_count INTEGER := 0;
  v_b RECORD;
BEGIN
  -- 1. Mark overdue bookings (checked_out past end_at)
  FOR v_b IN
    SELECT id, resource_id, user_id FROM bookings
    WHERE status = 'checked_out' AND end_at < now()
  LOOP
    UPDATE bookings
    SET is_overdue = true, status = 'overdue'
    WHERE id = v_b.id;

    v_overdue_count := v_overdue_count + 1;

    PERFORM create_notification(
      v_b.user_id,
      'overdue',
      'Equipment Return Overdue',
      'Your booked equipment is past its scheduled return time. Please return it immediately.',
      format('/bookings/%s/return', v_b.id)
    );
  END LOOP;

  -- 2. Mark no-shows (approved bookings 30 mins past start_at with no check_in)
  FOR v_b IN
    SELECT id, resource_id, user_id FROM bookings
    WHERE status = 'approved' AND start_at < now() - INTERVAL '30 minutes'
  LOOP
    UPDATE bookings
    SET status = 'no_show',
        decision_reason = 'Cancelled due to no-show: user did not check in within the 30-minute grace window.'
    WHERE id = v_b.id;

    v_noshow_count := v_noshow_count + 1;

    -- Promote waitlist if applicable
    PERFORM promote_waitlist(v_b.resource_id);

    PERFORM create_notification(
      v_b.user_id,
      'no_show',
      'Booking Cancelled (No-Show)',
      'You did not check in within 30 minutes of reservation start time. The slot has been released.',
      format('/bookings/%s', v_b.id)
    );
  END LOOP;

  RETURN jsonb_build_object(
    'overdue_marked', v_overdue_count,
    'noshow_marked', v_noshow_count,
    'timestamp', now()
  );
END;
$$;

-- =====================================================
-- 11. ADMIN VERIFICATIONS & DEMO RESET
-- =====================================================
CREATE OR REPLACE FUNCTION verify_user(
  p_user_id UUID,
  p_verified BOOLEAN
)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_caller_role user_role;
  v_profile profiles;
BEGIN
  SELECT role INTO v_caller_role FROM profiles WHERE id = v_caller;
  IF v_caller_role != 'admin' THEN
    RAISE EXCEPTION 'Admin authorization required to verify users';
  END IF;

  UPDATE profiles
  SET is_verified = p_verified,
      verified_by = v_caller,
      verified_at = CASE WHEN p_verified THEN now() ELSE NULL END
  WHERE id = p_user_id
  RETURNING * INTO v_profile;

  PERFORM log_audit_event(
    v_caller,
    'admin',
    CASE WHEN p_verified THEN 'USER_VERIFIED' ELSE 'USER_UNVERIFIED' END,
    'profile',
    p_user_id,
    NULL,
    NULL,
    jsonb_build_object('verified', p_verified)
  );

  RETURN v_profile;
END;
$$;

CREATE OR REPLACE FUNCTION verify_credential(
  p_credential_id UUID,
  p_status credential_status,
  p_review_note TEXT
)
RETURNS user_credentials
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_caller_role user_role;
  v_cred user_credentials;
BEGIN
  SELECT role INTO v_caller_role FROM profiles WHERE id = v_caller;
  IF v_caller_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Authorization required to review credentials';
  END IF;

  UPDATE user_credentials
  SET status = p_status,
      reviewed_by = v_caller,
      reviewed_at = now(),
      review_note = p_review_note
  WHERE id = p_credential_id
  RETURNING * INTO v_cred;

  PERFORM create_notification(
    v_cred.user_id,
    'credential_reviewed',
    format('Credential %s: %s', p_status, v_cred.name),
    COALESCE(p_review_note, format('Your submitted credential has been %s.', p_status)),
    '/credentials'
  );

  RETURN v_cred;
END;
$$;

CREATE OR REPLACE FUNCTION admin_suspend_user(
  p_user_id UUID,
  p_suspend BOOLEAN,
  p_reason TEXT
)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_caller_role user_role;
  v_profile profiles;
BEGIN
  SELECT role INTO v_caller_role FROM profiles WHERE id = v_caller;
  IF v_caller_role != 'admin' THEN
    RAISE EXCEPTION 'Admin authorization required to suspend accounts';
  END IF;

  UPDATE profiles
  SET is_suspended = p_suspend,
      suspension_reason = CASE WHEN p_suspend THEN p_reason ELSE NULL END
  WHERE id = p_user_id
  RETURNING * INTO v_profile;

  PERFORM log_audit_event(
    v_caller,
    'admin',
    CASE WHEN p_suspend THEN 'USER_SUSPENDED' ELSE 'USER_UNSUSPENDED' END,
    'profile',
    p_user_id,
    NULL,
    NULL,
    jsonb_build_object('suspended', p_suspend, 'reason', p_reason)
  );

  RETURN v_profile;
END;
$$;

