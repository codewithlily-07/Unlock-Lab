import React from 'react';
import { formatDateTime } from '../../lib/utils';
import { ShieldCheck, Clock, UserCheck, AlertTriangle, ArrowRight } from 'lucide-react';

export function Timeline({ events = [] }) {
  if (events.length === 0) {
    return <p className="text-xs text-slate-400 py-3">No activity logged yet.</p>;
  }

  return (
    <div className="relative border-l border-slate-200 ml-3 space-y-6 py-2">
      {events.map((evt, idx) => {
        let Icon = Clock;
        let colorClass = 'bg-slate-100 text-slate-600 border-slate-300';

        if (evt.action.includes('APPROVED')) {
          Icon = ShieldCheck;
          colorClass = 'bg-emerald-100 text-emerald-700 border-emerald-300';
        } else if (evt.action.includes('CHECKED_OUT')) {
          Icon = UserCheck;
          colorClass = 'bg-blue-100 text-blue-700 border-blue-300';
        } else if (evt.action.includes('INCIDENT') || evt.action.includes('DISPUTED')) {
          Icon = AlertTriangle;
          colorClass = 'bg-rose-100 text-rose-700 border-rose-300';
        } else if (evt.action.includes('PROMOTED')) {
          Icon = ArrowRight;
          colorClass = 'bg-purple-100 text-purple-700 border-purple-300';
        }

        return (
          <div key={evt.id || idx} className="relative pl-6">
            {/* Timeline node */}
            <div
              className={`absolute -left-3 top-0.5 w-6 h-6 rounded-full border flex items-center justify-center ${colorClass}`}
            >
              <Icon className="w-3.5 h-3.5" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-800 tracking-wide">
                  {evt.action.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] text-slate-400">
                  {formatDateTime(evt.created_at)}
                </span>
              </div>

              <div className="text-xs text-slate-600 mt-0.5">
                Role: <span className="font-semibold text-slate-700 capitalize">{evt.actor_role}</span>
              </div>

              {evt.details && Object.keys(evt.details).length > 0 && (
                <div className="mt-1 text-xs bg-slate-50 border border-slate-200 rounded p-2 text-slate-700">
                  {evt.details.reason && (
                    <p className="font-medium text-slate-800">"{evt.details.reason}"</p>
                  )}
                  {evt.details.condition && (
                    <p className="text-[11px] text-slate-600">Condition: {evt.details.condition}</p>
                  )}
                  {evt.details.status && (
                    <p className="text-[11px] text-slate-500">Status: {evt.details.status}</p>
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
