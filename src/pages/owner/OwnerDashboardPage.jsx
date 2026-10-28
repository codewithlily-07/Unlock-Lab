import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Layers,
  Clock,
  AlertTriangle,
  Plus,
  CheckCircle2,
  Calendar,
  Settings,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { formatDuration } from '../../lib/utils';

export function OwnerDashboardPage() {
  const { profile } = useAuth();
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [profile?.id]);

  async function loadDashboard() {
    setLoading(true);
    const [rList, bList, iList] = await Promise.all([
      api.getResources(),
      api.getBookings(),
      api.getIncidents(),
    ]);

    setResources(rList);
    setBookings(bList);
    setIncidents(iList);
    setLoading(false);
  }

  const pendingCount = bookings.filter((b) => b.status === 'pending_review').length;
  const activeCount = bookings.filter((b) => b.status === 'checked_out').length;
  const overdueCount = bookings.filter((b) => b.status === 'overdue').length;
  const openIncidents = incidents.filter((i) => i.status === 'open').length;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Lab Management &amp; Equipment Oversight
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Departmental overview for ECE laboratory benches, booking requests, and safety compliance.
          </p>
        </div>

        <Link to="/owner/resources/new">
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" />
            <span>List New Equipment</span>
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/owner/requests" className="block">
          <Card hover className="p-4 border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Review Queue</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{pendingCount}</div>
            <span className="text-[10px] text-amber-700 font-medium">Awaiting decision</span>
          </Card>
        </Link>

        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Checked-Out</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{activeCount}</div>
          <span className="text-[10px] text-blue-700 font-medium">Currently in lab use</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Overdue Returns</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{overdueCount}</div>
          <span className="text-[10px] text-rose-700 font-medium">Past scheduled return</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Open Incidents</span>
            <AlertTriangle className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{openIncidents}</div>
          <span className="text-[10px] text-purple-700 font-medium">Requires resolution</span>
        </Card>
      </div>

      {/* Managed Resources Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-brand-600" />
              <h3 className="text-base font-bold text-slate-900">Departmental Equipment Catalog</h3>
            </div>
            <span className="text-xs text-slate-500">{resources.length} Instruments Active</span>
          </div>
        </CardHeader>

        <CardBody className="p-0">
          <div className="divide-y divide-slate-100">
            {resources.map((res) => (
              <div key={res.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                    <img
                      src={res.photos?.[0] || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'}
                      alt={res.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-sm text-slate-900">{res.name}</h4>
                      <Badge variant="default" size="sm">
                        {res.category}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-500 mt-0.5">{res.location}</p>

                    <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-1">
                      <span>Max {formatDuration(res.max_booking_minutes)}</span>
                      <span>·</span>
                      <span>{res.requires_approval ? 'Approval Required' : 'Auto-Approve'}</span>
                      <span>·</span>
                      <span>QR: {res.qr_token}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Link to={`/resources/${res.id}`}>
                    <Button size="sm" variant="outline">
                      View Live
                    </Button>
                  </Link>

                  <Link to={`/owner/resources/${res.id}/edit`}>
                    <Button size="sm" variant="secondary">
                      <Settings className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
