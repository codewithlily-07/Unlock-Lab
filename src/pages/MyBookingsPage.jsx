import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import { formatDuration } from '../lib/utils';

export function MyBookingsPage() {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all | pending | approved | completed | cancelled

  useEffect(() => {
    if (currentUser) {
      loadBookings();
    }
  }, [currentUser]);

  async function loadBookings() {
    setLoading(true);
    try {
      const data = await api.getBookings();
      setBookings(data || []);
    } catch (err) {
      console.error('Failed to load reservations:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(bookingId) {
    if (window.confirm('Are you sure you want to cancel this reservation request?')) {
      try {
        await api.cancelBooking(bookingId, 'Cancelled by user');
        showToast('Reservation request cancelled', 'info');
        loadBookings();
      } catch (err) {
        showToast(err.message || 'Failed to cancel reservation', 'error');
      }
    }
  }

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return b.status === 'pending';
    if (activeTab === 'approved') return b.status === 'approved';
    if (activeTab === 'completed') return b.status === 'completed';
    if (activeTab === 'cancelled') return b.status === 'cancelled' || b.status === 'rejected';
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0f7f4] border border-[#126B4F]/20 text-[#073D2D] text-xs font-semibold mb-2">
            <Calendar className="w-3.5 h-3.5 text-[#126B4F]" />
            <span>My Institutional Reservations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#17231E] tracking-tight">
            My Reservations &amp; Requests
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5B53] mt-1">
            Track your pending room and equipment requests, view approved schedules, or cancel reservations.
          </p>
        </div>

        <Link to="/campuses">
          <Button size="sm" variant="primary" className="bg-[#103C2D] text-white font-bold text-xs">
            Browse Facilities
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white border border-[#E5DDD0] overflow-x-auto scrollbar-none shadow-sm">
        {[
          { key: 'all', label: 'All Requests' },
          { key: 'pending', label: 'Pending Review' },
          { key: 'approved', label: 'Approved & Scheduled' },
          { key: 'completed', label: 'Completed' },
          { key: 'cancelled', label: 'Cancelled / Rejected' },
        ].map((tab) => {
          const count =
            tab.key === 'all'
              ? bookings.length
              : tab.key === 'cancelled'
              ? bookings.filter((b) => b.status === 'cancelled' || b.status === 'rejected').length
              : bookings.filter((b) => b.status === tab.key).length;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-[#103C2D] text-white shadow-sm'
                  : 'text-[#4A5043] hover:bg-[#F7F1E7]'
              }`}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="p-16 text-center text-xs font-semibold text-[#798C82]">
          <div className="w-8 h-8 rounded-full border-2 border-[#126B4F] border-t-transparent animate-spin mx-auto mb-3" />
          <span>Loading your reservations...</span>
        </div>
      ) : filteredBookings.length === 0 ? (
        <Card className="border-[#E5DDD0] p-12 text-center space-y-3 bg-white">
          <div className="w-12 h-12 rounded-full bg-[#E8EFE6] text-[#103C2D] flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#17231E]">No Reservations Found</h3>
          <p className="text-xs text-[#4A5B53] max-w-sm mx-auto">
            You do not have any reservations in this category. All records reflect authentic database transactions.
          </p>
          <div className="pt-2">
            <Link to="/campuses">
              <Button size="sm" variant="primary" className="bg-[#103C2D] text-white font-bold text-xs">
                Browse Campus Facilities
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const start = new Date(b.start_time);
            const end = new Date(b.end_time);
            const isPending = b.status === 'pending';
            const isApproved = b.status === 'approved';
            const isRejected = b.status === 'rejected';
            const isCancelled = b.status === 'cancelled';

            return (
              <Card key={b.id} hover className="border-[#E5DDD0] overflow-hidden">
                <CardBody className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-[#103C2D] uppercase tracking-wider">
                        {b.resource_type || 'Facility'}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isApproved
                            ? 'bg-[#126B4F] text-white'
                            : isPending
                            ? 'bg-[#faf6ec] text-[#9e7330] border border-[#D6AD63]/40'
                            : isRejected
                            ? 'bg-[#fdf2f1] text-[#c2413a] border border-[#c2413a]/30'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#17231E] leading-snug">
                      {b.resource_name}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#4A5B53] pt-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#103C2D] shrink-0" />
                        <span>
                          {start.toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#D87E3A] shrink-0" />
                        <span>
                          {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                          {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (
                          {formatDuration(b.duration_minutes)})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:col-span-2">
                        <MapPin className="w-3.5 h-3.5 text-[#798C82] shrink-0" />
                        <span className="truncate">{b.resource_location}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E8E2D2] text-xs text-[#4A5B53]">
                      <span className="font-bold text-[#17231E] block">Purpose:</span>
                      <p className="mt-0.5">{b.purpose}</p>
                    </div>

                    {isRejected && b.rejection_reason && (
                      <div className="p-3 rounded-xl bg-[#fdf2f1] border border-[#c2413a]/30 text-xs text-[#c2413a] space-y-1">
                        <div className="font-bold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Administrator Rejection Reason:</span>
                        </div>
                        <p>{b.rejection_reason}</p>
                      </div>
                    )}

                    {isApproved && b.admin_notes && (
                      <div className="p-3 rounded-xl bg-[#f0f7f4] border border-[#126B4F]/25 text-xs text-[#073D2D]">
                        <span className="font-bold block">Administrator Notes:</span>
                        <p className="mt-0.5">{b.admin_notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                    <Link to={`/resources/${b.resource_id}`}>
                      <Button size="sm" variant="outline" className="w-full text-xs font-bold">
                        View Resource
                      </Button>
                    </Link>

                    {(isPending || isApproved) && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCancel(b.id)}
                        className="w-full text-xs font-bold text-[#c2413a] hover:bg-[#fdf2f1] border-[#c2413a]/30"
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

export default MyBookingsPage;
