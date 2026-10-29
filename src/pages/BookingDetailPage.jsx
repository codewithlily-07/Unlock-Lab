import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Timeline } from '../components/ui/Timeline';
import { WhyDecisionBox } from '../components/shared/WhyDecisionBox';
import {
  Clock,
  MapPin,
  Calendar,
  Printer,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowLeft,
  QrCode,
  Download,
} from 'lucide-react';
import { formatDateTime, formatDate } from '../lib/utils';

export function BookingDetailPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [resource, setResource] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    const b = await api.getBooking(id);
    if (b) {
      setBooking(b);
      const [r, logs] = await Promise.all([
        api.getResource(b.resource_id),
        api.getAuditLogs(b.id),
      ]);
      setResource(r);
      setAuditLogs(logs || []);
    }
    setLoading(false);
  }

  function handlePrintReceipt() {
    window.print();
  }

  function handleExportCalendar() {
    if (!booking || !resource) return;
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//UnlockLab//ECE Equipment Reservation//EN',
      'BEGIN:VEVENT',
      `SUMMARY:UnlockLab: ${resource.name}`,
      `DESCRIPTION:Purpose: ${booking.purpose}\\nLocation: ${resource.location}`,
      `LOCATION:${resource.location}`,
      `DTSTART:${booking.start_at.replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTEND:${booking.end_at.replace(/[-:]/g, '').split('.')[0]}Z`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booking-${booking.id.substring(0, 8)}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Calendar .ics file downloaded!', 'success');
  }

  if (loading) {
    return (
      <div className="p-16 text-center text-xs font-semibold text-[#798C82]">
        <div className="w-8 h-8 rounded-full border-2 border-[#126B4F] border-t-transparent animate-spin mx-auto mb-3" />
        <span>Loading reservation history...</span>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-[#E8E2D2] shadow-soft-sm space-y-3">
        <h3 className="text-base font-bold text-[#17231E]">Reservation Not Found</h3>
        <p className="text-xs text-[#4A5B53]">The requested booking record does not exist.</p>
        <Link to="/my-bookings">
          <Button size="sm">Back to My Bookings</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 printable-receipt">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <button
          onClick={() => navigate('/my-bookings')}
          className="flex items-center space-x-1.5 text-xs font-bold text-[#126B4F] hover:text-[#073D2D] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Bookings</span>
        </button>

        <div className="flex items-center space-x-2">
          {['approved', 'checked_out'].includes(booking.status) && (
            <Button size="sm" variant="secondary" onClick={handleExportCalendar}>
              <Download className="w-3.5 h-3.5 mr-1 text-[#126B4F]" />
              <span>Export Calendar (.ics)</span>
            </Button>
          )}

          <Button size="sm" variant="outline" onClick={handlePrintReceipt}>
            <Printer className="w-3.5 h-3.5 mr-1" />
            <span>Print Custody Receipt</span>
          </Button>
        </div>
      </div>

      {/* Main Reservation Overview Card */}
      <Card>
        <CardBody className="p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-1.5">
                <StatusBadge status={booking.status} />
                <span className="text-xs text-[#798C82] font-mono">ID: {booking.id}</span>
              </div>
              <h1 className="text-xl font-extrabold text-[#17231E] font-sans">{resource?.name}</h1>
              <p className="text-xs text-[#4A5B53] mt-0.5">{resource?.location}</p>
            </div>

            {/* Lifecycle Quick Actions */}
            <div className="no-print">
              {booking.status === 'approved' && (
                <Link to={`/bookings/${booking.id}/checkin`}>
                  <Button variant="success" size="sm" className="font-bold">
                    Check In &amp; Accept Handover
                  </Button>
                </Link>
              )}

              {(booking.status === 'checked_out' || booking.status === 'overdue') && (
                <Link to={`/bookings/${booking.id}/return`}>
                  <Button variant="primary" size="sm" className="font-bold">
                    Return Equipment &amp; Record Condition
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F7F1E5] p-4 rounded-2xl border border-[#E8E2D2] text-xs">
            <div>
              <span className="text-[#4A5B53] block mb-0.5">Scheduled Reservation:</span>
              <span className="font-bold text-[#17231E]">
                {formatDateTime(booking.start_at)} &rarr; {formatDateTime(booking.end_at)}
              </span>
            </div>

            <div>
              <span className="text-[#4A5B53] block mb-0.5">Declared Purpose:</span>
              <span className="font-semibold text-[#17231E] italic">"{booking.purpose}"</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Section: Explainable "Why this decision?" Box */}
      <WhyDecisionBox booking={booking} />

      {/* Inspection & Custody Handover Condition Reports */}
      {(booking.initial_condition || booking.return_condition) && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-bold text-[#17231E]">Custody Handover Condition Reports</h3>
          </CardHeader>
          <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {booking.initial_condition && (
              <div className="p-4 rounded-2xl bg-[#FFFCF5] border border-[#E8E2D2]">
                <span className="text-[11px] font-bold text-[#798C82] uppercase tracking-wider block mb-1">
                  1. Check-In Handover Inspection
                </span>
                <div className="font-bold text-[#17231E] capitalize text-sm mb-1">
                  Condition: {booking.initial_condition}
                </div>
                <p className="text-[#4A5B53] italic">"{booking.initial_notes || 'Clean condition verified'}"</p>
                <span className="text-[10px] text-[#798C82] mt-2 block">
                  Recorded: {formatDateTime(booking.checked_in_at)}
                </span>
              </div>
            )}

            {booking.return_condition && (
              <div
                className={`p-4 rounded-2xl border ${
                  booking.return_condition === 'damaged'
                    ? 'bg-[#fdf2f1] border-[#c2413a]/30 text-[#c2413a]'
                    : 'bg-[#FFFCF5] border-[#E8E2D2]'
                }`}
              >
                <span className="text-[11px] font-bold text-[#798C82] uppercase tracking-wider block mb-1">
                  2. Return Handover Inspection
                </span>
                <div className="font-bold capitalize text-sm mb-1 text-[#17231E]">
                  Condition: {booking.return_condition}
                </div>
                <p className="italic text-[#4A5B53]">"{booking.return_notes || 'Item inspected on return'}"</p>
                <span className="text-[10px] opacity-75 mt-2 block text-[#798C82]">
                  Recorded: {formatDateTime(booking.returned_at)}
                </span>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Section: Complete Audit Log History Timeline */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-bold text-[#17231E]">Immutable Audit Trail</h3>
          <p className="text-xs text-[#4A5B53] mt-0.5">
            Cryptographically stamped append-only event log recording all state transitions.
          </p>
        </CardHeader>
        <CardBody>
          <Timeline events={auditLogs} />
        </CardBody>
      </Card>
    </div>
  );
}

export default BookingDetailPage;
