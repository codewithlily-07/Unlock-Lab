import React from 'react';
import { cn } from '../../lib/utils';

export function Card({ children, className = '', hover = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all',
        hover && 'hover:shadow-md hover:border-slate-300 cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={cn('px-6 py-5 border-b border-slate-100', className)}>{children}</div>;
}

export function CardBody({ children, className = '' }) {
  return <div className={cn('p-6', className)}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={cn('px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between', className)}>
      {children}
    </div>
  );
}
