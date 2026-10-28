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
      setAuditLogs(logs);
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
    return <div className="p-12 text-center text-xs text-slate-400">Loading reservation history...</div>;
  }

  if (!booking) {
    return <div className="p-12 text-center text-xs text-slate-400">Reservation not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 printable-receipt">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <button
          onClick={() => navigate('/my-bookings')}
          className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Bookings</span>
        </button>

        <div className="flex items-center space-x-2">
          {['approved', 'checked_out'].includes(booking.status) && (
            <Button size="sm" variant="secondary" onClick={handleExportCalendar}>
              <Download className="w-3.5 h-3.5 mr-1" />
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
                <span className="text-xs text-slate-400 font-mono">ID: {booking.id}</span>
              </div>
              <h1 className="text-xl font-extrabold text-slate-900">{resource?.name}</h1>
              <p className="text-xs text-slate-500 mt-0.5">{resource?.location}</p>
            </div>

            {/* Lifecycle Quick Actions */}
            <div className="no-print">
              {booking.status === 'approved' && (
                <Link to={`/bookings/${booking.id}/checkin`}>
                  <Button variant="success" size="sm">
                    Check In &amp; Accept Handover
                  </Button>
                </Link>
              )}

              {(booking.status === 'checked_out' || booking.status === 'overdue') && (
                <Link to={`/bookings/${booking.id}/return`}>
                  <Button variant="primary" size="sm">
                    Return Equipment &amp; Record Condition
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-500 block mb-0.5">Scheduled Reservation:</span>
              <span className="font-bold text-slate-800">
                {formatDateTime(booking.start_at)} &rarr; {formatDateTime(booking.end_at)}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block mb-0.5">Declared Purpose:</span>
              <span className="font-semibold text-slate-800 italic">"{booking.purpose}"</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Section 7: Explainable "Why this decision?" Box */}
      <WhyDecisionBox booking={booking} />

      {/* Inspection & Custody Handover Condition Reports */}
      {(booking.initial_condition || booking.return_condition) && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-bold text-slate-900">Custody Handover Condition Reports</h3>
          </CardHeader>
          <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {booking.initial_condition && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  1. Check-In Handover Inspection
                </span>
                <div className="font-bold text-slate-900 capitalize text-sm mb-1">
                  Condition: {booking.initial_condition}
                </div>
                <p className="text-slate-600 italic">"{booking.initial_notes || 'Clean condition verified'}"</p>
                <span className="text-[10px] text-slate-400 mt-2 block">
                  Recorded: {formatDateTime(booking.checked_in_at)}
                </span>
              </div>
            )}

            {booking.return_condition && (
              <div
                className={`p-4 rounded-xl border ${
                  booking.return_condition === 'damaged'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  2. Return Handover Inspection
                </span>
                <div className="font-bold capitalize text-sm mb-1">
                  Condition: {booking.return_condition}
                </div>
                <p className="italic">"{booking.return_notes || 'Item inspected on return'}"</p>
                <span className="text-[10px] opacity-75 mt-2 block">
                  Recorded: {formatDateTime(booking.returned_at)}
                </span>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Section 10: Complete Audit Log History Timeline */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-bold text-slate-900">Immutable Audit Trail</h3>
          <p className="text-xs text-slate-500 mt-0.5">
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
