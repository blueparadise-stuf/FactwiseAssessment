import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  BedDouble,
  Thermometer,
  Stethoscope,
  UserCheck,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Activity,
  PlusCircle,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../services/api';
import { DashboardSummary } from '../types';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { Badge } from '../components/Common/Badge';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { hasRole } = useAuth();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [summaryRes, trendsRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/reports/occupancy?days=7'),
      ]);

      if (summaryRes.data.success) {
        setData(summaryRes.data.summary);
      }
      if (trendsRes.data.success) {
        setTrends(trendsRes.data.trends);
      }
    } catch (err: any) {
      toast.error('Failed to load dashboard metrics from API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading && !data) {
    return <LoadingSpinner size="lg" label="Synchronizing ArogyaDesk facility metrics..." />;
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs max-w-md mx-auto my-12">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Failed to load facility summary</h3>
        <p className="text-xs text-slate-500 mt-1">
          Could not establish real-time connection with MongoDB Atlas.
        </p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const outcomesDonutData = [
    { name: 'Recovered', value: data.outcomes.totalRecovered, color: '#10b981' },
    { name: 'Deceased', value: data.outcomes.totalDeceased, color: '#f43f5e' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center gap-1.5 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Live Census
            </span>
            <span className="text-xs font-semibold text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">{data.facility.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Patient Care Cockpit
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time occupancy tracking, bedside rounds coordination, and recovery metrics.
          </p>
        </div>

        {/* Quick Action CTAs */}
        <div className="flex flex-wrap items-center gap-2.5">
          {hasRole('Administrator') && (
            <Link
              to="/patients/register"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-slate-900/20 hover:shadow-md"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>Admit Patient</span>
            </Link>
          )}

          <Link
            to="/temperatures"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors shadow-2xs"
          >
            <Thermometer className="w-4 h-4 text-amber-500" />
            <span>Vitals</span>
          </Link>

          <Link
            to="/doctor-rounds"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors shadow-2xs"
          >
            <Stethoscope className="w-4 h-4 text-blue-600" />
            <span>Rounds</span>
          </Link>

          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-bold rounded-xl transition-colors shadow-2xs"
            title="Refresh facility data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Clinical Warning Alert if mortality exceeds 15% */}
      {data.outcomes.mortalityWarning && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 via-rose-50/80 to-transparent border border-rose-200/90 flex items-start gap-3.5 text-rose-950 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <div className="flex items-center gap-2">
              <span className="font-black text-rose-900 uppercase tracking-wider">
                Clinical Benchmark Alert
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-200/70 text-rose-900 rounded-full">
                Review Required
              </span>
            </div>
            <p className="mt-1 text-slate-700 leading-relaxed">
              Observed mortality rate (<strong className="text-rose-800 font-bold">{data.outcomes.mortalityRate}%</strong>)
              exceeds the institutional reference monitor threshold of 15.0%.
              <span className="text-slate-500 ml-1">
                (Simulated baseline benchmark for quality control investigation).
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Primary KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Facility Capacity & Bed Occupancy */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs transition-all duration-300 hover:shadow-md hover:border-slate-300">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Bed Capacity
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <BedDouble className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {data.facility.occupiedBeds}
              </span>
              <span className="text-xs font-bold text-slate-400">
                / {data.facility.capacity} Beds Total
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 mt-3 overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-blue-700 to-indigo-600 h-1.5 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min(100, data.facility.occupancyPercentage)}%` }}
              />
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>
              Available: <strong className="text-slate-900 font-bold">{data.facility.availableBeds} beds</strong>
            </span>
            <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full text-[11px]">
              {data.facility.occupancyPercentage}% full
            </span>
          </div>
        </div>

        {/* Card 2: Today Pending Temperatures */}
        <Link
          to="/temperatures"
          className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs transition-all duration-300 hover:shadow-md hover:border-amber-300 group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Morning Vitals Queue
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 group-hover:scale-110 transition-transform">
              <Thermometer className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-600 tracking-tight">
                {data.today.temperaturesPending}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                of {data.facility.occupiedBeds} active inpatients
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 mt-3 overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-amber-400 to-amber-600 h-1.5 rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${
                    data.facility.occupiedBeds > 0
                      ? (data.today.temperaturesCompleted / data.facility.occupiedBeds) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between group-hover:text-amber-700 transition-colors">
            <span>
              Recorded: <strong className="text-slate-900 font-bold">{data.today.temperaturesCompleted}</strong>
            </span>
            <span className="font-bold flex items-center gap-1 text-[11px]">
              Open Queue <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </Link>

        {/* Card 3: Today Pending Doctor Rounds */}
        <Link
          to="/doctor-rounds"
          className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs transition-all duration-300 hover:shadow-md hover:border-blue-300 group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Doctor Bedside Rounds
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:scale-110 transition-transform">
              <Stethoscope className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-blue-700 tracking-tight">
                {data.today.doctorVisitsPending}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                pending clinical evaluations
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 mt-3 overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-700 h-1.5 rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${
                    data.facility.occupiedBeds > 0
                      ? (data.today.doctorVisitsCompleted / data.facility.occupiedBeds) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between group-hover:text-blue-700 transition-colors">
            <span>
              Completed: <strong className="text-slate-900 font-bold">{data.today.doctorVisitsCompleted}</strong>
            </span>
            <span className="font-bold flex items-center gap-1 text-[11px]">
              Open Rounds <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </Link>

        {/* Card 4: Discharge Eligibility Candidates */}
        <Link
          to="/discharges"
          className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs transition-all duration-300 hover:shadow-md hover:border-emerald-300 group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Discharge Pipeline
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:scale-110 transition-transform">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-600 tracking-tight">
                {data.today.dischargeCandidatesCount}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                3-day fever-free streak
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 font-medium">
              Patients meeting institutional discharge criteria
            </p>
          </div>
          <div className="mt-3.5 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between group-hover:text-emerald-700 transition-colors">
            <span className="text-emerald-700 font-semibold">Eligible for Review</span>
            <span className="font-bold flex items-center gap-1 text-[11px]">
              Review <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </Link>
      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Care Coordination Trends */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                7-Day Care Activity Trends
              </h3>
              <p className="text-xs text-slate-500">
                Comparative daily volume of nursing temperatures vs completed doctor visits
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-600">
                <span className="w-3 h-3 rounded-md bg-amber-500" />
                <span>Temperatures</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-slate-600">
                <span className="w-3 h-3 rounded-md bg-blue-600" />
                <span>Doctor Visits</span>
              </div>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '16px',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '12px',
                    padding: '8px 12px',
                  }}
                />
                <Bar dataKey="temperaturesLogged" name="Temperatures" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                <Bar dataKey="doctorVisitsLogged" name="Doctor Visits" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Survival vs Mortality Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Outcomes Benchmark
                </h3>
                <p className="text-xs text-slate-400">Institutional recovery monitor</p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200/60">
                Known Outcomes
              </span>
            </div>

            <div className="h-44 w-full flex items-center justify-center relative">
              {data.outcomes.knownOutcomesCount > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={outcomesDonutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={6}
                        dataKey="value"
                      >
                        {outcomesDonutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={2} stroke="#fff" />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-black text-slate-900">{data.outcomes.survivalRate}%</span>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                      Recovery Rate
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center text-xs text-slate-400 py-8">
                  Insufficient outcome data recorded yet.
                </div>
              )}
            </div>

            <div className="space-y-2.5 mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Survival Rate (Target: 85%)
                </span>
                <strong className="text-emerald-700 font-bold">{data.outcomes.survivalRate}%</strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Mortality Rate (Limit: 15%)
                </span>
                <strong className={data.outcomes.mortalityWarning ? 'text-rose-600 font-bold' : 'text-slate-800 font-bold'}>
                  {data.outcomes.mortalityRate}%
                </strong>
              </div>
            </div>
          </div>

          <Link
            to="/reports"
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center justify-between group"
          >
            <span>Detailed Analysis & CSV Registry Export</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* Patient Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Admissions */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Current Inpatients</h3>
                <p className="text-[11px] text-slate-400">Recently admitted patient cohort</p>
              </div>
            </div>
            <Link
              to="/patients"
              className="text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50/70 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors"
            >
              Directory →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                  <th className="pb-3 font-semibold">Patient</th>
                  <th className="pb-3 font-semibold">Room/Bed</th>
                  <th className="pb-3 font-semibold">Admitted On</th>
                  <th className="pb-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {data.recentAdmissions.slice(0, 5).map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-3">
                      <Link
                        to={`/patients/${p._id}`}
                        className="font-bold text-slate-900 group-hover:text-blue-700 flex items-center gap-2"
                      >
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[11px]">
                          {p.fullName.charAt(0)}
                        </div>
                        <div>
                          <div>{p.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{p.patientId}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="py-3">
                      <span className="font-mono text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                        {p.room}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500 font-medium">
                      {new Date(p.admissionDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 text-right">
                      <Badge
                        variant={p.status === 'admitted' ? 'info' : 'warning'}
                        size="sm"
                      >
                        {p.status.replace('_', ' ')}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Discharges */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Discharged Patients</h3>
                <p className="text-[11px] text-slate-400">Institutional recovery outcomes</p>
              </div>
            </div>
            <Link
              to="/discharges"
              className="text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50/70 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors"
            >
              Discharge Center →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                  <th className="pb-3 font-semibold">Patient</th>
                  <th className="pb-3 font-semibold">Outcome</th>
                  <th className="pb-3 font-semibold">Discharged On</th>
                  <th className="pb-3 font-semibold text-right">Confirmed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {data.recentDischarges.length > 0 ? (
                  data.recentDischarges.slice(0, 5).map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3">
                        <Link
                          to={`/patients/${p._id}`}
                          className="font-bold text-slate-900 group-hover:text-blue-700 flex items-center gap-2"
                        >
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[11px]">
                            {p.fullName.charAt(0)}
                          </div>
                          <div>
                            <div>{p.fullName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{p.patientId}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="py-3">
                        <Badge
                          variant={
                            p.finalOutcome === 'recovered'
                              ? 'success'
                              : p.finalOutcome === 'deceased'
                              ? 'danger'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {p.finalOutcome}
                        </Badge>
                      </td>
                      <td className="py-3 text-slate-500 font-medium">
                        {p.dischargeDate
                          ? new Date(p.dischargeDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'N/A'}
                      </td>
                      <td className="py-3 text-right text-slate-700 font-semibold">
                        {p.dischargeConfirmedBy?.name || 'Administrator'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No discharged patients recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
