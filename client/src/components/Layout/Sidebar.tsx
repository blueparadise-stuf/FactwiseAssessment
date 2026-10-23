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
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC<{ isOpen?: boolean; onClose?: () => void }> = ({
  isOpen = true,
  onClose,
}) => {
  const { user, logout, hasRole } = useAuth();

  const navItems = [
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
      badge: 'Nurses',
    },
    {
      label: 'Doctor Rounds',
      path: '/doctor-rounds',
      icon: Stethoscope,
      allowed: true,
      badge: 'Doctors',
    },
    {
      label: 'Discharge Center',
      path: '/discharges',
      icon: UserCheck,
      allowed: true,
    },
    {
      label: 'Outcomes & Reports',
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
    Administrator: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    Nurse: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Doctor: 'bg-blue-50 text-blue-700 border-blue-200',
    FacilityManager: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-950 via-slate-900 to-blue-800 text-white flex items-center justify-center font-black shadow-md shadow-blue-950/20">
              <Building2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">
                  ArogyaDesk
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                  v2.0
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Patient Care System</p>
            </div>
          </div>
        </div>

        {/* User Role Card */}
        {user && (
          <div className="mx-4 my-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
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
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Clinical Operations
          </div>
          {navItems
            .filter((item) => item.allowed)
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-xs shadow-blue-500/20'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-200/60 text-slate-700">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
        </nav>

        {/* Bottom Facility & Logout */}
        <div className="p-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Capacity Target: 74 Beds</span>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
