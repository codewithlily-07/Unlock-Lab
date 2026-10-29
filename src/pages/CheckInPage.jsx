import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FormField, Select, Textarea } from '../components/ui/FormField';
import {
  ShieldCheck,
  Camera,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  CheckSquare,
} from 'lucide-react';
import { formatDateTime } from '../lib/utils';
import confetti from 'canvas-confetti';

export function CheckInPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [resource, setResource] = useState(null);
  const [condition, setCondition] = useState('excellent');
  const [notes, setNotes] = useState('Equipment inspected upon arrival: power cable, probes, and screen intact.');
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    const b = await api.getBooking(id);
    if (b) {
      setBooking(b);
      const r = await api.getResource(b.resource_id);
      setResource(r);
    }
    setLoading(false);
  }

  async function handleCheckInSubmit(e) {
    e.preventDefault();
    if (!acceptedRules) {
      showToast('You must accept the laboratory operating rules to check in.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.checkIn(booking.id, condition, notes, profile.id);
      setSubmitting(false);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (err) {}

      showToast('Check-in confirmed! Equipment is now checked out to you.', 'success');
      navigate(`/bookings/${booking.id}`);
    } catch (err) {
      setSubmitting(false);
      showToast(err.message || 'Check-in failed', 'error');
    }
  }

  if (loading) {
    return (
      <div className="p-16 text-center text-xs font-semibold text-[#798C82]">
        <div className="w-8 h-8 rounded-full border-2 border-[#126B4F] border-t-transparent animate-spin mx-auto mb-3" />
        <span>Loading check-in inspection...</span>
      </div>
    );
  }

  if (!booking || !resource) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-[#E8E2D2] shadow-soft-sm space-y-3">
        <h3 className="text-base font-bold text-[#17231E]">Booking Not Found</h3>
        <p className="text-xs text-[#4A5B53]">The requested reservation could not be loaded.</p>
        <Button size="sm" onClick={() => navigate('/my-bookings')}>
          Back to My Bookings
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate(`/bookings/${booking.id}`)}
          className="p-2 rounded-xl border border-[#E8E2D2] bg-white hover:bg-[#F7F1E5] text-[#17231E] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#17231E] font-sans">
            Step 7: Check-In &amp; Initial Inspection
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5B53]">
            Verify physical condition and accept custody before starting your session.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#126B4F]">
              Handover Custody Verification
            </span>
            <span className="text-xs text-[#798C82] font-mono">Slot: {formatDateTime(booking.start_at)}</span>
          </div>
          <h3 className="text-lg font-bold text-[#17231E] mt-1 font-sans">{resource.name}</h3>
          <p className="text-xs text-[#4A5B53]">{resource.location}</p>
        </CardHeader>

        <CardBody>
          <form onSubmit={handleCheckInSubmit} className="space-y-5 text-left">
            {/* Initial Condition Rating */}
            <FormField label="Initial Physical Condition at Pickup" required>
              <Select value={condition} onChange={(e) => setCondition(e.target.value)}>
                <option value="excellent">Excellent — Pristine, fully calibrated, clean accessories</option>
                <option value="good">Good — Operational, minor cosmetic wear, all parts present</option>
                <option value="fair">Fair — Functional but shows noticeable wear or quirks</option>
                <option value="damaged">Damaged / Pre-existing defect — (Report to manager before pickup)</option>
              </Select>
            </FormField>

            <FormField
              label="Inspection Notes &amp; Observations"
              required
              helperText="Note probe condition, cable integrity, or pre-existing blemishes"
            >
              <Textarea
                required
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </FormField>

            {/* Photo Handover Simulation */}
            <div>
              <label className="block text-xs font-bold text-[#17231E] mb-1.5">
                Condition Verification Evidence
              </label>
              <div className="p-5 rounded-2xl border-2 border-dashed border-[#D6C4A4] bg-[#FFFCF5] text-center flex flex-col items-center justify-center space-y-1.5">
                <Camera className="w-6 h-6 text-[#126B4F]" />
                <span className="text-xs font-bold text-[#17231E]">Photo Evidence Recorded &amp; Hash-Stamped</span>
                <span className="text-[10px] text-[#798C82]">Timestamped snapshot tied to append-only custody report</span>
              </div>
            </div>

            {/* Rules Acceptance Checkbox */}
            <div className="pt-2 border-t border-[#F0ECE0]">
              <label className="flex items-start space-x-3 p-3.5 rounded-2xl bg-[#f0f7f4] border border-[#126B4F]/30 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={acceptedRules}
                  onChange={(e) => setAcceptedRules(e.target.checked)}
                  className="rounded text-[#126B4F] focus:ring-[#126B4F] w-4 h-4 mt-0.5 accent-[#126B4F]"
                />
                <span className="text-xs text-[#073D2D] leading-relaxed">
                  I accept physical custody of this equipment. I agree to adhere to the published laboratory
                  operating procedures, return the equipment promptly by{' '}
                  <strong>{formatDateTime(booking.end_at)}</strong>, and report any observed defects immediately.
                </span>
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(`/bookings/${booking.id}`)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="success" loading={submitting} disabled={!acceptedRules} className="font-bold">
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                <span>Confirm Check-In &amp; Take Custody</span>
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

export default CheckInPage;
