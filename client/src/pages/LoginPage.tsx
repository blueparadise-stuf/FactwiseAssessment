import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Building2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Activity,
  Stethoscope,
  HeartPulse,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const demoAccounts = [
    {
      role: 'Administrator',
      name: 'Anu Singh',
      email: 'admin@arogyadesk.in',
      password: 'Admin@123',
      badge: 'Full Oversight & Admissions',
      color: 'border-slate-200 hover:border-slate-800 bg-slate-50/80 hover:bg-slate-100',
      activeColor: 'ring-2 ring-slate-900 border-slate-900',
    },
    {
      role: 'Doctor',
      name: 'Dr. Rohan Varma, MD',
      email: 'doctor@arogyadesk.in',
      password: 'Doctor@123',
      badge: 'Daily Rounds & Recommendations',
      color: 'border-blue-200/80 hover:border-blue-600 bg-blue-50/50 hover:bg-blue-50',
      activeColor: 'ring-2 ring-blue-600 border-blue-600',
    },
    {
      role: 'Nurse',
      name: 'Pooja Sharma, RN',
      email: 'nurse@arogyadesk.in',
      password: 'Nurse@123',
      badge: 'Morning Vitals & Care Queue',
      color: 'border-emerald-200/80 hover:border-emerald-600 bg-emerald-50/50 hover:bg-emerald-50',
      activeColor: 'ring-2 ring-emerald-600 border-emerald-600',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      toast.success('Authentication successful. Welcome to ArogyaDesk.');
      navigate('/dashboard');
    } catch (err: any) {
      const msg =
        err.response?.data?.message || 'Invalid email or password. Please verify your credentials.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectDemoAccount = (demo: (typeof demoAccounts)[0]) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-navy-900/40 rounded-full blur-[160px] pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-slate-900 via-slate-950 to-blue-900 text-white flex items-center justify-center mx-auto shadow-2xl shadow-blue-950/60 mb-5 border border-slate-800/80 p-0.5">
          <div className="w-full h-full rounded-[22px] bg-slate-900/90 flex items-center justify-center">
            <Activity className="w-8 h-8 text-emerald-400" />
          </div>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-slate-300 text-xs font-semibold mb-3">
          <HeartPulse className="w-3.5 h-3.5 text-emerald-400" />
          <span>Clinical Healthcare Platform</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">ArogyaDesk</h2>
        <p className="mt-1.5 text-sm text-slate-400 font-medium">
          Patient Care & Inpatient Capacity System
        </p>
      </div>

      {/* Main Form Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="bg-white/95 backdrop-blur-xl py-9 px-6 sm:px-10 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.35)] border border-white/40">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold leading-relaxed">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Staff Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@arogyadesk.in"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/80 border border-slate-200 rounded-2xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all font-medium placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Access Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-11 py-3 bg-slate-50/80 border border-slate-200 rounded-2xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3.5 px-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold rounded-2xl shadow-xl shadow-slate-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Clinical Workspace</span>
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="mt-7 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-slate-700">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-black uppercase tracking-wider">
                  Select Staff Persona
                </h4>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Click to fill</span>
            </div>

            <div className="space-y-2">
              {demoAccounts.map((demo) => {
                const isSelected = email === demo.email;
                return (
                  <button
                    key={demo.role}
                    type="button"
                    onClick={() => handleSelectDemoAccount(demo)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected ? demo.activeColor + ' bg-slate-50' : demo.color
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">{demo.name}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                          {demo.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">{demo.email}</p>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-slate-400">
                      {demo.password}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Hospital Operations Sandbox • Fictional Patient Demonstration</span>
        </div>
      </div>
    </div>
  );
};
