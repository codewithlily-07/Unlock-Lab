import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FormField, Textarea } from '../../components/ui/FormField';
import { Modal } from '../../components/ui/Modal';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Calendar,
  MapPin,
  AlertCircle,
  Building,
} from 'lucide-react';
import { formatDuration } from '../../lib/utils';

export function ReviewQueuePage() {
  const { currentUser, isAdmin } = useAuth();
  const { showToast } = useNotifications();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Decision Modal State
  const [activeBooking, setActiveBooking] = useState(null);
  const [decisionAction, setDecisionAction] = useState('approve'); // approve | reject
  const [decisionReason, setDecisionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await api.getBookings({ all: true, status: 'pending' });
      setRequests(data || []);
    } catch (err) {
      console.error('Failed to load pending queue:', err);
    } finally {
      setLoading(false);
    }
  }

  function openDecisionModal(booking, action) {
    setActiveBooking(booking);
    setDecisionAction(action);
    setModalError('');
    if (action === 'approve') {
      setDecisionReason('');
      setAdminNotes('Approved: Schedule verified without conflicts.');
    } else {
      setDecisionReason('Schedule conflict or institutional priority requirement.');
      setAdminNotes('');
    }
  }

  async function handleConfirmDecision(e) {
    e.preventDefault();
    setModalError('');

    if (decisionAction === 'reject' && !decisionReason.trim()) {
      setModalError('A rejection reason is strictly required to inform the requester.');
      return;
    }

    setSubmitting(true);
    try {
      await api.reviewBooking(activeBooking.id, {
        action: decisionAction,
        reason: decisionReason ? decisionReason.trim() : null,
        notes: adminNotes ? adminNotes.trim() : null,
      });

      setSubmitting(false);
      setActiveBooking(null);
      showToast(
        decisionAction === 'approve'
          ? 'Reservation approved and confirmed!'
          : 'Reservation rejected.',
        decisionAction === 'approve' ? 'success' : 'info'
      );
      loadData();
    } catch (err) {
      setSubmitting(false);
      setModalError(err.message || 'Error processing review decision');
      showToast(err.message || 'Error updating booking', 'error');
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#faf6ec] text-[#9e7330] border border-[#D6AD63]/30 text-xs font-semibold mb-2">
            <Inbox className="w-3.5 h-3.5 text-[#D87E3A]" />
            <span>Administrative Review Queue &middot; {requests.length} Pending</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#17231E] tracking-tight">
            Reservation Requests Queue
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5B53] mt-1">
            Review incoming room and equipment requests. The server validates availability and prevents double booking before approving.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs font-semibold text-[#798C82]">
          <div className="w-8 h-8 rounded-full border-2 border-[#126B4F] border-t-transparent animate-spin mx-auto mb-3" />
          <span>Fetching pending requests from database...</span>
        </div>
      ) : requests.length === 0 ? (
        <Card className="border-[#E5DDD0] p-12 text-center space-y-3 bg-white">
          <div className="w-12 h-12 rounded-full bg-[#f0f7f4] text-[#126B4F] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#17231E]">Review Queue is Clear</h3>
          <p className="text-xs text-[#4A5B53] max-w-sm mx-auto">
            There are currently no pending reservation requests awaiting administrative approval.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((booking) => {
            const start = new Date(booking.start_time);
            const end = new Date(booking.end_time);

            return (
              <Card key={booking.id} className="border-[#E5DDD0] overflow-hidden">
                <CardBody className="p-5 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#faf6ec] text-[#9e7330] border border-[#D6AD63]/40">
                          Pending Review
                        </span>
                        <span className="text-xs font-bold text-[#103C2D]">
                          {booking.resource_type || 'Facility'}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-[#17231E] leading-snug">
                        {booking.resource_name}
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-[#798C82]">
                        <MapPin className="w-3.5 h-3.5 text-[#D87E3A] shrink-0" />
                        <span>{booking.resource_location}</span>
                      </div>
                    </div>

                    {/* Requester Information */}
                    <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E8E2D2] text-xs space-y-1 shrink-0 md:min-w-[240px]">
                      <div className="flex items-center gap-1.5 font-bold text-[#17231E]">
                        <User className="w-3.5 h-3.5 text-[#103C2D]" />
                        <span>{booking.user_name || 'Requester'}</span>
                      </div>
                      <p className="text-[#4A5B53]">{booking.user_email}</p>
                      <span className="inline-block text-[10px] font-semibold text-[#126B4F]">
                        {booking.department_name || 'Academic Dept'} &middot; {booking.user_program || 'Student'}
                      </span>
                    </div>
                  </div>

                  {/* Schedule & Purpose Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#FAF9F5] p-3.5 rounded-xl border border-[#E8E2D2]">
                    <div className="space-y-1">
                      <span className="text-[#798C82] font-semibold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#103C2D]" />
                        <span>Requested Time Window:</span>
                      </span>
                      <p className="font-bold text-[#17231E]">
                        {start.toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        ({start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                        {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                      </p>
                      <p className="text-[11px] text-[#4A5B53]">
                        Duration: {formatDuration(booking.duration_minutes)}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[#798C82] font-semibold">Purpose &amp; Project:</span>
                      <p className="font-medium text-[#17231E] leading-relaxed">
                        {booking.purpose}
                      </p>
                      {booking.project_title && (
                        <p className="text-[11px] text-[#126B4F] font-semibold">
                          Project: {booking.project_title}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Decision Actions */}
                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E8E2D2]">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openDecisionModal(booking, 'reject')}
                      className="text-xs font-bold text-[#c2413a] hover:bg-[#fdf2f1] border-[#c2413a]/30"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Reject Request
                    </Button>

                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => openDecisionModal(booking, 'approve')}
                      className="text-xs font-bold bg-[#103C2D] hover:bg-[#185340] text-white"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Approve &amp; Confirm Slot
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Decision Confirmation Modal */}
      {activeBooking && (
        <Modal
          isOpen={Boolean(activeBooking)}
          onClose={() => setActiveBooking(null)}
          title={
            decisionAction === 'approve'
              ? 'Confirm Booking Approval'
              : 'Reject Reservation Request'
          }
        >
          <form onSubmit={handleConfirmDecision} className="space-y-4 text-left">
            {modalError && (
              <div className="p-3.5 rounded-xl bg-[#fdf2f1] border border-[#c2413a]/30 text-[#c2413a] text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{modalError}</span>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E8E2D2] text-xs space-y-1">
              <span className="text-[#798C82] font-semibold">Resource &amp; Requester:</span>
              <p className="font-bold text-[#17231E]">
                {activeBooking.resource_name} for {activeBooking.user_name}
              </p>
              <p className="text-[11px] text-[#4A5B53]">
                {new Date(activeBooking.start_time).toLocaleString()} –{' '}
                {new Date(activeBooking.end_time).toLocaleTimeString()}
              </p>
            </div>

            {decisionAction === 'reject' ? (
              <FormField label="Rejection Reason" required>
                <Textarea
                  required
                  placeholder="Explain the reason for rejection to the requester..."
                  rows={3}
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  className="text-xs"
                />
              </FormField>
            ) : (
              <FormField label="Administrative Approval Notes (Optional)">
                <Textarea
                  placeholder="Optional notes or instructions for the borrower..."
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="text-xs"
                />
              </FormField>
            )}

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E8E2D2]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveBooking(null)}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant={decisionAction === 'approve' ? 'primary' : 'danger'}
                size="sm"
                className="font-bold text-xs"
                loading={submitting}
              >
                {decisionAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default ReviewQueuePage;
