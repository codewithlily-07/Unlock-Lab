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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Equipment Incident Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review reported physical damages, malfunctions, and disputes with AI-assisted neutral summaries.
          </p>
        </div>

        <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-800">
          {incidents.filter((i) => i.status === 'open').length} Open Incidents
        </span>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading safety incidents...</div>
      ) : incidents.length === 0 ? (
        <Card>
          <CardBody className="py-14 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">Zero Open Incidents</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
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
                className={`border-l-4 ${isOpen ? 'border-l-rose-500' : 'border-l-emerald-500'}`}
              >
                <CardBody className="p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant={isOpen ? 'danger' : 'success'} size="sm">
                          {isOpen ? 'Open Dispute' : 'Resolved'}
                        </Badge>
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                          {inc.type} Incident · {inc.severity} Severity
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">{res?.name}</h3>
                      <p className="text-xs text-slate-500">{res?.location}</p>
                    </div>

                    <div className="text-right text-xs text-slate-400">
                      <span>Reported: {formatDateTime(inc.created_at)}</span>
                    </div>
                  </div>

                  {/* Section 10: AI-Generated Neutral Incident Summary */}
                  {inc.ai_summary && (
                    <div className="p-3.5 rounded-xl bg-purple-50/80 border border-purple-200 text-xs text-purple-900 flex items-start space-x-2.5">
                      <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <strong className="block font-semibold mb-0.5">AI-Generated Summary — Review Before Acting:</strong>
                        <span>{inc.ai_summary.replace('AI-generated summary - review before acting: ', '')}</span>
                      </div>
                    </div>
                  )}

                  {/* Primary Reported Description */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                    <span className="font-semibold block text-slate-900 mb-1">Borrower / Technician Report:</span>
                    <p className="italic">"{inc.description}"</p>
                  </div>

                  {/* Resolution Notes if Resolved */}
                  {inc.resolution_note && (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                      <strong>Resolution Note:</strong> "{inc.resolution_note}"
                      <span className="block text-[10px] text-emerald-700 mt-1">
                        Resolved by Lab Authority on {formatDateTime(inc.resolved_at)}
                      </span>
                    </div>
                  )}

                  {/* Action buttons */}
                  {isOpen && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-3">
                      {inc.booking_id && (
                        <a
                          href={`/bookings/${inc.booking_id}`}
                          className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                        >
                          View Custody Receipt &rarr;
                        </a>
                      )}
                      <Button size="sm" variant="success" onClick={() => openResolveModal(inc)}>
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
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
            <Button variant="success" onClick={handleResolveSubmit} loading={submitting}>
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
