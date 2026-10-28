import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
              U
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">UnlockLab</span>
              <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Phase 2 Complete
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-slate-500">ECE Equipment Sharing Platform</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-10 w-full">
        {/* Welcome Hero Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Welcome to UnlockLab Dev Environment
              </h1>
              <p className="text-slate-600 max-w-2xl text-sm leading-relaxed">
                The database layer, RLS security policies, tamper-proof Postgres RPC functions,
                and comprehensive test suites (Phase 1 &amp; Phase 2) are built, tested, and committed.
              </p>
            </div>
            <div className="hidden sm:flex flex-col items-end text-xs text-slate-400">
              <span>Port: 3000</span>
              <span>React 18 + Vite + Tailwind</span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200/60">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Database &amp; Schema
              </span>
              <div className="text-lg font-bold text-emerald-600 flex items-center space-x-1">
                <span>✓ 15 Tables Ready</span>
              </div>
              <span className="text-xs text-slate-500 mt-1 block">Full RLS &amp; Exclusion constraints</span>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200/60">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                State Machine &amp; RPC
              </span>
              <div className="text-lg font-bold text-emerald-600 flex items-center space-x-1">
                <span>✓ 10 Functions</span>
              </div>
              <span className="text-xs text-slate-500 mt-1 block">Tamper-proof atomic transactions</span>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200/60">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Automated Tests
              </span>
              <div className="text-lg font-bold text-emerald-600 flex items-center space-x-1">
                <span>✓ 24 Assertions Passed</span>
              </div>
              <span className="text-xs text-slate-500 mt-1 block">Attacks &amp; Concurrency verified</span>
            </div>
          </div>
        </div>

        {/* Quick Start & Next Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-3 flex items-center">
              <span className="w-2 h-2 rounded-full bg-brand-500 mr-2"></span>
              Terminal Commands
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Start Local Development Server:</p>
                <code className="block bg-slate-900 text-slate-100 px-3 py-2 rounded text-xs font-mono">
                  npm run dev
                </code>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Run Database Tests:</p>
                <code className="block bg-slate-900 text-slate-100 px-3 py-2 rounded text-xs font-mono">
                  npm run test:db
                </code>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-3 flex items-center">
              <span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span>
              Current Stop Point: Review Required
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Per specification instructions, we paused after <strong>Phase 2</strong> to wait for your review.
              Reply with <strong>continue</strong> in the chat to begin:
            </p>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
              <li><strong>Phase 3:</strong> React Router, Reusable Components, and Auth Context</li>
              <li><strong>Phase 4:</strong> Authentication, Profiles, and Admin Verification</li>
              <li><strong>Phase 5:</strong> Equipment Catalog, Search, and Real-time Eligibility</li>
              <li><strong>Phase 6:</strong> Booking Request and Owner Review Queue</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        UnlockLab Hackathon Project · Phase 2 Standby
      </footer>
    </div>
  );
}
