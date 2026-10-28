import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ShieldCheck, ShieldAlert, Award, Calendar, Building, Mail, Phone, Briefcase } from 'lucide-react';

export function ProfilePage() {
  const { profile, isVerified } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header Card */}
      <Card>
        <CardBody className="p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
                {profile?.full_name ? profile.full_name[0] : 'U'}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold text-slate-900">{profile?.full_name}</h1>
                  {isVerified ? (
                    <Badge variant="success" size="sm" className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verified Identity</span>
                    </Badge>
                  ) : (
                    <Badge variant="warning" size="sm" className="flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Unverified</span>
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {profile?.year_or_designation} · {profile?.department}
                </p>
                <p className="text-xs text-slate-600 font-medium">{profile?.organization}</p>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-500">
              <span className="font-semibold text-slate-700 uppercase tracking-wider block">Assigned Role</span>
              <span className="text-sm font-bold text-brand-600 uppercase">{profile?.role}</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Reliability Score Card (Section 13 Tier B) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900">Borrower Reliability Rating</h3>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
              96 / 100 · High Trust Standing
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Informational accountability metric based on verified equipment returns and clean condition checks.
          </p>
        </CardHeader>

        <CardBody>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="text-2xl font-bold text-slate-900">4</div>
              <div className="text-xs text-slate-500 mt-0.5">Clean Handover Returns</div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-1">+8 pts bonus</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="text-2xl font-bold text-slate-900">0</div>
              <div className="text-xs text-slate-500 mt-0.5">Late Returns</div>
              <div className="text-[10px] text-slate-400 mt-1">-10 pts per late return</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="text-2xl font-bold text-slate-900">0</div>
              <div className="text-xs text-slate-500 mt-0.5">No-Show Cancellations</div>
              <div className="text-[10px] text-slate-400 mt-1">-15 pts per no-show</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="text-2xl font-bold text-slate-900">0</div>
              <div className="text-xs text-slate-500 mt-0.5">Hardware Incidents</div>
              <div className="text-[10px] text-slate-400 mt-1">-20 pts per incident</div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs">
            <strong>Fairness Guarantee:</strong> Reliability scores provide small informational weight in the waitlist priority formula.
            A low score <em>never</em> blocks a borrower from requesting equipment. Important safety decisions are always reviewed by a human manager.
          </div>
        </CardBody>
      </Card>

      {/* Account Details */}
      <Card>
        <CardHeader>
          <h3 className="text-base font-bold text-slate-900">Institutional Details</h3>
        </CardHeader>
        <CardBody className="divide-y divide-slate-100 text-xs">
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" /> Email Address
            </span>
            <span className="font-semibold text-slate-800">{profile?.email}</span>
          </div>
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-400" /> Institution
            </span>
            <span className="font-semibold text-slate-800">{profile?.organization}</span>
          </div>
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-slate-400" /> Department
            </span>
            <span className="font-semibold text-slate-800">{profile?.department}</span>
          </div>
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400" /> Contact Phone
            </span>
            <span className="font-semibold text-slate-800">{profile?.phone || 'Not provided'}</span>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

