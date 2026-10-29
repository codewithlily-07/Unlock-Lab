import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FormField, Select, Textarea } from '../components/ui/FormField';
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Camera,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { formatDateTime } from '../lib/utils';

export function ReturnPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [resource, setResource] = useState(null);
  const [condition, setCondition] = useState('good');
  const [notes, setNotes] = useState('Session finished on time, all probes coiled and workbench wiped down.');
  const [flagDamage, setFlagDamage] = useState(false);
  const [damageDescription, setDamageDescription] = useState('');
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

  async function handleReturnSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isDamaged = flagDamage || condition === 'damaged';
      await api.returnBooking(
        booking.id,
        condition,
        notes,
        isDamaged,
        damageDescription,
        profile.id
      );

      setSubmitting(false);
      showToast(
        isDamaged
          ? 'Return recorded with damage alert. Transferred to disputed state for manager review.'
          : 'Equipment returned successfully! Session closed.',
        isDamaged ? 'error' : 'success'
      );
      navigate(`/bookings/${booking.id}`);
    } catch (err) {
      setSubmitting(false);
      showToast(err.message || 'Return failed', 'error');
    }
  }

  if (loading) {
    return (
      <div className="p-16 text-center text-xs font-semibold text-[#798C82]">
        <div className="w-8 h-8 rounded-full border-2 border-[#126B4F] border-t-transparent animate-spin mx-auto mb-3" />
        <span>Loading return handover inspection...</span>
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

  const isOverdue = booking.status === 'overdue' || new Date() > new Date(booking.end_at);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate(`/bookings/${booking.id}`)}
          className="p-2 rounded-xl border border-[#E8E2D2] bg-white hover:bg-[#F7F1E5] text-[#17231E] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#17231E] font-sans">
            Step 8: Return Handover &amp; Inspection
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5B53]">
            Compare final condition against initial handover notes and conclude custody.
          </p>
        </div>
      </div>

      {isOverdue && (
        <div className="p-4 rounded-2xl bg-[#fdf2f1] border border-[#c2413a]/30 text-[#c2413a] text-xs flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-[#c2413a] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Late Return Detected:</strong> This reservation was scheduled to end at{' '}
            <strong>{formatDateTime(booking.end_at)}</strong>. A late return is recorded in usage statistics and triggers a 48-hour cooldown on future reservations.
          </div>
        </div>
      )}

      {/* Before-vs-After Comparison Box */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#126B4F]">
              Before-vs-After Custody Comparison
            </span>
            <span className="text-xs text-[#798C82] font-mono">ID: {booking.id.substring(0, 8)}</span>
          </div>
          <h3 className="text-lg font-bold text-[#17231E] mt-1 font-sans">{resource.name}</h3>
        </CardHeader>

        <CardBody className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Initial Condition at Check-in */}
            <div className="p-4 rounded-2xl bg-[#FFFCF5] border border-[#E8E2D2]">
              <span className="text-[10px] font-bold text-[#798C82] uppercase tracking-wider block mb-1">
                Before: Initial Check-In State
              </span>
              <div className="font-bold text-[#17231E] text-sm capitalize mb-1">
                Condition: {booking.initial_condition || 'Excellent'}
              </div>
              <p className="text-[#4A5B53] italic">
                "{booking.initial_notes || 'Clean condition verified upon check-in'}"
              </p>
              <span className="text-[10px] text-[#798C82] mt-2 block">
                Checked In: {formatDateTime(booking.checked_in_at || booking.start_at)}
              </span>
            </div>

            {/* Final Return Condition Form */}
            <div className="p-4 rounded-2xl bg-[#f0f7f4] border border-[#126B4F]/30">
              <span className="text-[10px] font-bold text-[#126B4F] uppercase tracking-wider block mb-1">
                After: Final Return State
              </span>
              <div className="font-bold text-[#073D2D] text-sm capitalize mb-1">
                Condition: {condition}
              </div>
              <p className="text-[#4A5B53] italic">"{notes}"</p>
              <span className="text-[10px] text-[#126B4F] mt-2 block">
                Returning Now: {formatDateTime(new Date().toISOString())}
              </span>
            </div>
          </div>

          <form onSubmit={handleReturnSubmit} className="space-y-5 pt-3 border-t border-[#F0ECE0] text-left">
            <FormField label="Final Observed Physical Condition" required>
              <Select value={condition} onChange={(e) => setCondition(e.target.value)}>
                <option value="excellent">Excellent — Pristine condition, cleaned and calibrated</option>
                <option value="good">Good — Operational, normal wear, all accessories returned</option>
                <option value="fair">Fair — Operational with minor issues</option>
                <option value="damaged">Damaged / Malfunction occurred — (Triggers safety incident dispute)</option>
              </Select>
            </FormField>

            <FormField label="Final Return Notes" required>
              <Textarea
                required
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </FormField>

            {/* Damage Reporting Toggle */}
            <div className="p-4 rounded-2xl bg-[#FFFCF5] border border-[#E8E2D2] space-y-3">
              <label className="flex items-center space-x-2 text-xs font-bold text-[#17231E] cursor-pointer">
                <input
                  type="checkbox"
                  checked={flagDamage}
                  onChange={(e) => setFlagDamage(e.target.checked)}
                  className="rounded text-[#c2413a] focus:ring-[#c2413a] w-4 h-4 accent-[#c2413a]"
                />
                <span className="text-[#c2413a]">Flag Damage, Malfunction, or Missing Accessory</span>
              </label>

              {(flagDamage || condition === 'damaged') && (
                <FormField
                  label="Damage / Incident Details"
                  required
                  helperText="Provide specific details so lab technician can inspect before the next borrower"
                >
                  <Textarea
                    required
                    rows={3}
                    placeholder="Describe what occurred (e.g. Channel 1 BNC connector loose, burnt smell on power supply, hot air tip pitted)..."
                    value={damageDescription}
                    onChange={(e) => setDamageDescription(e.target.value)}
                  />
                </FormField>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(`/bookings/${booking.id}`)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={flagDamage || condition === 'damaged' ? 'danger' : 'primary'}
                loading={submitting}
                className="font-bold"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                <span>
                  {flagDamage || condition === 'damaged' ? 'Submit Return with Damage Dispute' : 'Complete Handover Return'}
                </span>
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

export default ReturnPage;
