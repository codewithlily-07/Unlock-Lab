import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Clock, Users, Cpu, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function LandingPage() {
  return (
    <div className="space-y-16 py-4">
      {/* Hero Section (Clean, easily replaceable placeholder) */}
      <section className="text-center py-12 md:py-16 max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Hackathon Demo · Electronics &amp; Communication Engineering</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Unlock Underused Lab Equipment <br />
          <span className="text-brand-600">&amp; Specialized Spaces</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          A trusted institutional platform for sharing idle lab instruments, FPGA development boards,
          soldering benches, and testing bays with students, researchers, and local hardware startups.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to="/explore">
            <Button size="lg" className="w-full sm:w-auto shadow-md shadow-brand-500/20">
              <span>Explore Available Equipment</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>

          <Link to="/how-allocation-works">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              How Fair Allocation Works
            </Button>
          </Link>
        </div>
      </section>

      {/* Impact Dashboard (Section 13 Tier A) */}
      <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-1">
            Impact Metrics (Demo Seed Data)
          </h2>
          <h3 className="text-2xl font-bold text-slate-900">Idle Capacity Successfully Unlocked</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-3xl font-extrabold text-brand-600 mb-1">142 hrs</div>
            <div className="text-xs font-medium text-slate-600">Idle Lab Hours Unlocked</div>
            <div className="text-[10px] text-slate-400 mt-1">Utilized instead of sitting idle</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-3xl font-extrabold text-slate-900 mb-1">38</div>
            <div className="text-xs font-medium text-slate-600">Students &amp; Researchers Served</div>
            <div className="text-[10px] text-slate-400 mt-1">Undergrads, postgrads &amp; faculty</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-3xl font-extrabold text-purple-600 mb-1">6</div>
            <div className="text-xs font-medium text-slate-600">Outside Startup Teams Supported</div>
            <div className="text-[10px] text-slate-400 mt-1">Cross-institutional access</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-3xl font-extrabold text-emerald-600 mb-1">73%</div>
            <div className="text-xs font-medium text-slate-600">Off-Peak Bench Utilization</div>
            <div className="text-[10px] text-slate-400 mt-1">Up from 24% baseline</div>
          </div>
        </div>
      </section>

      {/* How it Works / Complete 10-Step Journey Overview */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-1">The Trust Architecture</h2>
          <h3 className="text-2xl font-bold text-slate-900">How UnlockLab Ensures Safety &amp; Accountability</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Automated Eligibility Engine</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Prerequisites, safety certifications, and departmental standing are checked programmatically
              before requests are submitted, preventing unqualified use of sensitive RF instruments.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Custody &amp; Condition Verification</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mandatory before-and-after condition inspections with photo evidence and QR tokens guarantee that
              damages are detected immediately and logged to an append-only audit trail.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Explainable Fair Allocation</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Weekly quotas, transparent waitlist scoring, and automatic slot re-allocation eliminate favoritism
              and hoarding while giving priority to academic milestone needs.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
