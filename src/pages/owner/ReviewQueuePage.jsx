import React, { useState, useEffect } from 'react';
import { api } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { QUICK_PICK_REASONS } from '../../lib/constants';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FormField, Textarea } from '../../components/ui/FormField';
import { Modal } from '../../components/ui/Modal';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  User,
  Calendar,
  Layers,
} from 'lucide-react';
import { formatDateTime, formatDate } from '../../lib/utils';

export function ReviewQueuePage() {
  const { profile } = useAuth();
  const { showToast } = useNotifications();
  const [requests, setRequests] = useState([]);
  const [resources, setResources] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Decision Modal State
  const [activeBooking, setActiveBooking] = useState(null);
  const [decisionAction, setDecisionAction] = useState('approved'); // approved | rejected | waitlisted
  const [decisionReason, setDecisionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [bList, rList, pList] = await Promise.all([
      api.getBookings(),
      api.getResources(),
      api.getProfiles(),
    ]);

    // Filter to pending review bookings for resources managed or owned by current user (or admin)
    const pending = bList.filter((b) => b.status === 'pending_review' || b.status === 'requested');
    setRequests(pending);
    setResources(rList);
    setProfiles(pList);
    setLoading(false);
  }

  function openDecisionModal(booking, action) {
    setActiveBooking(booking);
    setDecisionAction(action);
    const defaultTemplates = QUICK_PICK_REASONS[action === 'approved' ? 'approve' : action === 'rejected' ? 'reject' : 'waitlist'];
    setDecisionReason(defaultTemplates[0] || '');
  }

  async function handleConfirmDecision(e) {
    e.preventDefault();
    if (!decisionReason.trim()) {
      showToast('A plain-language decision reason is strictly required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.transitionBooking(activeBooking.id, decisionAction, decisionReason.trim(), profile.id);
      setSubmitting(false);
      setActiveBooking(null);
      showToast(`Booking successfully marked as ${decisionAction}!`, 'success');
      loadData();
    } catch (err) {
      setSubmitting(false);
      showToast(err.message || 'Error processing state transition', 'error');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Request Review Queue</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review incoming reservation requests, evaluate verified prerequisites, and confirm slots with auditable reasons.
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800">
          {requests.length} Pending Review
        </span>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading pending requests...</div>
      ) : requests.length === 0 ? (
        <Card>
          <CardBody className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Review Queue Cleared</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are currently no equipment reservations awaiting review. Incoming student and researcher requests will appear here.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-6">
          {requests.map((booking) => {
            const res = resources.find((r) => r.id === booking.resource_id);
            const user = profiles.find((p) => p.id === booking.user_id);

            // Suggested rule-based decision
            const hasMissingReqs =
              booking.eligibility_snapshot &&
              booking.eligibility_snapshot.some((item) => !item.passed);
            const suggestedAction = hasMissingReqs ? 'Reject' : 'Approve';
            const suggestedReason = hasMissingReqs
              ? 'Prerequisites missing. Recommend rejection or waitlist.'
              : 'All prerequisite credentials verified and student in good standing.';

            return (
              <Card key={booking.id} className="border-l-4 border-l-amber-500">
                <CardBody className="p-6 space-y-5">
                  {/* Top Row: Resource and Requester info */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
                          {res?.category || 'Instrument'}
                        </span>
                        <Badge variant="warning" size="sm">
                          Pending Decision
                        </Badge>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">{res?.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{res?.location}</p>
                    </div>

                    {/* Requester Identity Card */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 min-w-[240px]">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-slate-500" />
                        <span className="font-bold text-slate-900">{user?.full_name}</span>
                        {user?.is_verified && (
                          <Badge variant="success" size="sm">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {user?.email} · {user?.department}
                      </p>
                      <p className="text-[11px] text-slate-400">{user?.year_or_designation}</p>
                    </div>
                  </div>

                  {/* Reservation Details & Stated Purpose */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">Slot Time:</span>
                      <span className="font-bold text-slate-800">
                        {formatDateTime(booking.start_at)} &rarr; {formatDateTime(booking.end_at)}
                      </span>
                    </div>

                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block font-medium">Declared Purpose:</span>
                      <p className="font-semibold text-slate-800 italic">"{booking.purpose}"</p>
                      {booking.project_need && (
                        <span className="text-[11px] text-purple-700 block mt-0.5">
                          Academic Milestone: <strong>{booking.project_need}</strong> (+10 pts)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rule-Based Suggested Decision (Section 8) */}
                  <div className="p-3 rounded-lg bg-blue-50/80 border border-blue-200 text-xs flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-brand-600 shrink-0" />
                      <div>
                        <span className="font-bold text-brand-900">Rule-Based Suggestion: </span>
                        <span className="text-brand-800 font-semibold">{suggestedAction}</span>
                        <span className="text-slate-500 text-[11px] ml-2">— {suggestedReason}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 italic">Human Manager Decides</span>
                  </div>

                  {/* Action Buttons: Approve / Reject / Waitlist */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDecisionModal(booking, 'waitlisted')}
                    >
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      <span>Waitlist</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => openDecisionModal(booking, 'rejected')}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      <span>Reject</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => openDecisionModal(booking, 'approved')}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      <span>Approve Request</span>
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Decision Reason Confirmation Modal (Section 5 & 8) */}
      <Modal
        isOpen={Boolean(activeBooking)}
        onClose={() => setActiveBooking(null)}
        title={`Confirm Decision: ${decisionAction.toUpperCase()}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setActiveBooking(null)}>
              Cancel
            </Button>
            <Button
              variant={decisionAction === 'approved' ? 'success' : decisionAction === 'rejected' ? 'danger' : 'primary'}
              onClick={handleConfirmDecision}
              loading={submitting}
            >
              Confirm {decisionAction}
            </Button>
          </>
        }
      >
        <form onSubmit={handleConfirmDecision} className="space-y-4 text-left">
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <strong>Mandatory Governance Requirement:</strong> A plain-language reason is strictly required.
            This will be displayed in the borrower's <em>"Why this decision?"</em> explainability box and permanently logged in the append-only audit trail.
          </div>

          {/* Quick-Pick Templates */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Quick-Pick Pre-Approved Templates:
            </label>
            <div className="space-y-1.5">
              {(QUICK_PICK_REASONS[decisionAction === 'approved' ? 'approve' : decisionAction === 'rejected' ? 'reject' : 'waitlist'] || []).map(
                (template, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setDecisionReason(template)}
                    className="w-full text-left p-2 rounded text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors text-slate-700 leading-tight"
                  >
                    "{template}"
                  </button>
                )
              )}
            </div>
          </div>

          <FormField label="Official Reason for Borrower" required>
            <Textarea
              required
              rows={3}
              placeholder="Provide a clear, respectful reason for this allocation decision..."
              value={decisionReason}
              onChange={(e) => setDecisionReason(e.target.value)}
            />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}

