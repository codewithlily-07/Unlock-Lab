import React, { useState, useEffect } from 'react';
import { api } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { FormField, Textarea, Select } from '../../components/ui/FormField';
import {
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  User,
  Clock,
  ArrowRight,
  ShieldAlert,
  MapPin,
} from 'lucide-react';
import { formatDateTime } from '../../lib/utils';

export function IncidentsPage() {
  const { profile } = useAuth();
  const { showToast } = useNotifications();
  const [incidents, setIncidents] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  // Resolution modal state
  const [activeIncident, setActiveIncident] = useState(null);
  const [resolutionStatus, setResolutionStatus] = useState('resolved');
  const [resolutionNote, setResolutionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadIncidents();
  }, []);

  async function loadIncidents() {
    setLoading(true);
    const [iList, rList] = await Promise.all([api.getIncidents(), api.getResources()]);
    setIncidents(iList);
    setResources(rList);
    setLoading(false);
  }

  function openResolveModal(inc) {
    setActiveIncident(inc);
    setResolutionStatus('resolved');
    setResolutionNote('Equipment inspected, repaired, and recalibrated by lab staff. Bench re-certified for active bookings.');
  }

  async function handleResolveSubmit(e) {
    e.preventDefault();
    if (!resolutionNote.trim()) {
      showToast('Resolution notes are required.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.resolveIncident(activeIncident.id, resolutionStatus, resolutionNote, profile.id);
      setSubmitting(false);
      setActiveIncident(null);
      showToast(`Incident marked as ${resolutionStatus} and booking dispute resolved!`, 'success');
      loadIncidents();
    } catch (err) {
      setSubmitting(false);
      showToast(err.message || 'Error resolving incident', 'error');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#073D2D]/10">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#126B4F] flex items-center gap-1.5 mb-1">
            <ShieldAlert className="w-3.5 h-3.5 text-[#D6AD63]" /> Dispute Arbitration
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#17231E] tracking-tight">Equipment Incident Management</h1>
          <p className="text-xs text-[#17231E]/70 mt-1">
            Review reported physical damages, bench malfunctions, and disputes with AI-assisted neutral summaries.
          </p>
        </div>

        <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200 shadow-sm">
          {incidents.filter((i) => i.status === 'open').length} Open Incidents
        </span>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-[#17231E]/50 flex flex-col items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-[#126B4F] border-t-transparent rounded-full animate-spin" />
          <span>Loading safety incidents...</span>
        </div>
      ) : incidents.length === 0 ? (
        <Card className="border-[#073D2D]/10 bg-white/70">
          <CardBody className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#126B4F]/10 border border-[#126B4F]/20 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7 text-[#126B4F]" />
            </div>
            <h3 className="text-base font-serif font-bold text-[#17231E]">Zero Open Incidents</h3>
            <p className="text-xs text-[#17231E]/60 mt-1 max-w-sm mx-auto">
              All laboratory benches and instruments are operational in certified good condition.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {incidents.map((inc) => {
            const res = resources.find((r) => r.id === inc.resource_id);
            const isOpen = inc.status === 'open';

            return (
              <Card
                key={inc.id}
                className={`transition-all hover:shadow-md border-l-4 ${
                  isOpen 
                    ? 'border-l-rose-500 bg-white/90 border-[#073D2D]/10' 
                    : 'border-l-[#126B4F] bg-white/70 border-[#073D2D]/10'
                }`}
              >
                <CardBody className="p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2 mb-1.5">
                        <Badge variant={isOpen ? 'danger' : 'success'} size="sm">
                          {isOpen ? 'Open Dispute' : 'Resolved'}
                        </Badge>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                          {inc.type} Incident · {inc.severity} Severity
                        </span>
                      </div>

                      <h3 className="text-lg font-serif font-bold text-[#17231E]">{res?.name}</h3>
                      <p className="text-xs text-[#17231E]/60 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#D6AD63]" />
                        {res?.location}
                      </p>
                    </div>

                    <div className="text-right text-xs text-[#17231E]/50">
                      <span>Reported: {formatDateTime(inc.created_at)}</span>
                    </div>
                  </div>

                  {/* AI-Generated Neutral Incident Summary */}
                  {inc.ai_summary && (
                    <div className="p-4 rounded-xl bg-[#073D2D]/5 border border-[#126B4F]/20 text-xs text-[#073D2D] flex items-start space-x-3">
                      <Sparkles className="w-4 h-4 text-[#D6AD63] shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <strong className="block font-bold text-[#073D2D] mb-0.5">
                          AI-Assisted Neutral Summary — Review Before Acting:
                        </strong>
                        <span className="text-[#17231E]/80">
                          {inc.ai_summary.replace('AI-generated summary - review before acting: ', '')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Primary Reported Description */}
                  <div className="p-4 rounded-xl bg-[#F7F1E5]/70 border border-[#073D2D]/10 text-xs text-[#17231E]/80">
                    <span className="font-semibold block text-[#073D2D] mb-1">Borrower / Technician Report:</span>
                    <p className="italic">"{inc.description}"</p>
                  </div>

                  {/* Resolution Notes if Resolved */}
                  {inc.resolution_note && (
                    <div className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900">
                      <strong className="font-bold text-emerald-950">Resolution Note:</strong> "{inc.resolution_note}"
                      <span className="block text-[10px] text-emerald-700 mt-1">
                        Resolved by Lab Authority on {formatDateTime(inc.resolved_at)}
                      </span>
                    </div>
                  )}

                  {/* Action buttons */}
                  {isOpen && (
                    <div className="pt-3 border-t border-[#073D2D]/10 flex items-center justify-end space-x-3">
                      {inc.booking_id && (
                        <a
                          href={`/bookings/${inc.booking_id}`}
                          className="text-xs font-semibold text-[#073D2D] hover:text-[#126B4F] underline underline-offset-4"
                        >
                          View Custody Receipt &rarr;
                        </a>
                      )}
                      <Button size="sm" variant="success" onClick={() => openResolveModal(inc)} className="bg-[#126B4F] hover:bg-[#073D2D] text-white">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-[#D6AD63]" />
                        <span>Resolve Dispute &amp; Recertify</span>
                      </Button>
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Resolve Incident Modal */}
      <Modal
        isOpen={Boolean(activeIncident)}
        onClose={() => setActiveIncident(null)}
        title="Resolve Equipment Safety Incident"
        footer={
          <>
            <Button variant="secondary" onClick={() => setActiveIncident(null)}>
              Cancel
            </Button>
            <Button variant="success" onClick={handleResolveSubmit} loading={submitting} className="bg-[#126B4F] hover:bg-[#073D2D] text-white">
              Confirm Resolution
            </Button>
          </>
        }
      >
        <form onSubmit={handleResolveSubmit} className="space-y-4 text-left">
          <FormField label="Resolution Outcome" required>
            <Select value={resolutionStatus} onChange={(e) => setResolutionStatus(e.target.value)}>
              <option value="resolved">Resolved — Repaired / Tested &amp; Returned to Service</option>
              <option value="dismissed">Dismissed — Minor cosmetic wear / No safety concern</option>
            </Select>
          </FormField>

          <FormField label="Official Resolution Notes &amp; Corrective Action" required>
            <Textarea
              required
              rows={3}
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
            />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
