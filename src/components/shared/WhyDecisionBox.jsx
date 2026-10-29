import React from 'react';
import { HelpCircle, CheckCircle2, XCircle, Info, Scale } from 'lucide-react';

export function WhyDecisionBox({ booking }) {
  if (!booking) return null;

  const { decision_reason, rule_applied, eligibility_snapshot, waitlist_position, priority_score, priority_breakdown } =
    booking;

  return (
    <div className="bg-[#FFFCF5] border border-[#E8E2D2] rounded-2xl p-5 sm:p-6 space-y-4 shadow-soft-sm">
      <div className="flex items-center justify-between border-b border-[#F0ECE0] pb-3">
        <div className="flex items-center space-x-2">
          <HelpCircle className="w-4 h-4 text-[#126B4F]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#17231E]">
            Why this decision? (Explainable Allocation Guarantee)
          </h4>
        </div>
        {rule_applied && (
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#f0f7f4] text-[#126B4F] border border-[#126B4F]/25">
            Rule: {rule_applied}
          </span>
        )}
      </div>

      {/* Decision Plain-Language Statement */}
      <div>
        <p className="text-xs font-bold text-[#798C82] mb-1">Decision Summary:</p>
        <p className="text-sm font-semibold text-[#17231E] bg-white p-3.5 rounded-xl border border-[#E8E2D2]">
          "{decision_reason || 'Automated requirements and schedule evaluation in progress.'}"
        </p>
      </div>

      {/* Waitlist Position & Priority Formula */}
      {waitlist_position && (
        <div className="bg-[#faf6ec] border border-[#D6AD63]/40 rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#9e7330] flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              Transparent Waitlist Position: #{waitlist_position}
            </span>
            <span className="text-xs font-bold text-[#9e7330]">
              Priority Score: {priority_score || 75.0} / 100
            </span>
          </div>

          {priority_breakdown && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#9e7330] pt-2 border-t border-[#D6AD63]/30">
              <div>
                <span className="text-[#9e7330]/80 block">Quota / Usage:</span>
                <span className="font-bold">{priority_breakdown.hours_factor || 35} pts</span>
              </div>
              <div>
                <span className="text-[#9e7330]/80 block">Wait Time:</span>
                <span className="font-bold">{priority_breakdown.wait_factor || 15} pts</span>
              </div>
              <div>
                <span className="text-[#9e7330]/80 block">Reliability:</span>
                <span className="font-bold">{priority_breakdown.reliability_factor || 18} pts</span>
              </div>
              <div>
                <span className="text-[#9e7330]/80 block">Project Need:</span>
                <span className="font-bold">+{priority_breakdown.project_need_bonus || 0} pts</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Snapshot of Requirements */}
      {eligibility_snapshot && eligibility_snapshot.length > 0 && (
        <div>
          <p className="text-xs font-bold text-[#798C82] mb-2">Verified Requirements Snapshot:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {eligibility_snapshot.map((req, i) => (
              <div
                key={i}
                className={`flex items-start space-x-2 text-xs p-2.5 rounded-xl border ${
                  req.passed ? 'bg-[#ebf6f1] border-[#126B4F]/30 text-[#073D2D]' : 'bg-[#fdf2f1] border-[#c2413a]/30 text-[#c2413a]'
                }`}
              >
                {req.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-[#126B4F] shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-[#c2413a] shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold block">{req.requirement}</span>
                  <span className="text-[11px] opacity-85">{req.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default WhyDecisionBox;
