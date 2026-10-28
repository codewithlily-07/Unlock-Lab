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
    return <div className="p-12 text-center text-xs text-slate-400">Loading check-in inspection...</div>;
  }

  if (!booking || !resource) {
    return <div className="p-12 text-center text-xs text-slate-400">Booking not found.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate(`/bookings/${booking.id}`)}
          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Step 7: Check-In &amp; Initial Inspection</h1>
          <p className="text-xs text-slate-500">
            Verify equipment physical condition before taking custody.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
              Handover Custody Verification
            </span>
            <span className="text-xs text-slate-500 font-mono">Slot: {formatDateTime(booking.start_at)}</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-1">{resource.name}</h3>
          <p className="text-xs text-slate-500">{resource.location}</p>
        </CardHeader>

        <CardBody>
          <form onSubmit={handleCheckInSubmit} className="space-y-5">
            {/* Initial Condition Rating */}
            <FormField label="Initial Physical Condition at Pickup" required>
              <Select value={condition} onChange={(e) => setCondition(e.target.value)}>
                <option value="excellent">Excellent — Pristine, fully calibrated, clean accessories</option>
                <option value="good">Good — Operational, minor cosmetic wear, all parts present</option>
                <option value="fair">Fair — Functional but shows noticeable wear or quirks</option>
                <option value="damaged">Damaged / Pre-existing defect — (Do not take custody without manager report)</option>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Condition Verification Photo
              </label>
              <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 text-center flex flex-col items-center justify-center space-y-1.5">
                <Camera className="w-6 h-6 text-slate-400" />
                <span className="text-xs font-medium text-slate-700">Photo Evidence Recorded</span>
                <span className="text-[10px] text-slate-400">Timestamped snapshot tied to handover report</span>
              </div>
            </div>

            {/* Rules Acceptance Checkbox */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-start space-x-3 p-3 rounded-xl bg-blue-50/60 border border-blue-200 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={acceptedRules}
                  onChange={(e) => setAcceptedRules(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 mt-0.5"
                />
                <span className="text-xs text-blue-900 leading-relaxed">
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
              <Button type="submit" variant="success" loading={submitting} disabled={!acceptedRules}>
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
