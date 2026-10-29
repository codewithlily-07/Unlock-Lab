import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  ShieldCheck,
  Building,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Clock,
  ArrowRight,
  LogOut,
  User,
} from 'lucide-react';

export function ProfilePage() {
  const { currentUser, logout } = useAuth();
  const [userBookings, setUserBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      loadBookings();
    }
  }, [currentUser]);

  async function loadBookings() {
    setLoading(true);
    try {
      const data = await api.getBookings();
      setUserBookings(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (!currentUser) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-[#E8E2D2] shadow-sm space-y-4 max-w-md mx-auto my-12">
        <User className="w-10 h-10 text-[#103C2D] mx-auto" />
        <h2 className="text-base font-bold text-[#17231E]">Sign In Required</h2>
        <p className="text-xs text-[#4A5B53]">Please sign in with your institutional credentials to view your profile.</p>
        <Link to="/login">
          <Button size="sm" variant="primary">
            Sign In
          </Button>
        </Link>
      </div>
    );
  }

  const approvedCount = userBookings.filter((b) => b.status === 'approved').length;
  const pendingCount = userBookings.filter((b) => b.status === 'pending').length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Profile Header Card */}
      <Card className="border-[#E5DDD0]">
        <CardBody className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-[#073D2D] text-[#FFFCF5] font-black text-2xl flex items-center justify-center shadow-md border border-[#D6AD63]/50">
                {currentUser.full_name ? currentUser.full_name[0] : 'U'}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#17231E]">
                    {currentUser.full_name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#f0f7f4] text-[#126B4F] border border-[#126B4F]/30">
                    {currentUser.role === 'admin' ? 'Administrator' : 'Verified User'}
                  </span>
                </div>
                <p className="text-xs text-[#4A5B53] mt-1">
                  {currentUser.academic_program} &middot; {currentUser.department_name || 'Academic Dept'}
                </p>
                <p className="text-xs text-[#126B4F] font-bold mt-0.5">{currentUser.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await logout();
                  navigate('/');
                }}
                className="text-xs font-bold text-[#c2413a] hover:bg-[#fdf2f1] border-[#c2413a]/30"
              >
                <LogOut className="w-3.5 h-3.5 mr-1" />
                Sign Out
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Account Details & Real Reservation Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[#E5DDD0]">
          <CardBody className="p-5 text-center space-y-1">
            <span className="text-xs text-[#798C82] font-semibold block">Total Reservations</span>
            <div className="text-2xl font-bold text-[#17231E]">{userBookings.length}</div>
            <p className="text-[11px] text-[#4A5B53]">Logged in database</p>
          </CardBody>
        </Card>

        <Card className="border-[#E5DDD0]">
          <CardBody className="p-5 text-center space-y-1">
            <span className="text-xs text-[#798C82] font-semibold block">Approved Bookings</span>
            <div className="text-2xl font-bold text-[#126B4F]">{approvedCount}</div>
            <p className="text-[11px] text-[#4A5B53]">Confirmed scheduled bench time</p>
          </CardBody>
        </Card>

        <Card className="border-[#E5DDD0]">
          <CardBody className="p-5 text-center space-y-1">
            <span className="text-xs text-[#798C82] font-semibold block">Pending Requests</span>
            <div className="text-2xl font-bold text-[#D87E3A]">{pendingCount}</div>
            <p className="text-[11px] text-[#4A5B53]">In administrative review queue</p>
          </CardBody>
        </Card>
      </div>

      {/* Institutional Details */}
      <Card className="border-[#E5DDD0]">
        <CardHeader className="p-5 border-b border-[#E8E2D2]">
          <h3 className="text-sm font-bold text-[#17231E]">Academic Profile Data</h3>
        </CardHeader>
        <CardBody className="divide-y divide-[#F0ECE0] text-xs">
          <div className="py-3 flex items-center justify-between">
            <span className="text-[#4A5B53] flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#798C82]" /> Institutional Email
            </span>
            <span className="font-bold text-[#17231E]">{currentUser.email}</span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <span className="text-[#4A5B53] flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#798C82]" /> Academic Department
            </span>
            <span className="font-bold text-[#17231E]">
              {currentUser.department_name || 'Interdisciplinary / Not Specified'}
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <span className="text-[#4A5B53] flex items-center gap-2">
              <Building className="w-4 h-4 text-[#798C82]" /> Academic Program / Designation
            </span>
            <span className="font-bold text-[#17231E]">{currentUser.academic_program}</span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <span className="text-[#4A5B53] flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#798C82]" /> Contact Phone
            </span>
            <span className="font-bold text-[#17231E]">{currentUser.phone || 'Not provided'}</span>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default ProfilePage;
