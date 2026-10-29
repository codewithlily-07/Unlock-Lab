import React from 'react';
import { cn } from '../../lib/utils';

export function Table({ children, className = '' }) {
  return (
    <div className="w-full overflow-x-auto border border-[#E8E2D2] rounded-2xl bg-white shadow-soft-sm">
      <table className={cn('w-full text-left border-collapse text-xs', className)}>{children}</table>
    </div>
  );
}

export function TableHeader({ children }) {
  return <thead className="bg-[#FFFCF5] border-b border-[#E8E2D2] text-[#4A5B53] font-bold">{children}</thead>;
}

export function TableBody({ children }) {
  return <tbody className="divide-y divide-[#F0ECE0] bg-white">{children}</tbody>;
}

export function TableRow({ children, className = '', onClick }) {
  return (
    <tr
      onClick={onClick}
      className={cn('hover:bg-[#F7F1E5]/75 transition-colors', onClick && 'cursor-pointer', className)}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className = '' }) {
  return <th className={cn('px-4 py-3.5 text-[#4A5B53] font-bold tracking-wider uppercase text-[11px]', className)}>{children}</th>;
}

export function TableCell({ children, className = '' }) {
  return <td className={cn('px-4 py-3.5 text-[#17231E]', className)}>{children}</td>;
}

export default Table;
