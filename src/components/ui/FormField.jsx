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
        <label className="block text-xs font-bold text-[#17231E] tracking-wide">
          {label}
          {required && <span className="text-[#c2413a] ml-1">*</span>}
        </label>
      )}
      {children}
      {helperText && !error && <p className="text-xs text-[#4A5B53]">{helperText}</p>}
      {error && <p className="text-xs font-medium text-[#c2413a]">{error}</p>}
    </div>
  );
}

export function Input({ className = '', hasError = false, ...props }) {
  return (
    <input
      className={cn(
        'w-full px-4 py-2.5 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 bg-[#FFFFFF] text-[#17231E]',
        hasError
          ? 'border-[#c2413a]/50 focus:border-[#c2413a] focus:ring-[#c2413a]/20'
          : 'border-[#E8E2D2] focus:border-[#126B4F] focus:ring-[#126B4F]/15 focus:bg-[#FFFCF5]',
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
        'w-full px-4 py-2.5 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 bg-[#FFFFFF] text-[#17231E]',
        hasError
          ? 'border-[#c2413a]/50 focus:border-[#c2413a] focus:ring-[#c2413a]/20'
          : 'border-[#E8E2D2] focus:border-[#126B4F] focus:ring-[#126B4F]/15 focus:bg-[#FFFCF5]',
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
        'w-full px-4 py-2.5 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 bg-[#FFFFFF] text-[#17231E] resize-y',
        hasError
          ? 'border-[#c2413a]/50 focus:border-[#c2413a] focus:ring-[#c2413a]/20'
          : 'border-[#E8E2D2] focus:border-[#126B4F] focus:ring-[#126B4F]/15 focus:bg-[#FFFCF5]',
        className
      )}
      {...props}
    />
  );
}

export default FormField;
