import React from 'react';
import { cn } from '../../lib/utils';

export function Badge({ children, variant = 'default', size = 'md', className = '' }) {
  const base = 'inline-flex items-center font-medium rounded-full border transition-colors';

  const variants = {
    default: 'bg-slate-100 text-slate-800 border-slate-200',
    brand: 'bg-brand-50 text-brand-700 border-brand-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return <span className={cn(base, variants[variant], sizes[size], className)}>{children}</span>;
}
