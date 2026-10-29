import React from 'react';
import { cn } from '../../lib/utils';

export function Badge({ children, variant = 'default', size = 'md', className = '' }) {
  const base = 'inline-flex items-center font-semibold rounded-full border transition-colors';

  const variants = {
    default: 'bg-[#F7F1E5] text-[#17231E] border-[#E8E2D2]',
    brand: 'bg-[#f0f7f4] text-[#073D2D] border-[#126B4F]/30',
    forest: 'bg-[#073D2D] text-[#FFFCF5] border-[#073D2D]',
    gold: 'bg-[#faf6ec] text-[#9e7330] border-[#D6AD63]/50',
    success: 'bg-[#ebf6f1] text-[#126B4F] border-[#126B4F]/30',
    warning: 'bg-[#fcf8ee] text-[#9e7330] border-[#D6AD63]/40',
    danger: 'bg-[#fdf2f1] text-[#c2413a] border-[#c2413a]/30',
    info: 'bg-[#eff8fa] text-[#22758f] border-[#22758f]/30',
    purple: 'bg-[#f7f0fa] text-[#6b3582] border-[#6b3582]/25',
    sage: 'bg-[#C7D9C4]/40 text-[#073D2D] border-[#C7D9C4]',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-xs px-3 py-1',
    lg: 'text-sm px-3.5 py-1.5',
  };

  return <span className={cn(base, variants[variant] || variants.default, sizes[size], className)}>{children}</span>;
}

export default Badge;
