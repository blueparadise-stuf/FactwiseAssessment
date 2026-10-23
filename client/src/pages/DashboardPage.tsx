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

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

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
    return <LoadingSpinner size="lg" label="Loading real-time facility metrics..." />;
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-sm text-slate-500">Failed to load facility summary.</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const occupancyDonutData = [
    { name: 'Occupied Beds', value: data.facility.occupiedBeds, color: '#2563eb' },
    { name: 'Available Beds', value: data.facility.availableBeds, color: '#e2e8f0' },
  ];

  const outcomesDonutData = [
    { name: 'Recovered', value: data.outcomes.totalRecovered, color: '#10b981' },
    { name: 'Deceased', value: data.outcomes.totalDeceased, color: '#f43f5e' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Facility Operational Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time occupancy, pending daily-care tasks, and clinical outcomes for{' '}
            <span className="font-semibold text-slate-700">{data.facility.name}</span>
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Benchmark Warning Alert if Mortality exceeds 15% */}
      {data.outcomes.mortalityWarning && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3.5 text-rose-900">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold">Clinical Benchmark Alert:</span> Observed facility mortality rate (
            {data.outcomes.mortalityRate}%) currently exceeds the stated reference benchmark of 15.0%.
            <p className="mt-0.5 text-rose-700">
              Note: This statistical flag highlights outcomes against baseline expectations for clinical investigation.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Facility Capacity & Occupancy */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Bed Capacity
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <BedDouble className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{data.facility.occupiedBeds}</span>
              <span className="text-sm font-semibold text-slate-400">/ {data.facility.capacity} Beds</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, data.facility.occupancyPercentage)}%` }}
              />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center justify-between">
            <span>Available: <strong className="text-slate-800">{data.facility.availableBeds} beds</strong></span>
            <span className="font-semibold text-blue-600">{data.facility.occupancyPercentage}% full</span>
          </div>
        </div>

        {/* Card 2: Today Pending Temperatures */}
        <Link
          to="/temperatures"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-colors group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pending Temps Today
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Thermometer className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-600">
                {data.today.temperaturesPending}
              </span>
              <span className="text-xs font-medium text-slate-400">
                of {data.facility.occupiedBeds} active
              </span>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center justify-between group-hover:text-amber-600 transition-colors">
            <span>Completed: <strong className="text-slate-800">{data.today.temperaturesCompleted}</strong></span>
            <span className="font-semibold flex items-center gap-1">Open Queue <ArrowRight className="w-3 h-3" /></span>
          </div>
        </Link>

        {/* Card 3: Today Pending Doctor Visits */}
        <Link
          to="/doctor-rounds"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-colors group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Doctor Rounds Today
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-blue-600">
                {data.today.doctorVisitsPending}
              </span>
              <span className="text-xs font-medium text-slate-400">pending visits</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center justify-between group-hover:text-blue-600 transition-colors">
            <span>Completed: <strong className="text-slate-800">{data.today.doctorVisitsCompleted}</strong></span>
            <span className="font-semibold flex items-center gap-1">Open Rounds <ArrowRight className="w-3 h-3" /></span>
          </div>
        </Link>

        {/* Card 4: Discharge Candidates */}
        <Link
          to="/discharges"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Discharge Candidates
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-600">
                {data.today.dischargeCandidatesCount}
              </span>
              <span className="text-xs font-medium text-slate-400">3-day fever-free</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center justify-between group-hover:text-emerald-600 transition-colors">
            <span>Ready for review</span>
            <span className="font-semibold flex items-center gap-1">Review <ArrowRight className="w-3 h-3" /></span>
          </div>
        </Link>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 7-Day Activity Trends */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">7-Day Care Coordination Trends</h3>
              <p className="text-xs text-slate-400">Daily temperatures recorded vs doctor visits completed</p>
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
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="temperaturesLogged" name="Nurse Temperatures" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="doctorVisitsLogged" name="Doctor Visits" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Col: Outcomes Benchmark Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Survival vs Mortality</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                Known Outcomes
              </span>
            </div>

            <div className="h-44 w-full flex items-center justify-center">
              {data.outcomes.knownOutcomesCount > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={outcomesDonutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {outcomesDonutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-xs text-slate-400 py-8">
                  Insufficient outcome data recorded yet.
                </div>
              )}
            </div>

            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Survival Rate (Target: 85%)
                </span>
                <strong className="text-emerald-700 font-bold">{data.outcomes.survivalRate}%</strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Mortality Rate (Limit: 15%)
                </span>
                <strong className={data.outcomes.mortalityWarning ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                  {data.outcomes.mortalityRate}%
                </strong>
              </div>
            </div>
          </div>

          <Link
            to="/reports"
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center justify-between"
          >
            <span>Detailed Outcomes & CSV Export</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Recent Admissions & Discharges Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Admissions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Recent Patient Admissions</span>
            </h3>
            <Link to="/patients" className="text-xs font-semibold text-blue-600 hover:underline">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                  <th className="pb-2">Patient</th>
                  <th className="pb-2">Room</th>
                  <th className="pb-2">Admission Date</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentAdmissions.slice(0, 4).map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5">
                      <Link to={`/patients/${p._id}`} className="font-bold text-slate-800 hover:text-blue-600">
                        {p.fullName}
                      </Link>
                      <div className="text-[10px] text-slate-400">{p.patientId}</div>
                    </td>
                    <td className="py-2.5 font-mono text-slate-700 font-semibold">{p.room}</td>
                    <td className="py-2.5 text-slate-500">
                      {new Date(p.admissionDate).toLocaleDateString()}
                    </td>
                    <td className="py-2.5">
                      <Badge variant={p.status === 'admitted' ? 'info' : 'warning'}>
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
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Recent Discharged Patients</span>
            </h3>
            <Link to="/patients?status=discharged" className="text-xs font-semibold text-blue-600 hover:underline">
              View Discharged
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                  <th className="pb-2">Patient</th>
                  <th className="pb-2">Outcome</th>
                  <th className="pb-2">Discharge Date</th>
                  <th className="pb-2">Confirmed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentDischarges.length > 0 ? (
                  data.recentDischarges.slice(0, 4).map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5">
                        <Link to={`/patients/${p._id}`} className="font-bold text-slate-800 hover:text-blue-600">
                          {p.fullName}
                        </Link>
                        <div className="text-[10px] text-slate-400">{p.patientId}</div>
                      </td>
                      <td className="py-2.5">
                        <Badge
                          variant={
                            p.finalOutcome === 'recovered'
                              ? 'success'
                              : p.finalOutcome === 'deceased'
                              ? 'danger'
                              : 'neutral'
                          }
                        >
                          {p.finalOutcome}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-slate-500">
                        {p.dischargeDate ? new Date(p.dischargeDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-2.5 text-slate-600">
                        {p.dischargeConfirmedBy?.name || 'Administrator'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
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
