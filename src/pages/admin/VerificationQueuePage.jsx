import React, { useState, useEffect } from 'react';
import { api } from '../../lib/supabase';
import { useNotifications } from '../../context/NotificationContext';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ShieldCheck, UserCheck, FileCheck, Check, X, Sparkles } from 'lucide-react';
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
      <div className="pb-2 border-b border-[#073D2D]/10">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#126B4F] flex items-center gap-1.5 mb-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#D6AD63]" /> Access Control
        </span>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#17231E]">Administrator Verification Queue</h1>
        <p className="text-xs text-[#17231E]/70 mt-1">
          Review institutional identity credentials and verify laboratory owners before equipment publication.
        </p>
      </div>

      {/* Unverified Accounts Queue */}
      <Card className="border-[#073D2D]/10 bg-white/80">
        <CardHeader className="border-b border-[#073D2D]/10 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-[#126B4F]" />
              <h3 className="text-base font-serif font-bold text-[#17231E]">Pending Identity Approvals</h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#073D2D]/5 text-[#073D2D] border border-[#073D2D]/10">
              {profiles.length} Pending
            </span>
          </div>
        </CardHeader>

        <CardBody className="p-0">
          {profiles.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#17231E]/50">All users and lab owners are currently verified.</div>
          ) : (
            <div className="divide-y divide-[#073D2D]/10">
              {profiles.map((p) => (
                <div key={p.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#F7F1E5]/30 transition-colors">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-bold text-sm text-[#17231E]">{p.full_name}</span>
                      <Badge variant={p.role === 'owner' ? 'warning' : 'default'} size="sm">
                        {p.role === 'owner' ? 'Lab Owner (Requires Review)' : p.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#17231E]/70">
                      {p.email} · <span className="font-medium text-[#17231E]">{p.organization}</span> ({p.department})
                    </p>
                    <p className="text-[11px] text-[#17231E]/50 mt-0.5">Role/Year: {p.year_or_designation}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="success" onClick={() => handleVerifyUser(p.id, true)} className="bg-[#126B4F] hover:bg-[#073D2D] text-white">
                      <Check className="w-4 h-4 mr-1 text-[#D6AD63]" /> Verify Identity
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleVerifyUser(p.id, false)} className="border-rose-200 text-rose-700 hover:bg-rose-50">
                      <X className="w-4 h-4 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Pending Safety Certifications Queue */}
      <Card className="border-[#073D2D]/10 bg-white/80">
        <CardHeader className="border-b border-[#073D2D]/10 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-[#D6AD63]" />
              <h3 className="text-base font-serif font-bold text-[#17231E]">Submitted Training Certifications</h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#073D2D]/5 text-[#073D2D] border border-[#073D2D]/10">
              {credentials.length} Pending Review
            </span>
          </div>
        </CardHeader>

        <CardBody className="p-0">
          {credentials.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#17231E]/50">No training certificates awaiting review.</div>
          ) : (
            <div className="divide-y divide-[#073D2D]/10">
              {credentials.map((c) => (
                <div key={c.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#F7F1E5]/30 transition-colors">
                  <div>
                    <h4 className="font-bold text-sm text-[#17231E]">{c.name}</h4>
                    <p className="text-xs text-[#17231E]/70 mt-0.5">
                      Type: <span className="capitalize font-medium text-[#073D2D]">{c.type}</span> · File: {c.file_path}
                    </p>
                    <p className="text-[11px] text-[#17231E]/50 font-mono">Applicant ID: {c.user_id}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="success" onClick={() => handleVerifyCredential(c.id, 'verified')} className="bg-[#126B4F] hover:bg-[#073D2D] text-white">
                      <Check className="w-4 h-4 mr-1 text-[#D6AD63]" /> Approve Certificate
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleVerifyCredential(c.id, 'rejected')} className="border-rose-200 text-rose-700 hover:bg-rose-50">
                      <X className="w-4 h-4 mr-1" /> Reject
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
