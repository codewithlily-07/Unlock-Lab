import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({
  icon: Icon = PackageOpen,
  title = 'No items found',
  description = 'There are currently no records matching this criteria.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="text-center py-14 px-6 rounded-3xl border border-dashed border-[#E8E2D2] bg-white shadow-soft-sm">
      <div className="w-14 h-14 rounded-2xl bg-[#f0f7f4] text-[#126B4F] flex items-center justify-center mx-auto mb-3.5 border border-[#126B4F]/20">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-[#17231E] mb-1 font-sans">{title}</h3>
      <p className="text-xs text-[#4A5B53] max-w-sm mx-auto mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="gold" size="sm" onClick={onAction} className="font-bold">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
