import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Cpu, RefreshCw } from 'lucide-react';
import { api } from '../../lib/supabase';
import { useNotifications } from '../../context/NotificationContext';

export function Footer() {
  const { showToast } = useNotifications();

  function handleResetDemo() {
    if (window.confirm('Reset all demo data back to clean seed state?')) {
      api.resetDemoData();
      showToast('Demo data reset to clean factory state.', 'success');
      setTimeout(() => window.location.reload(), 600);
    }
  }

  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-white font-bold text-sm">
              <span className="w-6 h-6 rounded bg-brand-600 flex items-center justify-center text-xs">U</span>
              <span>UnlockLab</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Institutional Equipment &amp; Space Sharing Platform for Electronics and Communication Engineering labs.
            </p>
          </div>

          <div>
            <h4 className="text-slate-200 font-semibold mb-2 uppercase tracking-wider text-[11px]">Transparency &amp; Rules</h4>
            <ul className="space-y-1.5">
              <li>
                <Link to="/how-allocation-works" className="hover:text-white transition-colors">
                  How Fair Allocation Works
                </Link>
              </li>
              <li>
                <Link to="/credentials" className="hover:text-white transition-colors">
                  Prerequisites &amp; Safety Compliance
                </Link>
              </li>
              <li>
                <span className="text-slate-500">Append-Only Audit Logging</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-200 font-semibold mb-2 uppercase tracking-wider text-[11px]">Hackathon Disclosures</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              All demo identities and equipment data are fictional. Safety and penalty decisions require human review.
              Powered by React 18, Tailwind CSS, and Supabase Postgres.
            </p>
          </div>

          <div>
            <h4 className="text-slate-200 font-semibold mb-2 uppercase tracking-wider text-[11px]">Judge Controls</h4>
            <button
              onClick={handleResetDemo}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors text-[11px] font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5 text-brand-400" />
              <span>Reset Demo Seed Data</span>
            </button>
            <p className="text-[10px] text-slate-500 mt-2">
              Resets all 10 resources, pre-made bookings, and demo accounts to clean seed baseline.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-[11px]">
          <div>UnlockLab · 48-Hour Hackathon Implementation</div>
          <div className="mt-2 sm:mt-0">Tech Stack: React + Tailwind + Postgres RPC + RLS</div>
        </div>
      </div>
    </footer>
  );
}
