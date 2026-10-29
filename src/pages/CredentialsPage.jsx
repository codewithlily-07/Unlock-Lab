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
    setCredentials(data || []);
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17231E] tracking-tight font-sans">
            My Lab Safety Credentials
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5B53] mt-1">
            Verified training certifications enable automatic instant booking for sensitive ECE instruments.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="primary" className="font-bold">
          <Upload className="w-4 h-4 mr-1.5" />
          <span>Upload Certificate / ID</span>
        </Button>
      </div>

      {/* Privacy Notice */}
      <div className="p-4 rounded-2xl bg-[#FFFCF5] border border-[#E8E2D2] text-xs text-[#4A5B53] flex items-start space-x-3 shadow-soft-sm">
        <Shield className="w-5 h-5 text-[#126B4F] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-[#17231E]">Privacy &amp; Institutional Governance:</strong> UnlockLab adheres to strict data minimization.
          Submitted certificates and ID credentials are encrypted in institutional storage buckets, never published publicly,
          and reviewed solely by authorized departmental laboratory technicians to confirm prerequisite qualifications.
        </div>
      </div>

      {/* Credentials List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="p-16 text-center text-xs font-semibold text-[#798C82]">
            <div className="w-8 h-8 rounded-full border-2 border-[#126B4F] border-t-transparent animate-spin mx-auto mb-3" />
            <span>Loading credentials...</span>
          </div>
        ) : credentials.length === 0 ? (
          <Card>
            <CardBody className="text-center py-16 space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#f0f7f4] text-[#126B4F] flex items-center justify-center mx-auto">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#17231E]">No Credentials on Record</h3>
              <p className="text-xs text-[#4A5B53] max-w-sm mx-auto">
                Upload your laboratory safety certifications to qualify for high-speed oscilloscopes, spectrum analyzers, and soldering benches.
              </p>
              <div className="pt-2">
                <Button size="sm" variant="gold" onClick={() => setIsModalOpen(true)} className="font-bold">
                  Upload Certification
                </Button>
              </div>
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
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                        isVerified
                          ? 'bg-[#ebf6f1] text-[#126B4F] border-[#126B4F]/30'
                          : isPending
                          ? 'bg-[#faf6ec] text-[#9e7330] border-[#D6AD63]/40'
                          : 'bg-[#fdf2f1] text-[#c2413a] border-[#c2413a]/30'
                      }`}
                    >
                      <FileCheck className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-[#17231E]">{cred.name}</h4>
                        <Badge
                          variant={isVerified ? 'success' : isPending ? 'warning' : 'danger'}
                          size="sm"
                        >
                          {isVerified ? 'Verified' : isPending ? 'Pending Review' : 'Rejected'}
                        </Badge>
                      </div>

                      <p className="text-xs text-[#4A5B53] mt-1">
                        Category: <span className="capitalize font-medium text-[#17231E]">{cred.type}</span>
                        {cred.reviewed_at && ` · Verified on ${formatDate(cred.reviewed_at)}`}
                      </p>

                      {cred.review_note && (
                        <p className="text-xs text-[#126B4F] bg-[#f0f7f4] px-3 py-1 rounded-lg border border-[#126B4F]/25 mt-2 inline-block font-medium">
                          Reviewer note: "{cred.review_note}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-[#798C82] font-mono block">File: {cred.file_path}</span>
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
            <Button onClick={handleUpload} variant="primary" className="font-bold">
              Submit for Verification
            </Button>
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
            <div className="border-2 border-dashed border-[#D6C4A4] rounded-2xl p-6 text-center hover:border-[#126B4F] cursor-pointer transition-colors bg-[#FFFCF5]">
              <Upload className="w-8 h-8 text-[#798C82] mx-auto mb-2" />
              <p className="text-xs text-[#17231E] font-bold">Click to select certificate file (PDF, PNG, JPG)</p>
              <p className="text-[10px] text-[#798C82] mt-1">Maximum file size: 5 MB</p>
            </div>
          </FormField>
        </form>
      </Modal>
    </div>
  );
}

export default CredentialsPage;
