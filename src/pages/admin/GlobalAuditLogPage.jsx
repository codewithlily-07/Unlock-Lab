import React, { useState, useEffect } from 'react';
import { api } from '../../lib/supabase';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FormField, Input, Select } from '../../components/ui/FormField';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { History, Download, Filter, Search, ShieldCheck } from 'lucide-react';
import { formatDateTime } from '../../lib/utils';

export function GlobalAuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  async function loadAuditLogs() {
    setLoading(true);
    const data = await api.getAuditLogs();
    setLogs(data);
    setLoading(false);
  }

  function handleExportCSV() {
    if (logs.length === 0) return;
    const headers = ['ID', 'Timestamp', 'Actor ID', 'Actor Role', 'Action', 'Entity Type', 'Entity ID', 'Details'];
    const rows = logs.map((l) => [
      l.id,
      l.created_at,
      l.actor_id || 'system',
      l.actor_role,
      l.action,
      l.entity_type,
      l.entity_id || '',
      JSON.stringify(l.details || {}).replace(/"/g, '""'),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((x) => `"${x}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `unlocklab_audit_log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const filtered = logs.filter((log) => {
    if (roleFilter !== 'all' && log.actor_role !== roleFilter) return false;
    if (search && !log.action.toLowerCase().includes(search.toLowerCase()) && !log.actor_role.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Global Audit Log</h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable, append-only forensic event trail recording all access decisions and custody transfers.
          </p>
        </div>

        <Button size="sm" onClick={handleExportCSV} disabled={logs.length === 0}>
          <Download className="w-3.5 h-3.5 mr-1" />
          <span>Export Audit Log (CSV)</span>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <Input
            placeholder="Search audit actions (e.g. BOOKING_APPROVED, RETURNED)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div>
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="text-xs">
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="owner">Owner</option>
            <option value="manager">Manager</option>
            <option value="user">User / Student</option>
            <option value="system">System / Trigger</option>
          </Select>
        </div>
      </div>

      {/* Logs Table */}
      <Card>
        <CardBody className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Details &amp; Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                    Loading audit records...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                    No audit events match criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-slate-500 whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize font-semibold text-slate-700">{log.actor_role}</span>
                    </TableCell>
                    <TableCell className="text-slate-500 font-mono text-[11px]">
                      {log.entity_type} {log.booking_id ? `(#${log.booking_id.substring(0, 6)})` : ''}
                    </TableCell>
                    <TableCell className="text-slate-600 max-w-xs truncate">
                      {log.details?.reason || log.details?.notes || JSON.stringify(log.details || {})}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
