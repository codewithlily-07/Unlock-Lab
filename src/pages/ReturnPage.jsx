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
    return <div className="p-12 text-center text-xs text-slate-400">Loading return handover inspection...</div>;
  }

  if (!booking || !resource) {
    return <div className="p-12 text-center text-xs text-slate-400">Booking not found.</div>;
  }

  const isOverdue = booking.status === 'overdue' || new Date() > new Date(booking.end_at);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate(`/bookings/${booking.id}`)}
          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Step 8: Return Handover &amp; Inspection</h1>
          <p className="text-xs text-slate-500">
            Compare final condition against initial handover notes and conclude custody.
          </p>
        </div>
      </div>

      {isOverdue && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong>Late Return Detected:</strong> This reservation was scheduled to end at{' '}
            <strong>{formatDateTime(booking.end_at)}</strong>. A late return is recorded in usage statistics and triggers a 48-hour cooldown on future reservations.
          </div>
        </div>
      )}

      {/* Before-vs-After Comparison Box (Section 8) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
              Before-vs-After Custody Comparison
            </span>
            <span className="text-xs text-slate-500 font-mono">ID: {booking.id.substring(0, 8)}</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-1">{resource.name}</h3>
        </CardHeader>

        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Initial Condition at Check-in */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Before: Initial Check-In State
              </span>
              <div className="font-bold text-slate-900 text-sm capitalize mb-1">
                Condition: {booking.initial_condition || 'Excellent'}
              </div>
              <p className="text-slate-600 italic">
                "{booking.initial_notes || 'Clean condition verified upon check-in'}"
              </p>
              <span className="text-[10px] text-slate-400 mt-2 block">
                Checked In: {formatDateTime(booking.checked_in_at || booking.start_at)}
              </span>
            </div>

            {/* Final Return Condition Form */}
            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200">
              <span className="text-[10px] font-bold text-brand-700 uppercase tracking-wider block mb-1">
                After: Final Return State
              </span>
              <div className="font-bold text-brand-900 text-sm capitalize mb-1">
                Condition: {condition}
              </div>
              <p className="text-slate-600 italic">"{notes}"</p>
              <span className="text-[10px] text-brand-600 mt-2 block">
                Returning Now: {formatDateTime(new Date().toISOString())}
              </span>
            </div>
          </div>

          <form onSubmit={handleReturnSubmit} className="space-y-5 pt-3 border-t border-slate-100">
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
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={flagDamage}
                  onChange={(e) => setFlagDamage(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <span className="text-rose-700">Flag Damage, Malfunction, or Missing Accessory</span>
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
