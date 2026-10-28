import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  User,
  RotateCcw,
  RefreshCw,
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Active Custody &amp; Bench Loans</h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor real-time equipment loans, due return timestamps, and overdue alerts.
          </p>
        </div>

        <Button size="sm" variant="secondary" onClick={loadLoans}>
          <RefreshCw className="w-3.5 h-3.5 mr-1" />
          <span>Refresh Real-Time Status</span>
        </Button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading active loans...</div>
      ) : loans.length === 0 ? (
        <Card>
          <CardBody className="py-14 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">No Active Loans In Progress</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              All departmental equipment is safely in storage benches. New checked-out reservations will appear here.
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
                className={`border-l-4 ${isOverdue ? 'border-l-rose-500 bg-rose-50/20' : 'border-l-blue-500'}`}
              >
                <CardBody className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <StatusBadge status={booking.status} />
                      {isOverdue && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Return Overdue
                        </span>
                      )}
                      <span className="text-xs text-slate-400 font-mono">ID: {booking.id.substring(0, 8)}</span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900">{res?.name}</h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <div>
                        Borrower:{' '}
                        <strong className="text-slate-800">
                          {user?.full_name} ({user?.email})
                        </strong>
                      </div>
                      <div>
                        Location: <span className="font-medium text-slate-700">{res?.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Due: {formatDateTime(booking.end_at)}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded border border-slate-100">
                      Initial Inspection: "{booking.initial_notes || 'Inspected at check-in'}" ({booking.initial_condition || 'Good'})
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link to={`/bookings/${booking.id}/return`}>
                      <Button size="sm" variant="primary">
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                        <span>Inspect &amp; Return</span>
                      </Button>
                    </Link>

                    <Link to={`/bookings/${booking.id}`}>
                      <Button size="sm" variant="outline">
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
