import React from 'react';
import { cn } from '../../lib/utils';

export function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  onClick,
  ...props
}) {
  const base =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#126B4F] disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    primary:
      'bg-[#073D2D] hover:bg-[#126B4F] text-[#FFFCF5] shadow-md shadow-[#073D2D]/15 border border-[#126B4F]/40 btn-shimmer',
    secondary:
      'bg-[#FFFCF5] hover:bg-[#F7F1E5] text-[#17231E] border border-[#E8E2D2] shadow-soft-sm hover:border-[#D6AD63]/50',
    gold:
      'bg-[#D6AD63] hover:bg-[#be9042] text-[#073D2D] font-bold shadow-md shadow-[#D6AD63]/20 border border-[#D6AD63] btn-shimmer',
    outline:
      'bg-transparent hover:bg-[#073D2D]/5 text-[#073D2D] border border-[#073D2D]/30',
    danger:
      'bg-[#c2413a] hover:bg-[#a5332d] text-white shadow-soft-sm border border-transparent',
    success:
      'bg-[#126B4F] hover:bg-[#0d5740] text-white shadow-soft-sm border border-transparent',
    ghost:
      'bg-transparent hover:bg-[#F7F1E5] text-[#17231E] border border-transparent',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {children}
    </button>
  );
}

export default Button;
