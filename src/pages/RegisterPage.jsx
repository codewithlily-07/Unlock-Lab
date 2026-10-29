import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { FormField, Input, Select } from '../components/ui/FormField';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { UserPlus, Lock, Mail, User, Building, BookOpen, AlertCircle } from 'lucide-react';

export function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [academicProgram, setAcademicProgram] = useState('Undergraduate');
  const [phone, setPhone] = useState('');
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadDepartments();
  }, []);

  async function loadDepartments() {
    try {
      const list = await api.getDepartments();
      setDepartments(list || []);
      if (list && list.length > 0) {
        setDepartmentId(list[0].id);
      }
    } catch (e) {
      console.error('Failed to load departments:', e);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const res = await register({
        fullName,
        email,
        password,
        departmentId,
        academicProgram,
        phone,
      });

      if (res.success) {
        navigate('/campuses');
      } else {
        setError(res.error || 'Registration failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-4 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-[#103C2D] text-[#F3A66B] flex items-center justify-center mx-auto shadow-sm">
          <UserPlus className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold font-serif text-[#17231E]">Create Your Account</h1>
        <p className="text-xs text-[#4A5B53] max-w-sm mx-auto">
          Join the branch-neutral campus resource sharing network. Reserve rooms, laboratories, and specialized instrumentation.
        </p>
      </div>

      <Card className="border-[#E5DDD0] shadow-sm">
        <CardBody className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {error && (
              <div className="p-3.5 rounded-xl bg-[#fdf2f1] border border-[#c2413a]/30 text-[#c2413a] text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <FormField label="Full Name" required>
              <div className="relative">
                <User className="w-4 h-4 text-[#798C82] absolute left-3.5 top-3" />
                <Input
                  required
                  placeholder="e.g. Elena Rostova"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10 text-xs"
                />
              </div>
            </FormField>

            <FormField label="Institutional Email" required>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#798C82] absolute left-3.5 top-3" />
                <Input
                  type="email"
                  required
                  placeholder="e.g. elena@institution.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 text-xs"
                />
              </div>
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Password" required>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#798C82] absolute left-3.5 top-3" />
                  <Input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 text-xs"
                  />
                </div>
              </FormField>

              <FormField label="Confirm Password" required>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#798C82] absolute left-3.5 top-3" />
                  <Input
                    type="password"
                    required
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 text-xs"
                  />
                </div>
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Academic Department" required>
                <Select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="text-xs"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Academic Program / Role" required>
                <Select
                  value={academicProgram}
                  onChange={(e) => setAcademicProgram(e.target.value)}
                  className="text-xs"
                >
                  <option value="Undergraduate">Undergraduate Student</option>
                  <option value="Postgraduate">Postgraduate Student (M.Tech / M.Sc)</option>
                  <option value="PhD Scholar">PhD Research Scholar</option>
                  <option value="Research Fellow">Postdoctoral / Research Fellow</option>
                  <option value="Faculty">Faculty / Lab Director</option>
                </Select>
              </FormField>
            </div>

            <FormField label="Contact Phone (Optional)">
              <Input
                placeholder="+1 (555) 019-2834"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="text-xs"
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              className="w-full font-bold bg-[#103C2D] hover:bg-[#185340] text-white py-2.5 rounded-xl mt-2"
              loading={loading}
            >
              Complete Registration
            </Button>

            <div className="text-center pt-3 border-t border-[#E8E2D2] text-xs text-[#4A5B53]">
              Already registered?{' '}
              <Link to="/login" className="text-[#103C2D] font-bold hover:underline">
                Sign in here
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

export default RegisterPage;
