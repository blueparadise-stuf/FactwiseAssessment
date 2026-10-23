import React, { useState, useEffect } from 'react';
import { Menu, Shield, User as UserIcon, Clock, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onMenuToggle: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, title }) => {
  const { user } = useAuth();
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 shadow-2xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        {title && (
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>{title}</span>
            </h1>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Live IST clock */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/80 border border-slate-200/60 text-slate-700 text-xs font-mono font-medium">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{timeStr || 'IST'}</span>
        </div>

        {/* Clinical system badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-xs font-semibold">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>ArogyaDesk Care OS</span>
        </div>

        <div className="h-5 w-px bg-slate-200 hidden sm:block" />

        {/* Staff Profile Header Capsule */}
        <div className="flex items-center gap-2.5 pl-1 py-1 pr-3 rounded-full hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200/60">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-900 to-blue-900 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
            {user ? user.name.charAt(0) : <UserIcon className="w-4 h-4" />}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-none">{user?.name}</p>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider leading-none mt-1">
              {user?.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
