import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  ShieldCheck,
  Building,
  Cpu,
  Clock,
  CheckCircle2,
  Users,
  PlusCircle,
  Inbox,
  AlertCircle,
  History,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

export function AdminDashboardPage() {
  const { currentUser, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError('');
    try {
      const [sData, aData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminAuditLogs(20),
      ]);
      setStats(sData);
      setAuditLogs(aData || []);
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
      setError(err.message || 'Error communicating with database');
    } finally {
      setLoading(false);
    }
  }

  if (!isAdmin) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-[#c2413a]/30 shadow-sm space-y-3 max-w-md mx-auto my-12">
        <ShieldCheck className="w-10 h-10 text-[#c2413a] mx-auto" />
        <h2 className="text-base font-bold text-[#17231E]">Access Restricted</h2>
        <p className="text-xs text-[#4A5B53]">Administrative privileges are strictly enforced on the server.</p>
        <Link to="/">
          <Button size="sm" variant="primary">Return to Homepage</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#073D2D]/10">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#126B4F] flex items-center gap-1.5 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D6AD63]" /> Institutional Administration &amp; Oversight
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#17231E] tracking-tight">
            Administrator Hub
          </h1>
          <p className="text-xs text-[#17231E]/70 mt-1">
            Real-time analytics and management computed directly from the UnlockLab SQLite database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/owner/resources/new">
            <Button size="sm" variant="primary" className="bg-[#103C2D] text-white font-bold text-xs">
              <PlusCircle className="w-3.5 h-3.5 mr-1" />
              Add Resource
            </Button>
          </Link>
          <Link to="/owner/requests">
            <Button size="sm" variant="outline" className="text-xs font-bold border-[#E8E2D2]">
              <Inbox className="w-3.5 h-3.5 mr-1 text-[#D87E3A]" />
              Review Queue ({stats?.pending_requests || 0})
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs font-semibold text-[#798C82]">
          <div className="w-8 h-8 rounded-full border-2 border-[#126B4F] border-t-transparent animate-spin mx-auto mb-3" />
          <span>Computing institutional statistics from database...</span>
        </div>
      ) : error ? (
        <Card className="border-[#c2413a]/30 bg-[#fdf2f1] p-6 text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-[#c2413a] mx-auto" />
          <p className="text-xs font-bold text-[#c2413a]">{error}</p>
          <Button size="sm" variant="outline" onClick={loadDashboard}>Retry</Button>
        </Card>
      ) : (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-[#E5DDD0]">
              <CardBody className="p-5 space-y-1">
                <div className="flex items-center justify-between text-xs text-[#798C82] font-semibold">
                  <span>Total Resources</span>
                  <Building className="w-4 h-4 text-[#103C2D]" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-[#17231E]">
                  {stats?.active_resources || 0}
                </div>
                <p className="text-[11px] text-[#4A5B53]">
                  {stats?.total_rooms || 0} Rooms &middot; {stats?.total_equipment || 0} Instruments
                </p>
              </CardBody>
            </Card>

            <Card className="border-[#E5DDD0]">
              <CardBody className="p-5 space-y-1">
                <div className="flex items-center justify-between text-xs text-[#798C82] font-semibold">
                  <span>Pending Requests</span>
                  <Clock className="w-4 h-4 text-[#D87E3A]" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-[#D87E3A]">
                  {stats?.pending_requests || 0}
                </div>
                <p className="text-[11px] text-[#4A5B53]">Awaiting administrative review</p>
              </CardBody>
            </Card>

            <Card className="border-[#E5DDD0]">
              <CardBody className="p-5 space-y-1">
                <div className="flex items-center justify-between text-xs text-[#798C82] font-semibold">
                  <span>Approved Bookings</span>
                  <CheckCircle2 className="w-4 h-4 text-[#126B4F]" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-[#126B4F]">
                  {stats?.approved_bookings || 0}
                </div>
                <p className="text-[11px] text-[#4A5B53]">Active scheduled reservations</p>
              </CardBody>
            </Card>

            <Card className="border-[#E5DDD0]">
              <CardBody className="p-5 space-y-1">
                <div className="flex items-center justify-between text-xs text-[#798C82] font-semibold">
                  <span>Registered Users</span>
                  <Users className="w-4 h-4 text-[#073D2D]" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-[#17231E]">
                  {stats?.total_users || 0}
                </div>
                <p className="text-[11px] text-[#4A5B53]">Across {stats?.total_departments || 0} departments</p>
              </CardBody>
            </Card>
          </div>

          {/* Quick Admin Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/owner/requests"
              className="p-5 rounded-2xl bg-white border border-[#E5DDD0] hover:border-[#103C2D] transition-all shadow-sm group flex items-start gap-3.5"
            >
              <div className="w-10 h-10 rounded-xl bg-[#faf6ec] text-[#9e7330] flex items-center justify-center shrink-0">
                <Inbox className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#17231E] group-hover:text-[#103C2D] flex items-center gap-1">
                  <span>Review Pending Queue</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-xs text-[#4A5B53] mt-0.5">
                  Inspect incoming room and instrument requests, check double-booking conflicts, and approve.
                </p>
              </div>
            </Link>

            <Link
              to="/owner/resources/new"
              className="p-5 rounded-2xl bg-white border border-[#E5DDD0] hover:border-[#103C2D] transition-all shadow-sm group flex items-start gap-3.5"
            >
              <div className="w-10 h-10 rounded-xl bg-[#f0f7f4] text-[#126B4F] flex items-center justify-center shrink-0">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#17231E] group-hover:text-[#103C2D] flex items-center gap-1">
                  <span>Register New Facility</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-xs text-[#4A5B53] mt-0.5">
                  Add testing cells, laboratories, or precision instruments to the database catalog.
                </p>
              </div>
            </Link>

            <Link
              to="/campuses"
              className="p-5 rounded-2xl bg-white border border-[#E5DDD0] hover:border-[#103C2D] transition-all shadow-sm group flex items-start gap-3.5"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FAF9F5] text-[#103C2D] flex items-center justify-center shrink-0 border border-[#E8E2D2]">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#17231E] group-hover:text-[#103C2D] flex items-center gap-1">
                  <span>Campuses &amp; Facility Hubs</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-xs text-[#4A5B53] mt-0.5">
                  View how campus research facilities and labs are publicly presented to students and faculty.
                </p>
              </div>
            </Link>
          </div>

          {/* Audit Logs Table */}
          <Card className="border-[#E5DDD0]">
            <CardHeader className="p-5 border-b border-[#E8E2D2]">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#17231E] flex items-center gap-2">
                  <History className="w-4 h-4 text-[#103C2D]" />
                  <span>Administrative Audit History</span>
                </h3>
                <span className="text-[11px] text-[#798C82] font-semibold">
                  Last {auditLogs.length} verified operations
                </span>
              </div>
            </CardHeader>

            <CardBody className="p-0 overflow-x-auto">
              {auditLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#798C82]">
                  No audit entries recorded yet.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF9F5] border-b border-[#E8E2D2] text-[#4A5B53] font-bold">
                    <tr>
                      <th className="py-2.5 px-4">Timestamp</th>
                      <th className="py-2.5 px-4">Action</th>
                      <th className="py-2.5 px-4">Entity</th>
                      <th className="py-2.5 px-4">Actor</th>
                      <th className="py-2.5 px-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D2] text-[#17231E]">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#FAF9F5]">
                        <td className="py-2.5 px-4 text-[#798C82] whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-[11px] text-[#103C2D]">
                          {log.action}
                        </td>
                        <td className="py-2.5 px-4 uppercase text-[10px] font-bold text-[#798C82]">
                          {log.entity_type}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="font-semibold">{log.actor_name || 'System Admin'}</span>
                          {log.actor_email && (
                            <span className="text-[10px] text-[#798C82] block">{log.actor_email}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-[11px] text-[#4A5B53] max-w-xs truncate">
                          {log.details ? JSON.stringify(log.details) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}

export default AdminDashboardPage;
