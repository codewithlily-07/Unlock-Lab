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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#073D2D]/10">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#126B4F] flex items-center gap-1.5 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D6AD63]" /> Forensic Record
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#17231E] tracking-tight">Global Audit Log</h1>
          <p className="text-xs text-[#17231E]/70 mt-1">
            Immutable, append-only forensic event trail recording all access decisions and custody transfers.
          </p>
        </div>

        <Button size="sm" onClick={handleExportCSV} disabled={logs.length === 0} className="bg-[#073D2D] hover:bg-[#126B4F] text-[#F7F1E5]">
          <Download className="w-3.5 h-3.5 mr-1.5 text-[#D6AD63]" />
          <span>Export Audit Log (CSV)</span>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white/80 p-4 rounded-2xl border border-[#073D2D]/10 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-[#17231E]/40 absolute left-3.5 top-3" />
          <Input
            placeholder="Search audit actions (e.g. BOOKING_APPROVED, RETURNED)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs border-[#073D2D]/15 focus:border-[#126B4F]"
          />
        </div>

        <div>
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="text-xs border-[#073D2D]/15">
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="owner">Owner</option>
            <option value="manager">Manager</option>
            <option value="user">User / Student</option>
            <option value="system">System / Trigger</option>
          </Select>
        </div>
      </div>

      {/* Audit Log Table */}
      <Card className="border-[#073D2D]/10 bg-white/80 overflow-hidden">
        <CardBody className="p-0">
          {loading ? (
            <div className="p-12 text-center text-xs text-[#17231E]/50">Loading immutable audit log...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#17231E]/50">No forensic log events matching search criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F7F1E5]/60 text-[#17231E]/70 border-b border-[#073D2D]/10 text-xs">
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Actor / Role</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details / Forensic Hash</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((log) => (
                    <TableRow key={log.id} className="hover:bg-[#F7F1E5]/30 text-xs border-b border-[#073D2D]/5">
                      <TableCell className="font-mono text-[11px] text-[#17231E]/60 whitespace-nowrap">
                        {formatDateTime(log.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-[#17231E] capitalize">{log.actor_role}</span>
                          <span className="text-[10px] text-[#17231E]/40 font-mono">({log.actor_id?.substring(0, 6) || 'sys'})</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-[#073D2D]/5 text-[#073D2D] border border-[#073D2D]/10">
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell className="text-[#17231E]/70 font-mono text-[11px]">
                        {log.entity_type} {log.entity_id ? `(${log.entity_id.substring(0, 6)})` : ''}
                      </TableCell>
                      <TableCell className="max-w-md truncate font-mono text-[11px] text-[#17231E]/60">
                        {JSON.stringify(log.details || {})}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
