import React, { useState } from 'react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FormField, Input } from '../../components/ui/FormField';
import { useNotifications } from '../../context/NotificationContext';
import { Scale, ShieldAlert, Check, RefreshCw, Sliders } from 'lucide-react';

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
      <div className="pb-2 border-b border-[#073D2D]/10">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#126B4F] flex items-center gap-1.5 mb-1">
          <Scale className="w-3.5 h-3.5 text-[#D6AD63]" /> Resource Equity
        </span>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#17231E] tracking-tight">Fair-Use Governance &amp; Quotas</h1>
        <p className="text-xs text-[#17231E]/70 mt-1">
          Configure anti-monopolization limits and automated cooldown parameters across all shared equipment.
        </p>
      </div>

      <Card className="border-[#073D2D]/10 bg-white/80">
        <CardHeader className="border-b border-[#073D2D]/10 pb-4">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-[#126B4F]" />
            <h3 className="text-base font-serif font-bold text-[#17231E]">Universal Borrower Quota Limits</h3>
          </div>
        </CardHeader>

        <CardBody className="p-6">
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                  className="border-[#073D2D]/15 focus:border-[#126B4F]"
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
                  className="border-[#073D2D]/15 focus:border-[#126B4F]"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3 border-t border-[#073D2D]/10">
              <FormField
                label="Max Pending Requests Queue"
                helperText="Limits concurrent unreviewed requests per borrower"
                required
              >
                <Input
                  type="number"
                  value={maxPending}
                  onChange={(e) => setMaxPending(Number(e.target.value))}
                  className="border-[#073D2D]/15 focus:border-[#126B4F]"
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
                  className="border-[#073D2D]/15 focus:border-[#126B4F]"
                />
              </FormField>
            </div>

            <div className="flex justify-end pt-3">
              <Button type="submit" loading={saving} className="bg-[#073D2D] hover:bg-[#126B4F] text-[#F7F1E5]">
                <Check className="w-4 h-4 mr-1.5 text-[#D6AD63]" />
                <span>Save Fair-Use Configuration</span>
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
