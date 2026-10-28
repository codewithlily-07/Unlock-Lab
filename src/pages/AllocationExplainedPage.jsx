import React from 'react';
import { Scale, Clock, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function AllocationExplainedPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 py-4">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-200 mb-3">
          <Scale className="w-3.5 h-3.5" />
          <span>Fair Allocation &amp; Access Transparency Policy</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          How Resource Allocation Works in UnlockLab
        </h1>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          UnlockLab prevents equipment monopolization, nepotism, and idle hoards through transparent,
          auditable rules. Here is the mathematical formula and policy structure used for all decisions.
        </p>
      </div>

      {/* 1. Transparent Priority Score Formula */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs flex items-center justify-center font-bold">1</span>
          The Waitlist Priority Formula (Max 100 Points)
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          When multiple users request overlapping slots on the same resource, requests are ranked by a published
          priority algorithm stored directly on the booking:
        </p>

        <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto">
          Priority Score = (Fewer Hours Used in Last 30 Days × 40%) + (Time Waiting FIFO × 30%) + (Reliability Score × 20%) + (Academic Capstone Bonus × 10%)
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <h4 className="text-xs font-bold text-slate-900 mb-1">Hours Used Factor (40% Weight)</h4>
            <p className="text-xs text-slate-600">
              Users who have used fewer hours in the preceding 30 days receive higher priority, ensuring fair access for infrequent users over heavy hoarders.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <h4 className="text-xs font-bold text-slate-900 mb-1">Waiting Time / FIFO (30% Weight)</h4>
            <p className="text-xs text-slate-600">
              Acts as a transparent tie-breaker: the earlier a user submits their reservation, the higher their position on the waitlist.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <h4 className="text-xs font-bold text-slate-900 mb-1">Reliability Score (20% Weight)</h4>
            <p className="text-xs text-slate-600">
              Based on on-time returns and clean condition handovers. Provides a slight informational advantage but <em>never</em> automatically blocks anyone.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <h4 className="text-xs font-bold text-slate-900 mb-1">Academic Milestone Need (10% Bonus)</h4>
            <p className="text-xs text-slate-600">
              Students declaring an active capstone, thesis evaluation, or conference submission receive an academic milestone boost.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Usage Quotas & Limits */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">2</span>
          Universal Fair-Use Quotas
        </h2>

        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-3 flex justify-between items-center">
            <div>
              <span className="font-bold text-slate-900 block">Weekly Cap per Borrower:</span>
              <span className="text-slate-500">Maximum hours of high-demand lab benches reserved per rolling 7 days.</span>
            </div>
            <span className="font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-md">6.0 Hours</span>
          </div>

          <div className="py-3 flex justify-between items-center">
            <div>
              <span className="font-bold text-slate-900 block">Max Concurrent Active Bookings:</span>
              <span className="text-slate-500">Prevents booking multiple expensive instruments simultaneously.</span>
            </div>
            <span className="font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-md">3 Active Loans</span>
          </div>

          <div className="py-3 flex justify-between items-center">
            <div>
              <span className="font-bold text-slate-900 block">Late Return Cooldown Period:</span>
              <span className="text-slate-500">Grace period after an unexcused late return before new reservations can be scheduled.</span>
            </div>
            <span className="font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-md">48 Hours</span>
          </div>
        </div>
      </section>

      {/* 3. Human Oversight & Explainability */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-bold">3</span>
          Human in the Loop &amp; "Why this decision?" Guarantee
        </h2>

        <p className="text-xs text-slate-600 leading-relaxed">
          Per hackathon rules, important access, safety, and penalty decisions <strong>never rely solely on an algorithm</strong>.
          Every rejection or waitlist decision is accompanied by a plain-language explanation written or confirmed by a designated lab manager,
          viewable in the transparent <em>"Why this decision?"</em> breakdown.
        </p>

        <div className="pt-4 flex justify-end">
          <Link to="/explore">
            <Button size="md">
              <span>Browse Equipment Catalog</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
