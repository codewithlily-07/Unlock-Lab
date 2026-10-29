import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../lib/api';
import {
  Bell,
  User,
  ShieldCheck,
  ChevronDown,
  LayoutDashboard,
  Calendar,
  Layers,
  HelpCircle,
  Menu,
  X,
  LogOut,
  LogIn,
  UserPlus,
  PlusCircle,
  Building,
} from 'lucide-react';

export function Navbar() {
  const { currentUser, profile, isAdmin, logout } = useAuth();
  const { unreadCount, notifications, markAsRead } = useNotifications();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    if (isAdmin) {
      loadPendingCount();
      const interval = setInterval(loadPendingCount, 15000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, location.pathname]);

  async function loadPendingCount() {
    try {
      const data = await api.getBookings({ all: true, status: 'pending' });
      setPendingReviewCount(Array.isArray(data) ? data.length : 0);
    } catch (e) {
      // Ignore background errors
    }
  }

  async function handleLogout() {
    await logout();
    setShowUserMenu(false);
    navigate('/');
  }

  return (
    <nav className="bg-[#F7F1E7]/95 backdrop-blur-md sticky top-0 z-40 border-b border-[#E5DDD0] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left: Brand & Main Navigation */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-[#103C2D] text-[#F7F1E7] font-black flex items-center justify-center text-lg shadow-sm border border-[#F3A66B]/40 group-hover:scale-105 transition-transform">
                <svg
                  className="w-5 h-5 text-[#F3A66B]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                </svg>
              </div>
              <div>
                <span className="font-extrabold text-lg text-[#22251F] tracking-tight block leading-none font-sans">
                  UnlockLab
                </span>
                <span className="text-[10px] font-bold text-[#103C2D] tracking-wider uppercase block mt-1">
                  Resource Sharing
                </span>
              </div>
            </Link>

            <div className="hidden md:flex items-center space-x-1 pl-4 border-l border-[#E5DDD0]">
              <Link
                to="/campuses"
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive('/campuses')
                    ? 'bg-[#103C2D] text-white shadow-sm'
                    : 'text-[#4A5043] hover:text-[#22251F] hover:bg-[#EFE7D8]'
                }`}
              >
                Campuses &amp; Facilities
              </Link>

              {currentUser && (
                <Link
                  to="/my-bookings"
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive('/my-bookings')
                      ? 'bg-[#103C2D] text-white shadow-sm'
                      : 'text-[#4A5043] hover:text-[#22251F] hover:bg-[#EFE7D8]'
                  }`}
                >
                  My Bookings
                </Link>
              )}

              <Link
                to="/how-allocation-works"
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  isActive('/how-allocation-works')
                    ? 'bg-[#126B4F] text-white shadow-soft-sm'
                    : 'text-[#4A5B53] hover:text-[#17231E] hover:bg-[#F7F1E5]'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Fair Allocation</span>
              </Link>

              {/* Admin Links */}
              {isAdmin && (
                <div className="flex items-center space-x-1 pl-2 border-l border-[#E8E2D2] ml-2">
                  <Link
                    to="/admin/dashboard"
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      location.pathname.startsWith('/admin')
                        ? 'bg-[#073D2D] text-white shadow-sm'
                        : 'text-[#073D2D] bg-[#073D2D]/5 hover:bg-[#073D2D]/10'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#D6AD63]" />
                    <span>Admin Hub</span>
                  </Link>

                  <Link
                    to="/owner/requests"
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all bg-[#faf6ec] text-[#9e7330] border border-[#D6AD63]/40 hover:bg-[#f3ebd4] flex items-center gap-1.5`}
                  >
                    <span>Review Queue</span>
                    {pendingReviewCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-[#D87E3A] text-white shadow-xs animate-pulse">
                        {pendingReviewCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    to="/owner/resources/new"
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all bg-[#126B4F] text-white hover:bg-[#0d553e] flex items-center gap-1`}
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>Add Resource</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right: User Authentication / Action Bar */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {currentUser ? (
              <>
                {/* Notifications Popover */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowNotifMenu(!showNotifMenu);
                      setShowUserMenu(false);
                    }}
                    className="relative p-2 rounded-xl text-[#4A5B53] hover:text-[#17231E] hover:bg-[#F7F1E5] border border-transparent hover:border-[#E8E2D2] transition-colors"
                    aria-label="View notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#c2413a] text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifMenu && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#E8E2D2] py-2 z-50">
                      <div className="px-4 py-2 border-b border-[#F0ECE0] flex items-center justify-between">
                        <span className="text-xs font-bold text-[#17231E]">System Notifications</span>
                        <span className="text-[10px] font-bold text-[#126B4F] bg-[#f0f7f4] px-2 py-0.5 rounded-full">
                          {unreadCount} unread
                        </span>
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-[#F0ECE0]">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-[#798C82] p-4 text-center">No active notifications.</p>
                        ) : (
                          notifications.slice(0, 6).map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => {
                                markAsRead(notif.id);
                                if (notif.link) navigate(notif.link);
                                setShowNotifMenu(false);
                              }}
                              className={`p-3 text-xs hover:bg-[#F7F1E5] cursor-pointer transition-colors ${
                                !notif.is_read ? 'bg-[#f0f7f4]/60 font-medium' : 'text-[#4A5B53]'
                              }`}
                            >
                              <div className="font-bold text-[#17231E]">{notif.title}</div>
                              <div className="text-[11px] text-[#4A5B53] mt-0.5">{notif.message}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Authenticated User Menu */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowUserMenu(!showUserMenu);
                      setShowNotifMenu(false);
                    }}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F7F1E5] border border-[#E8E2D2] text-xs transition-all shadow-sm"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#073D2D] text-[#FFFCF5] font-bold flex items-center justify-center text-xs">
                      {currentUser.full_name ? currentUser.full_name[0] : 'U'}
                    </div>
                    <div className="text-left hidden sm:block">
                      <div className="font-bold text-[#17231E] text-xs truncate max-w-[120px]">
                        {currentUser.full_name}
                      </div>
                      <div className="text-[10px] text-[#4A5B53] uppercase font-semibold">
                        {currentUser.role === 'admin' ? 'Administrator' : currentUser.department_code || 'User'}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-[#798C82]" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#E8E2D2] py-2 z-50">
                      <div className="px-4 py-2.5 border-b border-[#F0ECE0]">
                        <p className="text-xs font-bold text-[#17231E] truncate">{currentUser.full_name}</p>
                        <p className="text-[11px] text-[#4A5B53] truncate">{currentUser.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#F7F1E5] text-[#073D2D] border border-[#E8E2D2]">
                          {currentUser.role === 'admin' ? 'Administrator' : currentUser.department_name || 'Academic User'}
                        </span>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-xs text-[#17231E] hover:bg-[#F7F1E5] font-medium"
                        >
                          <User className="w-3.5 h-3.5 text-[#126B4F]" />
                          <span>My Profile</span>
                        </Link>
                        <Link
                          to="/my-bookings"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-xs text-[#17231E] hover:bg-[#F7F1E5] font-medium"
                        >
                          <Calendar className="w-3.5 h-3.5 text-[#126B4F]" />
                          <span>My Reservations</span>
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin/dashboard"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center space-x-2 px-4 py-2 text-xs text-[#073D2D] bg-[#f0f7f4] hover:bg-[#e4f2ec] font-bold"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-[#126B4F]" />
                            <span>Admin Oversight Hub</span>
                          </Link>
                        )}
                      </div>

                      <div className="pt-1 border-t border-[#F0ECE0]">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left flex items-center space-x-2 px-4 py-2 text-xs text-[#c2413a] hover:bg-[#fdf2f1] font-semibold"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Public / Logged Out Actions */
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#17231E] hover:bg-[#EFE7D8] transition-colors flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#126B4F]" />
                  <span>Sign In</span>
                </Link>

                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#103C2D] text-white hover:bg-[#185340] shadow-sm transition-all flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#F3A66B]" />
                  <span>Register</span>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-[#4A5B53] hover:text-[#17231E] hover:bg-[#F7F1E5]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-[#E8E2D2] space-y-1">
            <Link
              to="/campuses"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-xs font-bold text-[#17231E] hover:bg-[#F7F1E5]"
            >
              Campuses &amp; Facilities
            </Link>

            {currentUser && (
              <Link
                to="/my-bookings"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-xs font-bold text-[#17231E] hover:bg-[#F7F1E5]"
              >
                My Bookings
              </Link>
            )}

            <Link
              to="/how-allocation-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-xs font-bold text-[#17231E] hover:bg-[#F7F1E5]"
            >
              Fair Allocation
            </Link>

            {isAdmin && (
              <>
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-xs font-bold text-[#073D2D] bg-[#f0f7f4]"
                >
                  Admin Oversight Hub
                </Link>
                <Link
                  to="/owner/requests"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-xs font-bold text-[#9e7330] bg-[#faf6ec]"
                >
                  Review Requests Queue
                </Link>
                <Link
                  to="/owner/resources/new"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-xs font-bold text-[#126B4F]"
                >
                  + Add Room or Equipment
                </Link>
              </>
            )}

            {currentUser ? (
              <div className="pt-2 border-t border-[#E8E2D2] space-y-1">
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-xs font-bold text-[#17231E] hover:bg-[#F7F1E5]"
                >
                  Signed in as {currentUser.full_name}
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-[#c2413a] hover:bg-[#fdf2f1]"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-[#E8E2D2] flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 rounded-xl text-xs font-bold text-[#17231E] bg-[#EFE7D8]"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 rounded-xl text-xs font-bold text-white bg-[#103C2D]"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
