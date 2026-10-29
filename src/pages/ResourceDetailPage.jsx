import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FormField, Input, Textarea } from '../components/ui/FormField';
import {
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Info,
  ArrowLeft,
  Users,
  LogIn,
  AlertCircle,
} from 'lucide-react';
import { formatDuration } from '../lib/utils';

export function ResourceDetailPage() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [resource, setResource] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availLoading, setAvailLoading] = useState(false);

  // Booking Form State
  const defaultDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [bookingDate, setBookingDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [purpose, setPurpose] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    loadResource();
  }, [id]);

  useEffect(() => {
    if (id && bookingDate) {
      loadAvailability(bookingDate);
    }
  }, [id, bookingDate]);

  async function loadResource() {
    setLoading(true);
    try {
      const res = await api.getResource(id);
      setResource(res);
      if (res) {
        setDurationMinutes(res.min_duration_minutes || 60);
      }
    } catch (err) {
      console.error('Failed to load resource:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadAvailability(dateStr) {
    setAvailLoading(true);
    try {
      const avail = await api.getAvailability(id, dateStr);
      setAvailability(avail);
    } catch (err) {
      console.error('Failed to load availability:', err);
    } finally {
      setAvailLoading(false);
    }
  }

  async function handleBookingSubmit(e) {
    e.preventDefault();
    setBookingError('');

    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (!purpose.trim()) {
      setBookingError('Reservation purpose is required');
      return;
    }

    setSubmitting(true);
    try {
      const startDateTime = new Date(`${bookingDate}T${startTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

      const booking = await api.requestBooking({
        resourceId: resource.id,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        purpose: purpose.trim(),
        projectTitle: projectTitle ? projectTitle.trim() : null,
      });

      showToast(`Reservation request submitted (${booking.status})!`, 'success');
      navigate('/my-bookings');
    } catch (err) {
      setBookingError(err.message || 'Error creating reservation');
      showToast(err.message || 'Failed to submit booking', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-16 text-center text-xs font-semibold text-[#798C82]">
        <div className="w-8 h-8 rounded-full border-2 border-[#126B4F] border-t-transparent animate-spin mx-auto mb-3" />
        <span>Loading resource details...</span>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-[#E8E2D2] shadow-sm space-y-4 max-w-md mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-[#c2413a] mx-auto" />
        <h2 className="text-base font-bold text-[#17231E]">Resource Not Found</h2>
        <p className="text-xs text-[#4A5B53]">The requested laboratory resource does not exist in the database.</p>
        <Link to="/campuses">
          <Button size="sm" variant="primary">
            Return to Campuses
          </Button>
        </Link>
      </div>
    );
  }

  const bookedSlots = availability?.booked_slots || [];

  return (
    <div className="space-y-6 pb-12">
      <Link
        to="/campuses"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#126B4F] hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Campus Facilities</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Resource Profile */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-[#E5DDD0] overflow-hidden">
            <div className="relative h-64 sm:h-80 w-full bg-[#E8EFE6]">
              {resource.photos && resource.photos[0] ? (
                <img
                  src={resource.photos[0]}
                  alt={resource.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#103C2D]">
                  <Users className="w-16 h-16 opacity-30" />
                </div>
              )}
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#073D2D]/90 text-white backdrop-blur-sm">
                  {resource.type}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/95 text-[#103C2D] shadow-sm">
                  {resource.requires_approval ? 'Approval Required' : 'Instant Booking'}
                </span>
              </div>
            </div>

            <CardBody className="p-6 sm:p-8 space-y-5">
              <div>
                <span className="text-xs font-bold text-[#126B4F] uppercase tracking-wider block mb-1">
                  {resource.department_name || 'Campus Wide Facility'}
                </span>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#17231E] leading-tight">
                  {resource.name}
                </h1>
              </div>

              <p className="text-sm text-[#4A5B53] leading-relaxed">
                {resource.description || 'Verified institutional facility ready for reservations.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3 border-y border-[#E8E2D2] text-xs">
                <div className="space-y-1">
                  <span className="text-[#798C82] font-semibold block">Campus Location</span>
                  <div className="flex items-center gap-1.5 font-bold text-[#17231E]">
                    <MapPin className="w-4 h-4 text-[#D87E3A] shrink-0" />
                    <span>{resource.location}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[#798C82] font-semibold block">Operating Schedule</span>
                  <div className="flex items-center gap-1.5 font-bold text-[#17231E]">
                    <Clock className="w-4 h-4 text-[#103C2D] shrink-0" />
                    <span>
                      {resource.operating_hours_start} – {resource.operating_hours_end} Daily
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[#798C82] font-semibold block">Booking Bounds</span>
                  <span className="font-bold text-[#17231E] block">
                    Min {formatDuration(resource.min_duration_minutes)} &middot; Max{' '}
                    {formatDuration(resource.max_duration_minutes)}
                  </span>
                </div>

                {resource.capacity > 1 && (
                  <div className="space-y-1">
                    <span className="text-[#798C82] font-semibold block">Capacity</span>
                    <span className="font-bold text-[#17231E] block">Up to {resource.capacity} occupants</span>
                  </div>
                )}
              </div>

              {resource.facilities && resource.facilities.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#17231E] uppercase tracking-wider">
                    Available Facilities &amp; Equipment
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {resource.facilities.map((fac, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#FAF9F5] text-[#17231E] border border-[#E8E2D2]"
                      >
                        {fac}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {resource.safety_guidelines && (
                <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E8E2D2] text-xs space-y-1 text-[#4A5B53]">
                  <span className="font-bold text-[#17231E] block">Laboratory Safety &amp; Usage Rules</span>
                  <p className="leading-relaxed">{resource.safety_guidelines}</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Reservation & Availability Schedule */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-[#E5DDD0] shadow-sm">
            <CardHeader className="p-5 pb-3 border-b border-[#E8E2D2]">
              <h2 className="text-base font-bold text-[#17231E] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#103C2D]" />
                <span>Reserve this Facility</span>
              </h2>
              <p className="text-xs text-[#4A5B53] mt-0.5">
                Check real-time slot availability and submit a reservation request.
              </p>
            </CardHeader>

            <CardBody className="p-5 space-y-4">
              {bookingError && (
                <div className="p-3.5 rounded-xl bg-[#fdf2f1] border border-[#c2413a]/30 text-[#c2413a] text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{bookingError}</span>
                </div>
              )}

              {/* Date Selection */}
              <FormField label="Reservation Date" required>
                <Input
                  type="date"
                  value={bookingDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="text-xs font-medium"
                />
              </FormField>

              {/* Real Availability Inspection for Selected Date */}
              <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E8E2D2] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#17231E]">Booked Slots on {bookingDate}:</span>
                  <span className="text-[11px] text-[#798C82]">
                    {availLoading ? 'Checking...' : `${bookedSlots.length} reserved`}
                  </span>
                </div>

                {bookedSlots.length === 0 ? (
                  <div className="text-[11px] text-[#126B4F] font-semibold flex items-center gap-1.5 py-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Entire operating schedule is currently available!</span>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                    {bookedSlots.map((slot) => {
                      const start = new Date(slot.start_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const end = new Date(slot.end_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      return (
                        <div
                          key={slot.id}
                          className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-[#fdf2f1] border border-[#c2413a]/20 text-[#c2413a] font-medium"
                        >
                          <span>
                            {start} – {end}
                          </span>
                          <span className="uppercase text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/60">
                            Occupied
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {currentUser ? (
                <form onSubmit={handleBookingSubmit} className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Start Time" required>
                      <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="text-xs font-medium"
                      />
                    </FormField>

                    <FormField label="Duration (Minutes)" required>
                      <select
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E2D2] bg-white font-medium"
                      >
                        <option value={30}>30 mins</option>
                        <option value={60}>1 hour</option>
                        <option value={90}>1.5 hours</option>
                        <option value={120}>2 hours</option>
                        <option value={180}>3 hours</option>
                        <option value={240}>4 hours</option>
                      </select>
                    </FormField>
                  </div>

                  <FormField label="Purpose / Research Project" required>
                    <Textarea
                      required
                      placeholder="Specify your academic purpose, coursework, or research project..."
                      rows={2}
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      className="text-xs"
                    />
                  </FormField>

                  <FormField label="Project Title (Optional)">
                    <Input
                      placeholder="e.g. Capstone Project Team 4"
                      value={projectTitle}
                      onChange={(e) => setProjectTitle(e.target.value)}
                      className="text-xs"
                    />
                  </FormField>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full font-bold bg-[#103C2D] hover:bg-[#185340] text-white py-2.5 rounded-xl text-xs"
                    loading={submitting}
                  >
                    Submit Reservation Request
                  </Button>
                </form>
              ) : (
                <div className="pt-2 text-center space-y-3">
                  <p className="text-xs text-[#4A5B53]">
                    You must be signed in with an institutional account to request reservations.
                  </p>
                  <Link
                    to="/login"
                    state={{ from: { pathname: `/resources/${resource.id}` } }}
                    className="block"
                  >
                    <Button variant="primary" className="w-full font-bold bg-[#103C2D] text-white text-xs">
                      <LogIn className="w-4 h-4 mr-1.5" />
                      Sign In to Reserve
                    </Button>
                  </Link>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ResourceDetailPage;
