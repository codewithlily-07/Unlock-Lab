import React, { useState } from 'react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FormField, Input } from '../../components/ui/FormField';
import { useNotifications } from '../../context/NotificationContext';
import { Scale, ShieldAlert, Check, RefreshCw } from 'lucide-react';

export function FairUseSettingsPage() {
  const { showToast } = useNotifications();
  const [maxHours, setMaxHours] = useState(6.0);
  const [maxActive, setMaxActive] = useState(3);
  const [maxPending, setMaxPending] = useState(5);
  const [cooldownHours, setCooldownHours] = useState(48);
  const [saving, setSaving] = useState(false);

  function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast('Departmental fair-use allocation settings updated!', 'success');
    }, 400);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fair-Use Governance &amp; Quotas</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure anti-monopolization limits and automated cooldown parameters across all shared equipment.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-brand-600" />
            <h3 className="text-base font-bold text-slate-900">Universal Borrower Quota Limits</h3>
          </div>
        </CardHeader>

        <CardBody>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Max Weekly Hours per User"
                helperText="Rolling 7-day limit on reserved bench hours"
                required
              >
                <Input
                  type="number"
                  step="0.5"
                  value={maxHours}
                  onChange={(e) => setMaxHours(Number(e.target.value))}
                />
              </FormField>

              <FormField
                label="Max Active Concurrent Bookings"
                helperText="Prevents reserving multiple primary instruments simultaneously"
                required
              >
                <Input
                  type="number"
                  value={maxActive}
                  onChange={(e) => setMaxActive(Number(e.target.value))}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <FormField
                label="Max Pending Requests Queue"
                helperText="Limits concurrent unreviewed requests per borrower"
                required
              >
                <Input
                  type="number"
                  value={maxPending}
                  onChange={(e) => setMaxPending(Number(e.target.value))}
                />
              </FormField>

              <FormField
                label="Late Return Cooldown (Hours)"
                helperText="Temporary reservation cooldown after an overdue return"
                required
              >
                <Input
                  type="number"
                  value={cooldownHours}
                  onChange={(e) => setCooldownHours(Number(e.target.value))}
                />
              </FormField>
            </div>

            <div className="flex justify-end pt-3">
              <Button type="submit" loading={saving}>
                <Check className="w-4 h-4 mr-1.5" />
                <span>Save Fair-Use Configuration</span>
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Anti-Monopolization Automated Flags (Section 7) */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900">Anti-Monopolization System Flags</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            FLAG ONLY — Flagged accounts notify department lab staff; a human administrator always reviews penalties.
          </p>
        </CardHeader>

        <CardBody className="divide-y divide-slate-100 text-xs">
          <div className="py-3 flex items-start justify-between gap-4">
            <div>
              <span className="font-bold text-slate-900 block">Rohan Verma (M.Tech Scholar)</span>
              <span className="text-amber-700 font-medium">Flag: 3 consecutive reservations on Tektronix Oscilloscope</span>
              <p className="text-[11px] text-slate-400 mt-0.5">Automated detection: 5.5 of 6.0 weekly hours booked.</p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-amber-100 text-amber-800">
              Under Review
            </span>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
