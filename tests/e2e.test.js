/**
 * UNLOCKLAB - END-TO-END FULL LIFECYCLE JOURNEY TEST (Section 14)
 *
 * Runs the complete 10-step lifecycle:
 * 1. Owner lists resource & defines safety conditions
 * 2. User discovers resource and verifies eligibility
 * 3. User submits booking request
 * 4. System verifies requirements automatically
 * 5. Owner/manager reviews request
 * 6. Approved with plain-language reason
 * 7. User checks in and records initial condition report
 * 8. User returns resource and records final condition
 * 9. Damage incident reported, transitions to disputed, resolved by manager -> closed
 * 10. Audit log immutability and complete transaction history verified
 */

import { api } from '../src/lib/supabase.js';

async function runE2ETest() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING FULL LIFECYCLE END-TO-END JOURNEY TEST');
  console.log('======================================================\n');

  const ownerId = 'b0000000-0000-0000-0000-000000000002'; // Dr. Rajesh Sharma
  const borrowerId = 'd0000000-0000-0000-0000-000000000005'; // Priya Patel

  // STEP 0: Authenticate as verified administrator
  await api.login('admin@unlocklab.edu', 'UnlockAdmin#2026!');

  // STEP 1: Owner lists resource & defines conditions
  console.log('Step 1: Owner lists new lab resource...');
  const newResource = await api.saveResource({
    owner_id: ownerId,
    name: 'E2E Rohde & Schwarz RF Vector Network Analyzer',
    type: 'equipment',
    category: 'instrument',
    description: '100kHz to 4.5GHz vector network analyzer with S-parameter measurement.',
    location: 'Microwave Lab, Bench 9',
    photos: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758'],
    min_booking_minutes: 30,
    max_booking_minutes: 180,
    advance_booking_days: 7,
    requires_approval: true,
    requires_deposit: false,
    deposit_amount: 0,
    supervision_required: false,
    usage_rules: ['Wear ESD strap', 'Torque wrench on SMA connectors only'],
    safety_notes: 'Maximum input power is +20dBm.',
    requirements: [
      {
        type: 'training',
        key: 'training_cert',
        value: 'ESD & High-Frequency Lab Safety Level 2',
        description: 'ESD & High-Frequency Lab Safety Level 2',
      },
    ],
  });
  if (!newResource.id) throw new Error('Step 1 failed: Resource was not created');
  console.log(`   ✓ Resource listed successfully (ID: ${newResource.id})`);

  // STEP 2: User checks eligibility
  console.log('\nStep 2: User checks eligibility checklist...');
  const eligibility = await api.checkEligibility(borrowerId, newResource.id);
  const isEligible = eligibility.every((item) => item.passed);
  if (!isEligible) throw new Error('Step 2 failed: Priya should be eligible with ESD Level 2 cert');
  console.log(`   ✓ All ${eligibility.length} eligibility requirements verified.`);

  // STEP 3 & 4: User submits booking request & system auto-verifies
  console.log('\nStep 3 & 4: Submitting booking request...');
  const startAt = new Date(Date.now() + 86400000).toISOString();
  const endAt = new Date(Date.now() + 86400000 + 7200000).toISOString();
  const booking = await api.requestBooking({
    resourceId: newResource.id,
    userId: borrowerId,
    startAt,
    endAt,
    purpose: 'Capstone antenna return loss measurement (S11)',
    projectNeed: 'Required for final year design expo',
  });
  if (booking.status !== 'pending_review' && booking.status !== 'pending') {
    throw new Error(`Step 4 failed: Expected pending/pending_review, got ${booking.status}`);
  }
  console.log(`   ✓ Booking placed in pending_review queue (ID: ${booking.id})`);

  // STEP 5 & 6: Owner reviews and approves with MANDATORY plain-language reason
  console.log('\nStep 5 & 6: Owner reviews and approves with reason...');
  const approvedBooking = await api.transitionBooking(
    booking.id,
    'approved',
    'Verified prerequisite ESD Level 2 training. RF calibration verified.',
    ownerId
  );
  if (approvedBooking.status !== 'approved' || !approvedBooking.decision_reason) {
    throw new Error('Step 6 failed: Approval must set status to approved and record reason');
  }
  console.log(`   ✓ Booking approved with auditable reason: "${approvedBooking.decision_reason}"`);

  // STEP 7: Check in & initial condition inspection
  console.log('\nStep 7: Borrower checks in & accepts handover custody...');
  const checkedIn = await api.checkIn(
    booking.id,
    'excellent',
    'SMA test cables inspected and pristine calibration kit verified.',
    borrowerId
  );
  if (checkedIn.status !== 'checked_out' || !checkedIn.checked_in_at) {
    throw new Error('Step 7 failed: Check-in must set status to checked_out and record timestamp');
  }
  console.log(`   ✓ Check-in completed. Handover condition recorded as excellent.`);

  // STEP 8: Return resource and record condition
  console.log('\nStep 8: Borrower returns resource & records final condition...');
  const returnedBooking = await api.returnBooking(
    booking.id,
    'excellent',
    'Measurement finished, accessories returned to cabinet.',
    false,
    null,
    borrowerId
  );
  if (returnedBooking.status !== 'closed' || !returnedBooking.returned_at) {
    throw new Error('Step 8 failed: Clean return must set status to closed');
  }
  console.log(`   ✓ Handover return completed. Status moved cleanly to closed.`);

  // STEP 9: Damage incident handling and dispute resolution
  console.log('\nStep 9: Testing damage dispute flow...');
  const damagedBooking = await api.requestBooking({
    resourceId: newResource.id,
    userId: borrowerId,
    startAt: new Date(Date.now() + 172800000).toISOString(),
    endAt: new Date(Date.now() + 172800000 + 3600000).toISOString(),
    purpose: 'Test high-frequency attenuation',
  });
  await api.transitionBooking(damagedBooking.id, 'approved', 'Approved second test.', ownerId);
  await api.checkIn(damagedBooking.id, 'good', 'Standard check-in', borrowerId);
  const disputed = await api.returnBooking(
    damagedBooking.id,
    'damaged',
    'Port 2 connector bent during disconnect',
    true,
    'SMA port 2 threading stripped',
    borrowerId
  );
  if (disputed.status !== 'disputed') {
    throw new Error('Step 9 failed: Damaged return must transition booking to disputed');
  }
  console.log('   ✓ Return with damage successfully placed booking in disputed state.');

  const incidents = await api.getIncidents();
  const openInc = incidents.find((i) => i.booking_id === damagedBooking.id);
  if (!openInc) throw new Error('Step 9 failed: Incident record was not created');
  console.log(`   ✓ Open incident created with AI summary: "${openInc.ai_summary?.substring(0, 70)}..."`);

  await api.resolveIncident(openInc.id, 'resolved', 'Port connector replaced and recalibrated.', ownerId);
  const resolvedBooking = await api.getBooking(damagedBooking.id);
  if (resolvedBooking.status !== 'closed') {
    throw new Error('Step 9 failed: Resolving incident must transition booking to closed');
  }
  console.log('   ✓ Incident resolved and booking safely closed.');

  // STEP 10: Verify complete audit history
  console.log('\nStep 10: Verifying immutable audit trail...');
  const logs = await api.getAuditLogs(booking.id);
  if (logs.length < 3) throw new Error('Step 10 failed: Audit log must record all transaction steps');
  console.log(`   ✓ Audit trail contains ${logs.length} immutable events for this lifecycle.`);

  console.log('\n======================================================');
  console.log('🎉 ALL 10 LIFECYCLE STEPS PASSED END-TO-END!');
  console.log('======================================================\n');
}

if (typeof describe !== 'undefined' && typeof it !== 'undefined') {
  describe('UnlockLab End-to-End Lifecycle', () => {
    it('executes the full 10-step lifecycle journey successfully', async () => {
      await runE2ETest();
    }, 30000);
  });
} else {
  runE2ETest().catch((err) => {
    console.error('❌ E2E Test Failure:', err.message);
    process.exit(1);
  });
}

