import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DEMO_PERSONAS } from '../lib/constants';
import { Button } from '../components/ui/Button';
import { FormField, Input } from '../components/ui/FormField';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Sparkles, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, switchPersona } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      navigate('/explore');
    } else {
      setError(res.error);
    }
  }

  function handlePersonaClick(persona) {
    switchPersona(persona.id);
    navigate('/explore');
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      {/* 1-Click Persona Quick Login (Judges Demo Mode - Section 15) */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 text-white shadow-md">
        <div className="flex items-center space-x-2 mb-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold tracking-tight">Judge Quick-Switch: Sign In As Demo Persona</h2>
        </div>
        <p className="text-xs text-blue-200 mb-5 max-w-2xl leading-relaxed">
          Click any role below to instantly log in as that fictional persona and test their exact permissions,
          eligibility status, and lifecycle workflows.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {DEMO_PERSONAS.map((persona) => (
            <button
              key={persona.id}
              onClick={() => handlePersonaClick(persona)}
              className="bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl p-3 text-left transition-all hover:scale-[1.02] flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white">
                    {persona.badge}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                </div>
                <div className="font-bold text-xs text-white truncate">{persona.name}</div>
                <div className="text-[10px] text-blue-200 truncate">{persona.title}</div>
              </div>
              <p className="text-[10px] text-blue-100/70 mt-2 line-clamp-2">{persona.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Manual Login Form */}
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <h3 className="text-base font-bold text-slate-900">Standard Account Sign In</h3>
            <p className="text-xs text-slate-500 mt-1">
              All demo accounts use password: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono font-bold">Demo@12345</code>
            </p>
          </CardHeader>

          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {error}
                </div>
              )}

              <FormField label="Institutional Email" required>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <Input
                    type="email"
                    required
                    placeholder="e.g. student1@unlocklab.demo"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </FormField>

              <FormField label="Password" required>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <Input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </FormField>

              <Button type="submit" className="w-full" loading={loading}>
                Sign In
              </Button>

              <div className="text-center pt-2 text-xs text-slate-500">
                Need an account?{' '}
                <Link to="/register" className="text-brand-600 font-semibold hover:underline">
                  Register as Student or Lab Owner
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

