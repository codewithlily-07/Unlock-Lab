import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function GuidedTour() {
  const [isOpen, setIsOpen] = useState(true);
  const { profile } = useAuth();

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-40 bg-brand-600 hover:bg-brand-700 text-white px-3.5 py-2 rounded-full text-xs font-semibold shadow-lg flex items-center gap-2 border border-brand-500 transition-all"
      >
        <Compass className="w-4 h-4 animate-spin-slow" />
        <span>10-Step Lifecycle Guide</span>
      </button>
    );
  }

  const steps = [
    { num: 1, title: 'Owner Lists Resource', link: '/owner/resources/new', role: 'owner' },
    { num: 2, title: 'User Discovers & Checks Eligibility', link: '/explore', role: 'user' },
    { num: 3, title: 'Submit Booking Request', link: '/explore', role: 'user' },
    { num: 4, title: 'System Verifies Requirements', link: '/credentials', role: 'user' },
    { num: 5, title: 'Owner / Manager Reviews', link: '/owner/requests', role: 'owner' },
    { num: 6, title: 'Decision with Reason & Waitlist', link: '/my-bookings', role: 'user' },
    { num: 7, title: 'Check In & Record Initial Condition', link: '/my-bookings', role: 'user' },
    { num: 8, title: 'Return & Inspect Condition', link: '/my-bookings', role: 'user' },
    { num: 9, title: 'Dispute / Incident Resolution', link: '/owner/incidents', role: 'owner' },
    { num: 10, title: 'Auditable History & Handover Receipt', link: '/my-bookings', role: 'user' },
  ];

  return (
    <div className="bg-slate-900 text-slate-100 border-b border-slate-800 px-4 py-2 text-xs relative">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Compass className="w-4 h-4 text-brand-400 shrink-0" />
          <span className="font-bold text-white tracking-wide">
            Judge Guide: Complete 10-Step Resource Sharing Lifecycle
          </span>
          <span className="hidden sm:inline text-slate-400">| Active Persona: <strong className="text-brand-300">{profile?.full_name} ({profile?.role})</strong></span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 md:pb-0">
          {steps.slice(0, 5).map((step) => (
            <Link
              key={step.num}
              to={step.link}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 whitespace-nowrap transition-colors flex items-center gap-1"
            >
              <span className="w-4 h-4 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-bold">
                {step.num}
              </span>
              <span>{step.title}</span>
            </Link>
          ))}
          <Link
            to="/my-bookings"
            className="px-2 py-1 rounded bg-brand-600 hover:bg-brand-500 text-white font-medium whitespace-nowrap flex items-center gap-1"
          >
            <span>Steps 6-10 (Bookings)</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

