import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/supabase';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  ShieldCheck,
  TrendingUp,
  Clock,
  AlertTriangle,
  History,
  Scale,
  Users,
  Cpu,
  Lock,
  Unlock,
} from 'lucide-react';

export function AdminDashboardPage() {
  const [profiles, setProfiles] = useState([]);
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    const [pList, rList, bList, iList] = await Promise.all([
      api.getProfiles(),
      api.getResources(),
      api.getBookings(),
      api.getIncidents(),
    ]);
    setProfiles(pList);
    setResources(rList);
    setBookings(bList);
    setIncidents(iList);
    setLoading(false);
  }

  const unverifiedProfiles = profiles.filter((p) => !p.is_verified);
  const totalCompleted = bookings.filter((b) => b.status === 'closed').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Departmental Admin &amp; Analytics Hub</h1>
          <p className="text-xs text-slate-500 mt-1">
            Department of Electronics &amp; Communication Engineering · Apex Institute of Technology
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link to="/admin/verifications">
            <Button size="sm" variant="outline">
              <ShieldCheck className="w-4 h-4 mr-1.5 text-brand-600" />
              <span>Verifications ({unverifiedProfiles.length})</span>
            </Button>
          </Link>

          <Link to="/admin/audit-log">
            <Button size="sm" variant="secondary">
              <History className="w-4 h-4 mr-1.5 text-slate-600" />
              <span>Global Audit Log</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Analytics KPI Dashboard (Section 8 & 13) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-brand-600">
          <span className="text-xs font-semibold text-slate-500 block">Idle Hours Unlocked</span>
          <div className="text-2xl font-extrabold text-brand-600 mt-1">142.5 hrs</div>
          <span className="text-[10px] text-slate-400 mt-1 block">73% off-peak utilization</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-600">
          <span className="text-xs font-semibold text-slate-500 block">Completed Clean Handaways</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{totalCompleted} Sessions</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Full before/after condition verified</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-purple-600">
          <span className="text-xs font-semibold text-slate-500 block">Avg. Approval Turnaround</span>
          <div className="text-2xl font-extrabold text-purple-600 mt-1">1.8 hrs</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Rule-based suggested decisions</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-600">
          <span className="text-xs font-semibold text-slate-500 block">Equipment Incident Rate</span>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">1.4%</div>
          <span className="text-[10px] text-slate-400 mt-1 block">1 active dispute under review</span>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/admin/verifications" className="block">
          <Card hover className="p-5">
            <ShieldCheck className="w-6 h-6 text-brand-600 mb-2" />
            <h3 className="font-bold text-sm text-slate-900">Verification Queue</h3>
            <p className="text-xs text-slate-500 mt-1">
              Verify institutional IDs, lab owners, and submitted training certificates.
            </p>
          </Card>
        </Link>

        <Link to="/admin/audit-log" className="block">
          <Card hover className="p-5">
            <History className="w-6 h-6 text-purple-600 mb-2" />
            <h3 className="font-bold text-sm text-slate-900">Global Audit Log &amp; Export</h3>
            <p className="text-xs text-slate-500 mt-1">
              Append-only tamper-proof forensic trail with CSV export for audit compliance.
            </p>
          </Card>
        </Link>

        <Link to="/admin/fair-use" className="block">
          <Card hover className="p-5">
            <Scale className="w-6 h-6 text-amber-600 mb-2" />
            <h3 className="font-bold text-sm text-slate-900">Fair-Use Settings &amp; Flags</h3>
            <p className="text-xs text-slate-500 mt-1">
              Configure weekly hour caps, concurrent booking limits, and anti-monopolization warnings.
            </p>
          </Card>
        </Link>
      </div>

      {/* User Governance Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-brand-600" />
              <h3 className="text-base font-bold text-slate-900">Institutional User Management</h3>
            </div>
            <span className="text-xs text-slate-500">{profiles.length} Total Registered Users</span>
          </div>
        </CardHeader>

        <CardBody className="p-0">
          <div className="divide-y divide-slate-100">
            {profiles.map((p) => (
              <div key={p.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-900">{p.full_name}</span>
                    <Badge variant={p.is_verified ? 'success' : 'warning'} size="sm">
                      {p.is_verified ? 'Verified' : 'Unverified'}
                    </Badge>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {p.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {p.email} · {p.organization} ({p.department})
                  </p>
                </div>

                <div className="text-right text-xs">
                  <span className="font-semibold text-slate-700 block">{p.year_or_designation}</span>
                  <span className="text-[11px] text-slate-400">{p.phone || 'No phone'}</span>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
