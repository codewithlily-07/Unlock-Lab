import React from 'react';
import { cn } from '../../lib/utils';

export function Card({ children, className = '', hover = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-[#FFFFFF] rounded-2xl border border-[#E8E2D2] shadow-soft-sm overflow-hidden transition-all duration-300',
        hover && 'hover:shadow-soft-lg hover:border-[#D6AD63]/50 hover:-translate-y-1 cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={cn('px-6 py-5 border-b border-[#F0ECE0]', className)}>{children}</div>;
}

export function CardBody({ children, className = '' }) {
  return <div className={cn('p-6', className)}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={cn('px-6 py-4 bg-[#FFFCF5] border-t border-[#F0ECE0] flex items-center justify-between', className)}>
      {children}
    </div>
  );
}

export default Card;
