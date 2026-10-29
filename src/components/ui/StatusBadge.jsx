import React from 'react';
import { STATUS_CONFIG } from '../../lib/constants';
import { cn } from '../../lib/utils';

export function StatusBadge({ status, className = '' }) {
  const conf = STATUS_CONFIG[status] || {
    label: status || 'Unknown',
    color: 'bg-[#F7F1E5] text-[#17231E] border-[#E8E2D2]',
  };

  const isActive = ['checked_out', 'approved'].includes(status);
  const isWarning = ['pending_review', 'waitlisted', 'requested'].includes(status);
  const isDanger = ['overdue', 'disputed', 'eligibility_failed'].includes(status);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-200',
        conf.color,
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        {isActive && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#126B4F] opacity-75" />
        )}
        {isDanger && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c2413a] opacity-75" />
        )}
        <span
          className={cn(
            'relative inline-flex rounded-full h-2 w-2',
            isActive ? 'bg-[#126B4F]' : isDanger ? 'bg-[#c2413a]' : isWarning ? 'bg-[#D6AD63]' : 'bg-[#798C82]'
          )}
        />
      </span>
      {conf.label}
    </span>
  );
}

export default StatusBadge;
