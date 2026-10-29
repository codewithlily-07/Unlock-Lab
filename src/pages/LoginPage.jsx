import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { FormField, Input } from '../components/ui/FormField';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Lock, Mail, ArrowRight, ShieldCheck, GraduationCap, Check, Sparkles } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/campuses';

  function handleQuickFill(roleType) {
    setError('');
    setSelectedRole(roleType);
    if (roleType === 'admin') {
      setEmail('admin@unlocklab.edu');
      setPassword('admin123');
    } else {
      setEmail('student@unlocklab.edu');
      setPassword('student123');
    }
  }

  async function handleDirectSignIn(roleType, e) {
    if (e) e.stopPropagation();
    const targetEmail = roleType === 'admin' ? 'admin@unlocklab.edu' : 'student@unlocklab.edu';
    const targetPass = roleType === 'admin' ? 'admin123' : 'student123';
    setEmail(targetEmail);
    setPassword(targetPass);
    setSelectedRole(roleType);
    setLoading(true);
    setError('');
    try {
      const res = await login(targetEmail, targetPass);
      if (res.success) {
        if (res.user?.role === 'admin') {
          navigate('/owner/requests');
        } else {
          navigate('/my-bookings');
        }
      } else {
        setError(res.error || 'Authentication failed');
      }
    } catch (e) {
      setError(e.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        // If user logged in as admin and had no specific redirect, send to review queue or admin hub
        if (res.user?.role === 'admin' && (!location.state?.from || location.state?.from?.pathname === '/campuses')) {
          navigate('/owner/requests');
        } else if (res.user?.role === 'user' && (!location.state?.from || location.state?.from?.pathname === '/campuses')) {
          navigate('/my-bookings');
        } else {
          navigate(redirectPath);
        }
      } else {
        setError(res.error || 'Invalid credentials');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto py-10 px-4 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-[#103C2D] text-[#F3A66B] flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold font-serif text-[#17231E]">Sign In to UnlockLab</h1>
        <p className="text-xs text-[#4A5B53] max-w-xs mx-auto">
          Access your institutional reservations, manage lab equipment, and explore shared facilities.
        </p>
      </div>

      {/* QUICK ROLE SELECTOR (ADMIN & STUDENT ACCOUNTS) */}
      <div className="p-4 rounded-2xl bg-[#F4EFE6] border border-[#DDD5C7] space-y-2.5 shadow-sm">
        <div className="flex items-center justify-between text-xs font-bold text-[#103C2D]">
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-[#D87E3A]" />
            Quick Test Institutional Personas
          </span>
          <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-[#DDD5C7] text-[#6B7266]">
            1-Click Demo
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {/* ADMIN BUTTON */}
          <button
            type="button"
            onClick={() => handleDirectSignIn('admin')}
            className={`p-3 rounded-xl border text-left transition-all duration-200 group relative ${
              selectedRole === 'admin'
                ? 'bg-white border-[#103C2D] shadow-sm ring-1 ring-[#103C2D]'
                : 'bg-white/80 border-[#E0D8CB] hover:bg-white hover:border-[#103C2D]/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="w-6 h-6 rounded-lg bg-[#EAE2D5] text-[#103C2D] flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
              <span className="text-[10px] font-bold text-[#103C2D] group-hover:underline flex items-center">
                Sign In &rarr;
              </span>
            </div>
            <div className="text-xs font-extrabold text-[#17231E]">Lab Admin</div>
            <div className="text-[10px] text-[#6B7266] truncate">admin@unlocklab.edu</div>
            <div className="mt-1 text-[9px] font-semibold text-[#103C2D] uppercase tracking-wide">
              Reviews &amp; Approves
            </div>
          </button>

          {/* STUDENT BUTTON */}
          <button
            type="button"
            onClick={() => handleDirectSignIn('student')}
            className={`p-3 rounded-xl border text-left transition-all duration-200 group relative ${
              selectedRole === 'student'
                ? 'bg-white border-[#D87E3A] shadow-sm ring-1 ring-[#D87E3A]'
                : 'bg-white/80 border-[#E0D8CB] hover:bg-white hover:border-[#D87E3A]/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="w-6 h-6 rounded-lg bg-[#FAEDE3] text-[#D87E3A] flex items-center justify-center">
                <GraduationCap className="w-3.5 h-3.5" />
              </span>
              <span className="text-[10px] font-bold text-[#D87E3A] group-hover:underline flex items-center">
                Sign In &rarr;
              </span>
            </div>
            <div className="text-xs font-extrabold text-[#17231E]">Student User</div>
            <div className="text-[10px] text-[#6B7266] truncate">student@unlocklab.edu</div>
            <div className="mt-1 text-[9px] font-semibold text-[#D87E3A] uppercase tracking-wide">
              Books Equipment
            </div>
          </button>
        </div>
      </div>

      <Card className="border-[#E5DDD0] shadow-sm">
        <CardBody className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {error && (
              <div className="p-3.5 rounded-xl bg-[#fdf2f1] border border-[#c2413a]/30 text-[#c2413a] text-xs font-semibold">
                {error}
              </div>
            )}

            <FormField label="Institutional Email" required>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#798C82] absolute left-3.5 top-3" />
                <Input
                  type="email"
                  required
                  placeholder="e.g. yourname@institution.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 text-xs"
                />
              </div>
            </FormField>

            <FormField label="Password" required>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#798C82] absolute left-3.5 top-3" />
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 text-xs"
                />
              </div>
            </FormField>

            <Button
              type="submit"
              variant="primary"
              className="w-full font-bold bg-[#103C2D] hover:bg-[#185340] text-white py-2.5 rounded-xl shadow-sm"
              loading={loading}
            >
              Sign In
            </Button>

            <div className="text-center pt-3 border-t border-[#E8E2D2] text-xs text-[#4A5B53]">
              Don&apos;t have an institutional account?{' '}
              <Link to="/register" className="text-[#103C2D] font-bold hover:underline">
                Register here
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

export default LoginPage;
