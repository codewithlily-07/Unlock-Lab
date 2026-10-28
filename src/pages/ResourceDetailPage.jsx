import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { FormField, Input, Textarea } from '../components/ui/FormField';
import {
  MapPin,
  Clock,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileCheck2,
  Calendar,
  AlertTriangle,
  Info,
  Sparkles,
  QrCode,
} from 'lucide-react';
import { formatDuration, formatCurrency } from '../lib/utils';

export function ResourceDetailPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [resource, setResource] = useState(null);
  const [eligibility, setEligibility] = useState([]);
  const [loading, setLoading] = useState(true);

  // Booking Form State
  const defaultDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [bookingDate, setBookingDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [purpose, setPurpose] = useState('');
  const [projectNeed, setProjectNeed] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [id, profile?.id]);

  async function loadData() {
    setLoading(true);
    const res = await api.getResource(id);
    setResource(res);

    if (res && profile?.id) {
      const checklist = await api.checkEligibility(profile.id, res.id);
      setEligibility(checklist);
    }
    setLoading(false);
  }

  const allEligible = eligibility.length > 0 && eligibility.every((item) => item.passed);

  async function handleBookingSubmit(e) {
    e.preventDefault();
    if (!purpose.trim()) {
      showToast('Booking purpose is required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const startAt = new Date(`${bookingDate}T${startTime}:00`).toISOString();
      const endAt = new Date(new Date(`${bookingDate}T${startTime}:00`).getTime() + durationMinutes * 60000).toISOString();

      const booking = await api.requestBooking({
        resourceId: resource.id,
        userId: profile.id,
        startAt,
        endAt,
        purpose,
        projectNeed,
      });

      setSubmitting(false);
      showToast(`Booking request submitted (${booking.status})!`, 'success');
      navigate(`/bookings/${booking.id}`);
    } catch (err) {
      setSubmitting(false);
      showToast(err.message || 'Error creating booking', 'error');
    }
  }

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading equipment details...</div>;
  }

  if (!resource) {
    return <div className="p-12 text-center text-xs text-slate-400">Equipment not found.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Top Banner & Title */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Photos */}
          <div className="h-72 md:h-full relative bg-slate-100">
            <img
              src={resource.photos[0] || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'}
              alt={resource.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900/80 text-white backdrop-blur-sm">
                {resource.category}
              </span>
            </div>
          </div>

          {/* Core Info */}
          <div className="p-6 md:p-8 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant={resource.requires_approval ? 'warning' : 'success'} size="sm">
                  {resource.requires_approval ? 'Approval Required' : 'Instant Access'}
                </Badge>
                {resource.requires_deposit && (
                  <Badge variant="purple" size="sm">
                    Deposit: {formatCurrency(resource.deposit_amount)}
                  </Badge>
                )}
                {resource.supervision_required && (
                  <Badge variant="danger" size="sm">
                    Faculty Supervision Req
                  </Badge>
                )}
              </div>

              <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 leading-snug">
                {resource.name}
              </h1>

              <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                {resource.description}
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-medium text-slate-800">{resource.location}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  Booking Range: {formatDuration(resource.min_booking_minutes)} to{' '}
                  {formatDuration(resource.max_booking_minutes)} (up to {resource.advance_booking_days} days in advance)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <QrCode className="w-4 h-4 text-brand-600 shrink-0" />
                <span className="text-[11px] text-slate-500 font-mono">Token: {resource.qr_token}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Rules & Eligibility on Left, Request Form on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Requirements, Safety, Rules */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 6: Real-Time Eligibility Checklist */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-brand-600" />
                  <h3 className="text-base font-bold text-slate-900">Your Eligibility Checklist</h3>
                </div>
                <Badge variant={allEligible ? 'success' : 'danger'} size="sm">
                  {allEligible ? 'Eligible to Book' : 'Prerequisites Missing'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Automated check for active user account, safety credentials, and weekly fair-use quotas.
              </p>
            </CardHeader>

            <CardBody className="p-0 divide-y divide-slate-100">
              {eligibility.map((item, idx) => (
                <div key={idx} className="p-4 flex items-start justify-between gap-4">
                  <div className="flex items-start space-x-3">
                    {item.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{item.requirement}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{item.message}</p>
                      {item.how_to_fix && (
                        <div className="mt-1.5 flex items-center space-x-2">
                          <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            Action: {item.how_to_fix}
                          </span>
                          <Link
                            to="/credentials"
                            className="text-[11px] font-bold text-brand-600 hover:underline"
                          >
                            Go to Credentials &rarr;
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>

          {/* Usage Rules & Safety Notes */}
          <Card>
            <CardHeader>
              <h3 className="text-base font-bold text-slate-900">Bench Usage Rules &amp; Safety Protocols</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              {resource.safety_notes && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Safety Note:</strong>
                    <span>{resource.safety_notes}</span>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold uppercase text-slate-700 mb-2">Mandatory Operating Procedures</h4>
                <ul className="space-y-2 text-xs text-slate-600">
                  {resource.usage_rules.map((rule, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Interactive Booking Request Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-bold text-slate-900">Request Reservation</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Select your preferred bench slot. Competing slots are queued into the transparent waitlist.
              </p>
            </CardHeader>

            <CardBody>
              <form onSubmit={handleBookingSubmit} className="space-y-4 text-left">
                <FormField label="Reservation Date" required>
                  <Input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Start Time" required>
                    <Input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </FormField>

                  <FormField label="Duration" required>
                    <Input
                      type="number"
                      step="30"
                      min={resource.min_booking_minutes}
                      max={resource.max_booking_minutes}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    />
                  </FormField>
                </div>

                <FormField
                  label="Purpose of Usage"
                  required
                  helperText="Describe circuit, IC, or protocol being tested"
                >
                  <Textarea
                    required
                    placeholder="e.g. Measuring 100MHz clock jitter on SPI bus for senior year capstone..."
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                  />
                </FormField>

                <FormField
                  label="Academic / Project Need (Optional)"
                  helperText="Declaration grants +10 pts on fair waitlist score"
                >
                  <Input
                    placeholder="e.g. IEEE Conference Paper / Capstone Evaluation"
                    value={projectNeed}
                    onChange={(e) => setProjectNeed(e.target.value)}
                  />
                </FormField>

                {/* Submit Action */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full"
                    loading={submitting}
                    disabled={!allEligible}
                  >
                    {allEligible ? 'Submit Booking Request' : 'Resolve Missing Prerequisites First'}
                  </Button>
                </div>

                {!allEligible && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 leading-tight">
                    Review the eligibility checklist on the left to complete safety training before requesting.
                  </p>
                )}
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

