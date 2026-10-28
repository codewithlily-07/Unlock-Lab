import React, { useState, useEffect } from 'react';
import { api } from '../../lib/supabase';
import { useNotifications } from '../../context/NotificationContext';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ShieldCheck, UserCheck, FileCheck, Check, X } from 'lucide-react';
import { formatDate } from '../../lib/utils';

export function VerificationQueuePage() {
  const [profiles, setProfiles] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useNotifications();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [pList, cList] = await Promise.all([api.getProfiles(), api.getCredentials()]);
    setProfiles(pList.filter((p) => !p.is_verified));
    setCredentials(cList.filter((c) => c.status === 'pending'));
    setLoading(false);
  }

  async function handleVerifyUser(userId, verify) {
    await api.verifyUser(userId, verify);
    showToast(verify ? 'User institutional identity verified!' : 'User rejected', verify ? 'success' : 'info');
    loadData();
  }

  async function handleVerifyCredential(credId, status) {
    await api.verifyCredential(credId, status, status === 'verified' ? 'Approved by Department Administrator' : 'Documentation insufficient');
    showToast(`Credential marked as ${status}`, status === 'verified' ? 'success' : 'info');
    loadData();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Administrator Verification Queue</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review institutional identity credentials and verify laboratory owners before equipment publication.
        </p>
      </div>

      {/* Unverified Accounts Queue */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-brand-600" />
              <h3 className="text-base font-bold text-slate-900">Pending Identity Approvals</h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {profiles.length} Pending
            </span>
          </div>
        </CardHeader>

        <CardBody className="p-0">
          {profiles.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">All users and lab owners are verified.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {profiles.map((p) => (
                <div key={p.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900">{p.full_name}</span>
                      <Badge variant={p.role === 'owner' ? 'warning' : 'default'} size="sm">
                        {p.role === 'owner' ? 'Lab Owner (Requires Review)' : p.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {p.email} · {p.organization} ({p.department})
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Role/Year: {p.year_or_designation}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="success" onClick={() => handleVerifyUser(p.id, true)}>
                      <Check className="w-4 h-4 mr-1" /> Verify Identity
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleVerifyUser(p.id, false)}>
                      <X className="w-4 h-4" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Pending Safety Certifications Queue */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-purple-600" />
              <h3 className="text-base font-bold text-slate-900">Submitted Training Certifications</h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {credentials.length} Pending Review
            </span>
          </div>
        </CardHeader>

        <CardBody className="p-0">
          {credentials.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">No training certificates awaiting review.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {credentials.map((c) => (
                <div key={c.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{c.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Type: <span className="capitalize">{c.type}</span> · File: {c.file_path}
                    </p>
                    <p className="text-[11px] text-slate-400">Applicant ID: {c.user_id}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="success" onClick={() => handleVerifyCredential(c.id, 'verified')}>
                      <Check className="w-4 h-4 mr-1" /> Approve Certificate
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleVerifyCredential(c.id, 'rejected')}>
                      <X className="w-4 h-4" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
