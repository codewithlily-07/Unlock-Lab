import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { DEMO_PERSONAS } from '../../lib/constants';
import {
  Bell,
  User,
  ShieldCheck,
  ChevronDown,
  LayoutDashboard,
  Calendar,
  Layers,
  FileCheck2,
  AlertTriangle,
  History,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

export function Navbar() {
  const { profile, switchPersona, isOwner, isManager, isAdmin, isVerified } = useAuth();
  const { unreadCount, notifications, markAsRead } = useNotifications();
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left: Brand & Main Navigation */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-600 text-white font-bold flex items-center justify-center text-lg shadow-md shadow-brand-500/20">
                U
              </div>
              <div>
                <span className="font-bold text-lg text-slate-900 tracking-tight block leading-none">
                  UnlockLab
                </span>
                <span className="text-[10px] font-semibold text-brand-600 tracking-wider uppercase block mt-0.5">
                  ECE Equipment Sharing
                </span>
              </div>
            </Link>

            <div className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-200">
              <Link
                to="/explore"
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  isActive('/explore')
                    ? 'bg-brand-50 text-brand-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Explore Equipment
              </Link>

              <Link
                to="/my-bookings"
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  isActive('/my-bookings')
                    ? 'bg-brand-50 text-brand-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                My Bookings
              </Link>

              <Link
                to="/credentials"
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  isActive('/credentials')
                    ? 'bg-brand-50 text-brand-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                My Credentials
              </Link>

              <Link
                to="/how-allocation-works"
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                  isActive('/how-allocation-works')
                    ? 'bg-brand-50 text-brand-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Fair Allocation</span>
              </Link>

              {/* Owner / Manager Links */}
              {isManager && (
                <div className="flex items-center space-x-1 pl-2 border-l border-slate-200 ml-2">
                  <Link
                    to="/owner/dashboard"
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                      location.pathname.startsWith('/owner')
                        ? 'bg-blue-50 text-blue-800 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Lab Management</span>
                  </Link>

                  <Link
                    to="/owner/requests"
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100`}
                  >
                    Review Queue
                  </Link>
                </div>
              )}

              {/* Admin Links */}
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ml-2 ${
                    location.pathname.startsWith('/admin')
                      ? 'bg-purple-50 text-purple-800 font-bold'
                      : 'text-purple-700 hover:bg-purple-50'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Hub</span>
                </Link>
              )}
            </div>
          </div>

          {/* Right: Persona Switcher, Notifications, Profile */}
          <div className="flex items-center space-x-3">
            {/* Quick Demo Persona Switcher (For Judges) */}
            <div className="relative">
              <button
                onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs transition-all"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium text-slate-600 hidden sm:inline">Demo Persona:</span>
                <span className="font-bold text-slate-800">{profile?.full_name?.split(' ')[0]}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-white text-slate-700 font-semibold border border-slate-200 uppercase">
                  {profile?.role}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {showPersonaMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400">
                    Switch Persona for Testing (Section 15)
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {DEMO_PERSONAS.map((persona) => (
                      <button
                        key={persona.id}
                        onClick={() => {
                          switchPersona(persona.id);
                          setShowPersonaMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-start space-x-2.5 transition-colors ${
                          profile?.id === persona.id ? 'bg-brand-50/60 font-semibold' : ''
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${persona.color}`} />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-800">{persona.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
                              {persona.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{persona.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Popover */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">In-App Notifications</span>
                    <span className="text-[10px] text-slate-400">{unreadCount} unread</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 p-4 text-center">No notifications</p>
                    ) : (
                      notifications.slice(0, 6).map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            markAsRead(notif.id);
                            if (notif.link) navigate(notif.link);
                            setShowNotifMenu(false);
                          }}
                          className={`p-3 text-xs hover:bg-slate-50 cursor-pointer ${
                            !notif.is_read ? 'bg-blue-50/40 font-medium' : 'text-slate-600'
                          }`}
                        >
                          <div className="font-semibold text-slate-800">{notif.title}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{notif.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Link */}
            <Link
              to="/profile"
              className="flex items-center space-x-2 pl-2 border-l border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900"
            >
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                {profile?.full_name ? profile.full_name[0] : 'U'}
              </div>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

