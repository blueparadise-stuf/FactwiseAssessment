import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Thermometer,
  Stethoscope,
  LogOut,
  UserCheck,
  BarChart3,
  UserCog,
  Settings,
  ShieldCheck,
  Activity,
  BedDouble,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC<{ isOpen?: boolean; onClose?: () => void }> = ({
  isOpen = true,
  onClose,
}) => {
  const { user, logout, hasRole } = useAuth();

  const primaryNavItems = [
    {
      label: 'Main Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      allowed: true,
    },
    {
      label: 'Patient Directory',
      path: '/patients',
      icon: Users,
      allowed: true,
    },
    {
      label: 'Temperature Queue',
      path: '/temperatures',
      icon: Thermometer,
      allowed: true,
      badge: 'Nurse Queue',
    },
    {
      label: 'Doctor Rounds',
      path: '/doctor-rounds',
      icon: Stethoscope,
      allowed: true,
      badge: 'Doctor Rounds',
    },
    {
      label: 'Discharge Center',
      path: '/discharges',
      icon: UserCheck,
      allowed: true,
    },
  ];

  const adminNavItems = [
    {
      label: 'Reports & Analytics',
      path: '/reports',
      icon: BarChart3,
      allowed: true,
    },
    {
      label: 'User Accounts',
      path: '/users',
      icon: UserCog,
      allowed: hasRole('Administrator'),
    },
    {
      label: 'Facility Settings',
      path: '/settings',
      icon: Settings,
      allowed: true,
    },
  ];

  const roleColors = {
    Administrator: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    Nurse: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    Doctor: 'bg-blue-50 text-blue-700 border-blue-200/80',
    FacilityManager: 'bg-amber-50 text-amber-700 border-amber-200/80',
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden transition-opacity ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-md border-r border-slate-200/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-b from-slate-50/50 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 via-navy-900 to-blue-900 text-white flex items-center justify-center font-black shadow-lg shadow-slate-900/15 border border-slate-800/40">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">
                  ArogyaDesk
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-1.5 py-0.5 rounded-full">
                  v2.0
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Patient Care System</p>
            </div>
          </div>
        </div>

        {/* User Role Card */}
        {user && (
          <div className="mx-4 my-3 p-3.5 rounded-2xl bg-gradient-to-r from-slate-50 via-slate-50/80 to-blue-50/30 border border-slate-200/70 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 to-blue-900 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  {user.name.charAt(0)}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-white" />
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate tracking-tight">{user.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      roleColors[user.role]
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto">
          <div>
            <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Clinical Core
            </div>
            <div className="space-y-1">
              {primaryNavItems
                .filter((item) => item.allowed)
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `group flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 ${
                          isActive
                            ? 'bg-slate-900 text-white font-bold shadow-sm shadow-slate-900/20'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-3">
                            <Icon
                              className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                                isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-700'
                              }`}
                            />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                                isActive
                                  ? 'bg-slate-800 text-slate-300'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200/60'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
            </div>
          </div>

          <div>
            <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Operations & Admin
            </div>
            <div className="space-y-1">
              {adminNavItems
                .filter((item) => item.allowed)
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `group flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 ${
                          isActive
                            ? 'bg-slate-900 text-white font-bold shadow-sm shadow-slate-900/20'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                              isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-700'
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>
                      )}
                    </NavLink>
                  );
                })}
            </div>
          </div>
        </nav>

        {/* Bottom Facility & Logout */}
        <div className="p-3.5 border-t border-slate-100 space-y-2 bg-slate-50/50">
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50/80 border border-emerald-200/70 text-emerald-900 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Target: 74 Beds</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
              Active
            </span>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
