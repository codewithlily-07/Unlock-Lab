import React from 'react';
import { cn } from '../../lib/utils';

export function FormField({
  label,
  error,
  helperText,
  required = false,
  className = '',
  children,
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 tracking-wide">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {helperText && !error && <p className="text-xs text-slate-500">{helperText}</p>}
      {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}

export function Input({ className = '', hasError = false, ...props }) {
  return (
    <input
      className={cn(
        'w-full px-3.5 py-2 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 bg-white',
        hasError
          ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
          : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100',
        className
      )}
      {...props}
    />
  );
}

export function Select({ className = '', hasError = false, children, ...props }) {
  return (
    <select
      className={cn(
        'w-full px-3.5 py-2 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 bg-white',
        hasError
          ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
          : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ className = '', hasError = false, rows = 3, ...props }) {
  return (
    <textarea
      rows={rows}
      className={cn(
        'w-full px-3.5 py-2 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 bg-white resize-y',
        hasError
          ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
          : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100',
        className
      )}
      {...props}
    />
  );
}
