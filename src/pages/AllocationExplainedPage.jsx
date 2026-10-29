import React from 'react';
import { Scale, Clock, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function AllocationExplainedPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 py-4">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#f0f7f4] text-[#126B4F] text-xs font-bold border border-[#126B4F]/30 mb-3">
          <Scale className="w-3.5 h-3.5 text-[#D6AD63]" />
          <span>Fair Allocation &amp; Access Transparency Policy</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17231E] tracking-tight font-sans">
          How Resource Allocation Works in UnlockLab
        </h1>
        <p className="text-sm text-[#4A5B53] mt-2 leading-relaxed">
          UnlockLab prevents equipment monopolization, nepotism, and idle hoards through transparent,
          auditable rules. Here is the mathematical formula and policy structure used for all decisions.
        </p>
      </div>

      {/* 1. Transparent Priority Score Formula */}
      <section className="bg-white rounded-3xl border border-[#E8E2D2] p-6 sm:p-8 shadow-soft-sm space-y-5">
        <h2 className="text-lg font-bold text-[#17231E] flex items-center gap-2.5 font-sans">
          <span className="w-7 h-7 rounded-full bg-[#f0f7f4] text-[#126B4F] text-xs flex items-center justify-center font-black border border-[#126B4F]/30">
            1
          </span>
          The Waitlist Priority Formula (Max 100 Points)
        </h2>
        <p className="text-xs text-[#4A5B53] leading-relaxed">
          When multiple users request overlapping slots on the same resource, requests are ranked by a published
          priority algorithm stored directly on the booking:
        </p>

        <div className="bg-[#073D2D] text-[#FFFCF5] p-5 rounded-2xl font-mono text-xs overflow-x-auto border border-[#126B4F]/40 shadow-inner">
          Priority Score = (Fewer Hours Used in Last 30 Days × 40%) + (Time Waiting FIFO × 30%) + (Reliability Score × 20%) + (Academic Capstone Bonus × 10%)
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-[#FFFCF5] border border-[#E8E2D2]">
            <h4 className="text-xs font-bold text-[#17231E] mb-1">Hours Used Factor (40% Weight)</h4>
            <p className="text-xs text-[#4A5B53] leading-relaxed">
              Users who have used fewer hours in the preceding 30 days receive higher priority, ensuring fair access for infrequent users over heavy hoarders.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFFCF5] border border-[#E8E2D2]">
            <h4 className="text-xs font-bold text-[#17231E] mb-1">Waiting Time / FIFO (30% Weight)</h4>
            <p className="text-xs text-[#4A5B53] leading-relaxed">
              Acts as a transparent tie-breaker: the earlier a user submits their reservation, the higher their position on the waitlist.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFFCF5] border border-[#E8E2D2]">
            <h4 className="text-xs font-bold text-[#17231E] mb-1">Reliability Score (20% Weight)</h4>
            <p className="text-xs text-[#4A5B53] leading-relaxed">
              Based on on-time returns and clean condition handovers. Provides a slight informational advantage but <em>never</em> automatically blocks anyone.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFFCF5] border border-[#E8E2D2]">
            <h4 className="text-xs font-bold text-[#17231E] mb-1">Academic Milestone Need (10% Bonus)</h4>
            <p className="text-xs text-[#4A5B53] leading-relaxed">
              Students declaring an active capstone, thesis evaluation, or conference submission receive an academic milestone boost.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Usage Quotas & Limits */}
      <section className="bg-white rounded-3xl border border-[#E8E2D2] p-6 sm:p-8 shadow-soft-sm space-y-5">
        <h2 className="text-lg font-bold text-[#17231E] flex items-center gap-2.5 font-sans">
          <span className="w-7 h-7 rounded-full bg-[#faf6ec] text-[#9e7330] text-xs flex items-center justify-center font-black border border-[#D6AD63]/40">
            2
          </span>
          Universal Fair-Use Quotas
        </h2>

        <div className="divide-y divide-[#F0ECE0] text-xs">
          <div className="py-3.5 flex justify-between items-center">
            <div>
              <span className="font-bold text-[#17231E] block">Weekly Cap per Borrower:</span>
              <span className="text-[#4A5B53]">Maximum hours of high-demand lab benches reserved per rolling 7 days.</span>
            </div>
            <span className="font-bold text-[#073D2D] bg-[#F7F1E5] px-3.5 py-1.5 rounded-xl border border-[#E8E2D2]">
              6.0 Hours
            </span>
          </div>

          <div className="py-3.5 flex justify-between items-center">
            <div>
              <span className="font-bold text-[#17231E] block">Max Concurrent Active Bookings:</span>
              <span className="text-[#4A5B53]">Prevents booking multiple expensive instruments simultaneously.</span>
            </div>
            <span className="font-bold text-[#073D2D] bg-[#F7F1E5] px-3.5 py-1.5 rounded-xl border border-[#E8E2D2]">
              3 Active Loans
            </span>
          </div>

          <div className="py-3.5 flex justify-between items-center">
            <div>
              <span className="font-bold text-[#17231E] block">Late Return Cooldown Period:</span>
              <span className="text-[#4A5B53]">Grace period after an unexcused late return before new reservations can be scheduled.</span>
            </div>
            <span className="font-bold text-[#073D2D] bg-[#F7F1E5] px-3.5 py-1.5 rounded-xl border border-[#E8E2D2]">
              48 Hours
            </span>
          </div>
        </div>
      </section>

      {/* 3. Human Oversight & Explainability */}
      <section className="bg-white rounded-3xl border border-[#E8E2D2] p-6 sm:p-8 shadow-soft-sm space-y-5">
        <h2 className="text-lg font-bold text-[#17231E] flex items-center gap-2.5 font-sans">
          <span className="w-7 h-7 rounded-full bg-[#ebf6f1] text-[#073D2D] text-xs flex items-center justify-center font-black border border-[#126B4F]/30">
            3
          </span>
          Human in the Loop &amp; "Why this decision?" Guarantee
        </h2>

        <p className="text-xs text-[#4A5B53] leading-relaxed">
          Per institutional safety rules, important access, safety, and penalty decisions <strong>never rely solely on an algorithm</strong>.
          Every rejection or waitlist decision is accompanied by a plain-language explanation written or confirmed by a designated lab manager,
          viewable in the transparent <em>"Why this decision?"</em> breakdown.
        </p>

        <div className="pt-4 flex justify-end">
          <Link to="/explore">
            <Button size="md" variant="primary" className="font-bold">
              <span>Browse Equipment Catalog</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default AllocationExplainedPage;
