import React from 'react';
import { cn } from '../../lib/utils';

export function Table({ children, className = '' }) {
  return (
    <div className="w-full overflow-x-auto border border-slate-200 rounded-xl">
      <table className={cn('w-full text-left border-collapse text-xs', className)}>{children}</table>
    </div>
  );
}

export function TableHeader({ children }) {
  return <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">{children}</thead>;
}

export function TableBody({ children }) {
  return <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>;
}

export function TableRow({ children, className = '', onClick }) {
  return (
    <tr
      onClick={onClick}
      className={cn('hover:bg-slate-50/75 transition-colors', onClick && 'cursor-pointer', className)}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className = '' }) {
  return <th className={cn('px-4 py-3 text-slate-600 font-semibold tracking-wider uppercase text-[11px]', className)}>{children}</th>;
}

export function TableCell({ children, className = '' }) {
  return <td className={cn('px-4 py-3 text-slate-700', className)}>{children}</td>;
}
