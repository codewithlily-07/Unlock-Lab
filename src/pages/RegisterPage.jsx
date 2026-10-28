import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { FormField, Input, Select } from '../components/ui/FormField';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { ShieldAlert, UserPlus, Info } from 'lucide-react';

export function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [organization, setOrganization] = useState('Apex Institute of Technology');
  const [department, setDepartment] = useState('ECE');
  const [yearOrDesignation, setYearOrDesignation] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    await register({
      fullName,
      email,
      role,
      organization,
      department,
      yearOrDesignation: yearOrDesignation || (role === 'owner' ? 'Lab In-Charge' : 'Student'),
      phone,
    });
    setLoading(false);
    navigate('/profile');
  }

  return (
    <div className="max-w-xl mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5 text-brand-600" />
            <h3 className="text-base font-bold text-slate-900">Create an UnlockLab Account</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Join the departmental equipment network to borrow or share idle instruments.
          </p>
        </CardHeader>

        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Owner Policy Notice:</strong> To ensure laboratory security, users registering as <strong>Lab Owners</strong> must have their institutional credentials verified by a department administrator before published equipment becomes public.
              </span>
            </div>

            <FormField label="Full Name" required>
              <Input
                required
                placeholder="e.g. Dr. Ramesh Gupta"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </FormField>

            <FormField label="Institutional Email" required>
              <Input
                type="email"
                required
                placeholder="e.g. ramesh.gupta@apex.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Account Role" required>
                <Select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="user">Student / Borrower</option>
                  <option value="owner">Lab / Equipment Owner</option>
                </Select>
              </FormField>

              <FormField label="Department" required>
                <Input
                  required
                  placeholder="e.g. ECE, Robotics, Physics"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Affiliated Institution" required>
                <Input
                  required
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                />
              </FormField>

              <FormField label="Designation / Academic Year">
                <Input
                  placeholder="e.g. 4th Year B.Tech or Associate Prof"
                  value={yearOrDesignation}
                  onChange={(e) => setYearOrDesignation(e.target.value)}
                />
              </FormField>
            </div>

            <FormField label="Contact Phone (Optional)">
              <Input
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </FormField>

            <Button type="submit" className="w-full mt-2" loading={loading}>
              Complete Registration
            </Button>

            <div className="text-center pt-2 text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-600 font-semibold hover:underline">
                Sign in here
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

