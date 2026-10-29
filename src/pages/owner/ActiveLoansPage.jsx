import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  RotateCcw,
  RefreshCw,
  Cpu,
  MapPin,
  Calendar,
} from 'lucide-react';
import { formatDateTime } from '../../lib/utils';

export function ActiveLoansPage() {
  const { profile } = useAuth();
  const [loans, setLoans] = useState([]);
  const [resources, setResources] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLoans();
  }, []);

  async function loadLoans() {
    setLoading(true);
    const [bList, rList, pList] = await Promise.all([
      api.getBookings(),
      api.getResources(),
      api.getProfiles(),
    ]);

    // Active loans are checked_out or overdue
    const active = bList.filter((b) => ['checked_out', 'overdue'].includes(b.status));
    setLoans(active);
    setResources(rList);
    setProfiles(pList);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#073D2D]/10">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#126B4F] flex items-center gap-1.5 mb-1">
            <Cpu className="w-3.5 h-3.5 text-[#D6AD63]" /> Real-Time Custody
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#17231E] tracking-tight">Active Custody &amp; Bench Loans</h1>
          <p className="text-xs text-[#17231E]/70 mt-1">
            Monitor equipment currently out on active loan, check due timestamps, and review custody condition reports.
          </p>
        </div>

        <Button size="sm" variant="secondary" onClick={loadLoans} className="border-[#073D2D]/15 bg-white/80 hover:bg-white text-[#073D2D]">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-[#126B4F]" />
          <span>Refresh Live Status</span>
        </Button>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-[#17231E]/50 flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-[#126B4F]" />
          <span>Loading active equipment loans...</span>
        </div>
      ) : loans.length === 0 ? (
        <Card className="border-[#073D2D]/10 bg-white/70 backdrop-blur-sm">
          <CardBody className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#126B4F]/10 border border-[#126B4F]/20 flex items-center justify-center mx-auto mb-3 shadow-sm">
              <CheckCircle2 className="w-7 h-7 text-[#126B4F]" />
            </div>
            <h3 className="text-base font-serif font-bold text-[#17231E]">No Active Loans In Progress</h3>
            <p className="text-xs text-[#17231E]/60 mt-1 max-w-sm mx-auto leading-relaxed">
              All departmental equipment is safely checked in on storage benches. New checked-out reservations will automatically stream here.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {loans.map((booking) => {
            const res = resources.find((r) => r.id === booking.resource_id);
            const user = profiles.find((p) => p.id === booking.user_id);
            const isOverdue = booking.status === 'overdue' || new Date() > new Date(booking.end_at);

            return (
              <Card
                key={booking.id}
                className={`transition-all hover:shadow-md border-l-4 ${
                  isOverdue 
                    ? 'border-l-rose-500 bg-rose-50/30 border-rose-200' 
                    : 'border-l-[#126B4F] border-[#073D2D]/10 bg-white/80'
                }`}
              >
                <CardBody className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="space-y-2.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={booking.status} />
                      {isOverdue && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600" /> Return Overdue
                        </span>
                      )}
                      <span className="text-[11px] text-[#17231E]/50 font-mono bg-[#F7F1E5] px-2 py-0.5 rounded border border-[#073D2D]/10">
                        REF: {booking.id.substring(0, 8)}
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-base text-[#17231E]">{res?.name}</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-[#17231E]/75">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#126B4F] shrink-0" />
                        <span className="truncate">
                          <strong>{user?.full_name || 'Borrower'}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#D6AD63] shrink-0" />
                        <span className="truncate">{res?.location || 'Lab'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#073D2D] shrink-0" />
                        <span className="truncate">Due: {formatDateTime(booking.end_at)}</span>
                      </div>
                    </div>

                    <div className="text-xs text-[#17231E]/80 bg-[#F7F1E5]/70 p-2.5 rounded-lg border border-[#073D2D]/10 flex items-start gap-2">
                      <span className="font-semibold text-[#073D2D] shrink-0">Initial Custody Check:</span>
                      <span className="italic">"{booking.initial_notes || 'Inspected at bench handaway'}" ({booking.initial_condition || 'Good'})</span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col md:flex-row items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#073D2D]/10">
                    <Link to={`/bookings/${booking.id}/return`}>
                      <Button size="sm" variant="primary" className="bg-[#073D2D] hover:bg-[#126B4F] text-[#F7F1E5]">
                        <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-[#D6AD63]" />
                        <span>Inspect &amp; Return</span>
                      </Button>
                    </Link>

                    <Link to={`/bookings/${booking.id}`}>
                      <Button size="sm" variant="outline" className="border-[#073D2D]/20 text-[#073D2D] hover:bg-[#073D2D]/5">
                        Timeline
                      </Button>
                    </Link>
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
