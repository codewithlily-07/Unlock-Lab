import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { api } from '../lib/supabase';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { FormField, Input, Select } from '../components/ui/FormField';
import { FileCheck, Upload, Shield, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { formatDate } from '../lib/utils';

export function CredentialsPage() {
  const { profile } = useAuth();
  const { showToast } = useNotifications();
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [certName, setCertName] = useState('ESD & High-Frequency Lab Safety Level 2');
  const [certType, setCertType] = useState('training');

  useEffect(() => {
    loadCreds();
  }, [profile?.id]);

  async function loadCreds() {
    if (!profile?.id) return;
    setLoading(true);
    const data = await api.getCredentials(profile.id);
    setCredentials(data);
    setLoading(false);
  }

  async function handleUpload(e) {
    e.preventDefault();
    await api.uploadCredential({
      user_id: profile.id,
      name: certName,
      type: certType,
      file_path: `certs/${certName.toLowerCase().replace(/\s+/g, '_')}.pdf`,
    });
    setIsModalOpen(false);
    showToast('Credential submitted! Lab manager will review it.', 'success');
    loadCreds();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Lab Safety Credentials</h1>
          <p className="text-xs text-slate-500 mt-1">
            Verified training certifications enable automatic instant booking for sensitive ECE instruments.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Upload className="w-4 h-4 mr-1.5" />
          <span>Upload Certificate / ID</span>
        </Button>
      </div>

      {/* Privacy Notice (Section 11H) */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-start space-x-3">
        <Shield className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-800">Privacy &amp; Data Security Notice:</strong> UnlockLab adheres to strict data minimization.
          Submitted certificates and ID documents are encrypted in private storage buckets, never published publicly,
          and reviewed solely by authorized departmental lab technicians to confirm safety qualifications.
        </div>
      </div>

      {/* Credentials List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading credentials...</div>
        ) : credentials.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <FileCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-700">No Credentials on Record</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
                Upload your laboratory safety certifications to qualify for high-speed oscilloscopes, spectrum analyzers, and soldering benches.
              </p>
              <Button size="sm" onClick={() => setIsModalOpen(true)}>
                Upload Certification
              </Button>
            </CardBody>
          </Card>
        ) : (
          credentials.map((cred) => {
            const isVerified = cred.status === 'verified';
            const isPending = cred.status === 'pending';

            return (
              <Card key={cred.id}>
                <CardBody className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start space-x-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isVerified
                          ? 'bg-emerald-100 text-emerald-700'
                          : isPending
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      <FileCheck className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-slate-900">{cred.name}</h4>
                        <Badge
                          variant={isVerified ? 'success' : isPending ? 'warning' : 'danger'}
                          size="sm"
                        >
                          {isVerified ? 'Verified' : isPending ? 'Pending Review' : 'Rejected'}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-500 mt-1">
                        Category: <span className="capitalize font-medium text-slate-700">{cred.type}</span>
                        {cred.reviewed_at && ` · Verified on ${formatDate(cred.reviewed_at)}`}
                      </p>

                      {cred.review_note && (
                        <p className="text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-200 mt-2 inline-block">
                          Reviewer note: "{cred.review_note}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">File: {cred.file_path}</span>
                  </div>
                </CardBody>
              </Card>
            );
          })
        )}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Submit Qualification Credential"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload}>Submit for Verification</Button>
          </>
        }
      >
        <form onSubmit={handleUpload} className="space-y-4 text-left">
          <FormField label="Credential Category" required>
            <Select value={certType} onChange={(e) => setCertType(e.target.value)}>
              <option value="training">Lab Safety Training Certificate</option>
              <option value="membership">Institutional Affiliation / ID</option>
              <option value="id_document">Safety Agreement Waiver</option>
            </Select>
          </FormField>

          <FormField label="Certification Name" required>
            <Select value={certName} onChange={(e) => setCertName(e.target.value)}>
              <option value="ESD & High-Frequency Lab Safety Level 2">
                ESD &amp; High-Frequency Lab Safety Level 2
              </option>
              <option value="Logic Analysis & FPGA Tools Certification">
                Logic Analysis &amp; FPGA Tools Certification
              </option>
              <option value="SMD Soldering & Rework Certification">
                SMD Soldering &amp; Rework Certification
              </option>
              <option value="Basic Electrical Safety">Basic Electrical Safety</option>
            </Select>
          </FormField>

          <FormField label="Certificate File (PDF or Image)" helperText="Mock file will be securely simulated">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-brand-500 cursor-pointer transition-colors">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-600 font-medium">Click to select certificate file (PDF, PNG, JPG)</p>
              <p className="text-[10px] text-slate-400 mt-1">Maximum file size: 5 MB</p>
            </div>
          </FormField>
        </form>
      </Modal>
    </div>
  );
}

