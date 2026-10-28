import React from 'react';
import { HelpCircle, CheckCircle2, XCircle, Info, Scale } from 'lucide-react';

export function WhyDecisionBox({ booking }) {
  if (!booking) return null;

  const { decision_reason, rule_applied, eligibility_snapshot, waitlist_position, priority_score, priority_breakdown } =
    booking;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <div className="flex items-center space-x-2">
          <HelpCircle className="w-4 h-4 text-brand-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Why this decision? (Explainable Allocation)
          </h4>
        </div>
        {rule_applied && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
            Rule: {rule_applied}
          </span>
        )}
      </div>

      {/* Decision Plain-Language Statement */}
      <div>
        <p className="text-xs font-medium text-slate-500 mb-1">Decision Summary:</p>
        <p className="text-sm font-semibold text-slate-900 bg-white p-3 rounded-lg border border-slate-200">
          "{decision_reason || 'Automated requirements and schedule evaluation in progress.'}"
        </p>
      </div>

      {/* Waitlist Position & Priority Formula */}
      {waitlist_position && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              Transparent Waitlist Position: #{waitlist_position}
            </span>
            <span className="text-xs font-bold text-purple-800">
              Priority Score: {priority_score || 75.0} / 100
            </span>
          </div>

          {priority_breakdown && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-purple-800 pt-2 border-t border-purple-200/60">
              <div>
                <span className="text-purple-600 block">Quota / Usage:</span>
                <span className="font-semibold">{priority_breakdown.hours_factor || 35} pts</span>
              </div>
              <div>
                <span className="text-purple-600 block">Wait Time:</span>
                <span className="font-semibold">{priority_breakdown.wait_factor || 15} pts</span>
              </div>
              <div>
                <span className="text-purple-600 block">Reliability:</span>
                <span className="font-semibold">{priority_breakdown.reliability_factor || 18} pts</span>
              </div>
              <div>
                <span className="text-purple-600 block">Project Need:</span>
                <span className="font-semibold">+{priority_breakdown.project_need_bonus || 0} pts</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Snapshot of Requirements */}
      {eligibility_snapshot && eligibility_snapshot.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">Verified Requirements Snapshot:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {eligibility_snapshot.map((req, i) => (
              <div
                key={i}
                className={`flex items-start space-x-2 text-xs p-2 rounded-lg border ${
                  req.passed ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                {req.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-semibold block">{req.requirement}</span>
                  <span className="text-[11px] opacity-80">{req.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
