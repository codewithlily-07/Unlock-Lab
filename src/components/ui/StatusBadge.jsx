import React from 'react';
import { STATUS_CONFIG } from '../../lib/constants';
import { cn } from '../../lib/utils';

export function StatusBadge({ status, className = '' }) {
  const conf = STATUS_CONFIG[status] || {
    label: status || 'Unknown',
    color: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border transition-all',
        conf.color,
        className
      )}
    >
      {conf.label}
    </span>
  );
}
