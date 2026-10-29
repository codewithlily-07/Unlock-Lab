import React from 'react';
import { formatDateTime } from '../../lib/utils';
import { ShieldCheck, Clock, UserCheck, AlertTriangle, ArrowRight } from 'lucide-react';

export function Timeline({ events = [] }) {
  if (events.length === 0) {
    return <p className="text-xs text-[#798C82] py-4">No activity logged yet.</p>;
  }

  return (
    <div className="relative border-l border-[#E8E2D2] ml-3.5 space-y-6 py-2">
      {events.map((evt, idx) => {
        let Icon = Clock;
        let colorClass = 'bg-[#F7F1E5] text-[#4A5B53] border-[#E8E2D2]';

        if (evt.action.includes('APPROVED')) {
          Icon = ShieldCheck;
          colorClass = 'bg-[#ebf6f1] text-[#126B4F] border-[#126B4F]/30';
        } else if (evt.action.includes('CHECKED_OUT')) {
          Icon = UserCheck;
          colorClass = 'bg-[#f0f7f4] text-[#073D2D] border-[#126B4F]/30';
        } else if (evt.action.includes('INCIDENT') || evt.action.includes('DISPUTED')) {
          Icon = AlertTriangle;
          colorClass = 'bg-[#fdf2f1] text-[#c2413a] border-[#c2413a]/30';
        } else if (evt.action.includes('PROMOTED')) {
          Icon = ArrowRight;
          colorClass = 'bg-[#faf6ec] text-[#9e7330] border-[#D6AD63]/40';
        }

        return (
          <div key={evt.id || idx} className="relative pl-6">
            {/* Timeline node */}
            <div
              className={`absolute -left-3.5 top-0.5 w-7 h-7 rounded-full border flex items-center justify-center ${colorClass} shadow-soft-sm`}
            >
              <Icon className="w-3.5 h-3.5" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-[#17231E] tracking-wide">
                  {evt.action.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] text-[#798C82]">
                  {formatDateTime(evt.created_at)}
                </span>
              </div>

              <div className="text-xs text-[#4A5B53] mt-0.5">
                Role: <span className="font-semibold text-[#17231E] capitalize">{evt.actor_role}</span>
              </div>

              {evt.details && Object.keys(evt.details).length > 0 && (
                <div className="mt-1.5 text-xs bg-[#FFFCF5] border border-[#E8E2D2] rounded-xl p-2.5 text-[#17231E]">
                  {evt.details.reason && (
                    <p className="font-medium text-[#126B4F]">"{evt.details.reason}"</p>
                  )}
                  {evt.details.condition && (
                    <p className="text-[11px] text-[#4A5B53]">Condition: {evt.details.condition}</p>
                  )}
                  {evt.details.status && (
                    <p className="text-[11px] text-[#798C82]">Status: {evt.details.status}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Timeline;
