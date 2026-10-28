import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';

export function RoleGuard({ children, allowedRoles = [] }) {
  const { profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Verifying access credentials...</p>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const role = profile.role || 'user';
  const hasAccess = allowedRoles.length === 0 || allowedRoles.includes(role) || role === 'admin';

  if (!hasAccess) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Access Restricted</h2>
        <p className="text-xs text-slate-600 leading-relaxed mb-6">
          This area requires <strong className="text-slate-800">{allowedRoles.join(' or ')}</strong> privileges.
          Your current active role is <strong className="text-brand-600 uppercase">{role}</strong>.
        </p>
        <p className="text-[11px] text-slate-400 mb-6 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          Tip for Judges: Use the <strong>Demo Persona</strong> dropdown in the top navigation bar to switch to an authorized role.
        </p>
        <Button variant="secondary" onClick={() => window.history.back()}>
          Return to Previous Screen
        </Button>
      </div>
    );
  }

  return children;
}

