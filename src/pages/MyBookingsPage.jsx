import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import {
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle,
  RotateCcw,
  AlertTriangle,
  History,
  QrCode,
} from 'lucide-react';
import { formatDateTime, formatDate } from '../lib/utils';

export function MyBookingsPage() {
  const { profile } = useAuth();
  const { showToast } = useNotifications();
  const [bookings, setBookings] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // active | pending | waitlisted | past

  useEffect(() => {
    loadBookings();
  }, [profile?.id]);

  async function loadBookings() {
    if (!profile?.id) return;
    setLoading(true);
    const [bList, rList] = await Promise.all([
      api.getBookings(profile.id),
      api.getResources(),
    ]);
    setBookings(bList);
    setResources(rList);
    setLoading(false);
  }

  async function handleCancel(bookingId) {
    if (window.confirm('Cancel this booking request? If waitlisted users exist, the slot will be auto-promoted.')) {
      await api.transitionBooking(bookingId, 'cancelled', 'Cancelled voluntarily by borrower', profile.id);
      showToast('Booking cancelled and slot released', 'info');
      loadBookings();
    }
  }

  // Filter tabs
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'active') return ['approved', 'checked_out', 'overdue'].includes(b.status);
    if (activeTab === 'pending') return ['requested', 'pending_review', 'eligibility_failed'].includes(b.status);
    if (activeTab === 'waitlisted') return b.status === 'waitlisted';
    if (activeTab === 'past') return ['closed', 'returned', 'returned_late', 'cancelled', 'rejected', 'disputed', 'no_show'].includes(b.status);
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Equipment Reservations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track active bench loans, pending reviews, transparent waitlist positions, and return receipts.
          </p>
        </div>

        <Link to="/explore">
          <Button size="sm">
            <span>Book Equipment</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'active'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Active Loans</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px]">
            {bookings.filter((b) => ['approved', 'checked_out', 'overdue'].includes(b.status)).length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'pending'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Pending Review</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px]">
            {bookings.filter((b) => ['requested', 'pending_review', 'eligibility_failed'].includes(b.status)).length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('waitlisted')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'waitlisted'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Waitlist</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px]">
            {bookings.filter((b) => b.status === 'waitlisted').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('past')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'past'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>History &amp; Closed</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px]">
            {bookings.filter((b) => ['closed', 'returned', 'returned_late', 'cancelled', 'rejected', 'disputed', 'no_show'].includes(b.status)).length}
          </span>
        </button>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading your reservations...</div>
      ) : filteredBookings.length === 0 ? (
        <Card>
          <CardBody className="py-14 text-center">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-700">No Reservations in this Category</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
              Explore available oscilloscopes, 3D printers, and testing bays to schedule bench time.
            </p>
            <Link to="/explore">
              <Button size="sm">Explore Equipment</Button>
            </Link>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const res = resources.find((r) => r.id === booking.resource_id);

            return (
              <Card key={booking.id} hover>
                <CardBody className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <StatusBadge status={booking.status} />
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {res?.category}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900">{res?.name}</h3>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {formatDateTime(booking.start_at)} &rarr; {formatDateTime(booking.end_at)}
                        </span>
                      </div>
                      <div>
                        Location: <span className="font-medium text-slate-700">{res?.location}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded border border-slate-100">
                      Purpose: "{booking.purpose}"
                    </p>

                    {booking.decision_reason && (
                      <p className="text-xs text-brand-700 font-medium">
                        Reason: {booking.decision_reason}
                      </p>
                    )}
                  </div>

                  {/* Actions column */}
                  <div className="flex flex-row md:flex-col items-end justify-between gap-2 border-t md:border-t-0 pt-3 md:pt-0">
                    <Link to={`/bookings/${booking.id}`}>
                      <Button size="sm" variant="outline" className="w-full">
                        <span>Details &amp; Audit Trail</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>

                    {booking.status === 'approved' && (
                      <Link to={`/bookings/${booking.id}/checkin`}>
                        <Button size="sm" variant="success" className="w-full">
                          <span>Check In Now</span>
                        </Button>
                      </Link>
                    )}

                    {(booking.status === 'checked_out' || booking.status === 'overdue') && (
                      <Link to={`/bookings/${booking.id}/return`}>
                        <Button size="sm" variant="primary" className="w-full">
                          <span>Return Equipment</span>
                        </Button>
                      </Link>
                    )}

                    {['requested', 'pending_review', 'waitlisted'].includes(booking.status) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        onClick={() => handleCancel(booking.id)}
                      >
                        Cancel Request
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

