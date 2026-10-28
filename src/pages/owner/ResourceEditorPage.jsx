import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { RESOURCE_CATEGORIES } from '../../lib/constants';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FormField, Input, Select, Textarea } from '../../components/ui/FormField';
import { Cpu, Plus, Trash2, ArrowLeft, ShieldAlert } from 'lucide-react';

export function ResourceEditorPage() {
  const { id } = useParams();
  const { profile, isVerified } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const isEditing = Boolean(id);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('instrument');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [minMinutes, setMinMinutes] = useState(30);
  const [maxMinutes, setMaxMinutes] = useState(240);
  const [advanceDays, setAdvanceDays] = useState(14);
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [requiresDeposit, setRequiresDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState(0);
  const [supervisionRequired, setSupervisionRequired] = useState(false);
  const [safetyNotes, setSafetyNotes] = useState('');
  const [usageRules, setUsageRules] = useState(['Wear grounded ESD wrist strap']);
  const [newRule, setNewRule] = useState('');
  const [requirements, setRequirements] = useState([]);
  const [reqCert, setReqCert] = useState('ESD & High-Frequency Lab Safety Level 2');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      loadResource();
    }
  }, [id]);

  async function loadResource() {
    setLoading(true);
    const res = await api.getResource(id);
    if (res) {
      setName(res.name);
      setCategory(res.category);
      setDescription(res.description);
      setLocation(res.location);
      setPhotoUrl(res.photos?.[0] || '');
      setMinMinutes(res.min_booking_minutes);
      setMaxMinutes(res.max_booking_minutes);
      setAdvanceDays(res.advance_booking_days);
      setRequiresApproval(res.requires_approval);
      setRequiresDeposit(res.requires_deposit);
      setDepositAmount(res.deposit_amount);
      setSupervisionRequired(res.supervision_required);
      setSafetyNotes(res.safety_notes || '');
      setUsageRules(res.usage_rules || []);
      setRequirements(res.requirements || []);
    }
    setLoading(false);
  }

  function handleAddRule() {
    if (!newRule.trim()) return;
    setUsageRules([...usageRules, newRule.trim()]);
    setNewRule('');
  }

  function handleRemoveRule(idx) {
    setUsageRules(usageRules.filter((_, i) => i !== idx));
  }

  function handleAddRequirement() {
    if (requirements.some((r) => r.value === reqCert)) return;
    setRequirements([
      ...requirements,
      {
        type: 'training',
        key: 'training_cert',
        value: reqCert,
        description: reqCert,
      },
    ]);
  }

  function handleRemoveRequirement(idx) {
    setRequirements(requirements.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !location.trim()) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    if (!isVerified) {
      showToast('Unverified lab owners cannot publish equipment (Section 11G)', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.saveResource({
        id: id || undefined,
        owner_id: profile.id,
        name,
        category,
        description,
        location,
        photos: [photoUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'],
        min_booking_minutes: Number(minMinutes),
        max_booking_minutes: Number(maxMinutes),
        advance_booking_days: Number(advanceDays),
        requires_approval: requiresApproval,
        requires_deposit: requiresDeposit,
        deposit_amount: Number(depositAmount),
        supervision_required: supervisionRequired,
        safety_notes: safetyNotes,
        usage_rules: usageRules,
        requirements,
        status: 'active',
      });

      setLoading(false);
      showToast(isEditing ? 'Equipment updated successfully!' : 'Equipment created and active!', 'success');
      navigate('/owner/dashboard');
    } catch (err) {
      setLoading(false);
      showToast(err.message || 'Error saving equipment', 'error');
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/owner/dashboard')}
          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {isEditing ? 'Edit Lab Equipment' : 'List New Lab Equipment / Space'}
          </h1>
          <p className="text-xs text-slate-500">
            Define operating rules, safety prerequisites, and reservation limits.
          </p>
        </div>
      </div>

      {!isVerified && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Unverified Owner Warning (Section 11G):</strong> Your account has not yet been verified by the Department Administrator.
            Unverified owners cannot publish equipment to the public catalog. Switch to an Admin persona to approve your verification queue.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <h3 className="text-sm font-bold text-slate-900">General Information</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <FormField label="Equipment / Room Name" required>
              <Input
                required
                placeholder="e.g. Tektronix 4-Channel 1GHz Digital Oscilloscope"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Category" required>
                <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {RESOURCE_CATEGORIES.filter((c) => c.value !== 'all').map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Lab Location / Room Bench" required>
                <Input
                  required
                  placeholder="e.g. ECE Building, Room 202, Bench 4"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </FormField>
            </div>

            <FormField label="Detailed Description & Specifications" required>
              <Textarea
                required
                rows={3}
                placeholder="Bandwidth, channels, supported protocols, safety gear needed..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </FormField>

            <FormField label="Photo Image URL" helperText="Direct image URL for photo preview">
              <Input
                placeholder="https://images.unsplash.com/..."
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
              />
            </FormField>
          </CardBody>
        </Card>

        {/* Usage Limits & Governance */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-bold text-slate-900">Allocation Limits &amp; Governance</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="Min Duration (Mins)" required>
                <Input
                  type="number"
                  step="15"
                  value={minMinutes}
                  onChange={(e) => setMinMinutes(e.target.value)}
                />
              </FormField>

              <FormField label="Max Duration (Mins)" required>
                <Input
                  type="number"
                  step="30"
                  value={maxMinutes}
                  onChange={(e) => setMaxMinutes(e.target.value)}
                />
              </FormField>

              <FormField label="Advance Days Allowed" required>
                <Input
                  type="number"
                  value={advanceDays}
                  onChange={(e) => setAdvanceDays(e.target.value)}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requiresApproval}
                  onChange={(e) => setRequiresApproval(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
                <span>Requires Manager Approval</span>
              </label>

              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={supervisionRequired}
                  onChange={(e) => setSupervisionRequired(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
                <span>Supervision Required</span>
              </label>

              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requiresDeposit}
                  onChange={(e) => setRequiresDeposit(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
                <span>Requires Security Deposit</span>
              </label>
            </div>

            {requiresDeposit && (
              <FormField label="Deposit Amount (INR / Fictional)">
                <Input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </FormField>
            )}
          </CardBody>
        </Card>

        {/* Safety & Prerequisite Certifications */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-bold text-slate-900">Safety Rules &amp; Prerequisites</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <FormField label="Critical Safety Notes">
              <Input
                placeholder="e.g. Attenuator check mandatory before transmitting RF power..."
                value={safetyNotes}
                onChange={(e) => setSafetyNotes(e.target.value)}
              />
            </FormField>

            {/* Operating Rules */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Bench Operating Rules</label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="e.g. Do not adjust factory calibration..."
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                />
                <Button type="button" variant="secondary" onClick={handleAddRule}>
                  Add
                </Button>
              </div>
              <div className="space-y-1.5">
                {usageRules.map((rule, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded text-xs border border-slate-200">
                    <span>{rule}</span>
                    <button type="button" onClick={() => handleRemoveRule(idx)} className="text-slate-400 hover:text-rose-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Required Certifications */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-2">Required Safety Certifications</label>
              <div className="flex gap-2 mb-2">
                <Select value={reqCert} onChange={(e) => setReqCert(e.target.value)}>
                  <option value="ESD & High-Frequency Lab Safety Level 2">ESD &amp; High-Frequency Lab Safety Level 2</option>
                  <option value="Logic Analysis & FPGA Tools Certification">Logic Analysis &amp; FPGA Tools Certification</option>
                  <option value="SMD Soldering & Rework Certification">SMD Soldering &amp; Rework Certification</option>
                </Select>
                <Button type="button" variant="secondary" onClick={handleAddRequirement}>
                  Require
                </Button>
              </div>
              <div className="space-y-1.5">
                {requirements.map((req, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-blue-50/70 p-2 rounded text-xs border border-blue-200 text-blue-900">
                    <span className="font-medium">{req.description}</span>
                    <button type="button" onClick={() => handleRemoveRequirement(idx)} className="text-blue-400 hover:text-rose-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/owner/dashboard')}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} disabled={!isVerified}>
            {isEditing ? 'Save Changes' : 'Publish Equipment'}
          </Button>
        </div>
      </form>
    </div>
  );
}

