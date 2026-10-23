import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Download,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Info,
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
  Cell,
} from 'recharts';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';

export const ReportsPage: React.FC = () => {
  const toast = useToast();

  const [report, setReport] = useState<any | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const [outcomesRes, trendsRes] = await Promise.all([
        api.get('/reports/outcomes'),
        api.get('/reports/occupancy?days=14'),
      ]);

      if (outcomesRes.data.success) {
        setReport(outcomesRes.data.report);
      }
      if (trendsRes.data.success) {
        setTrends(trendsRes.data.trends);
      }
    } catch (err) {
      toast.error('Failed to load clinical outcome reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  const handleDownloadCSV = async () => {
    try {
      setDownloading(true);
      const res = await api.get('/reports/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `arogyadesk-patients-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Patient registry CSV exported successfully!');
    } catch (err) {
      toast.error('Failed to export CSV report.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading && !report) {
    return <LoadingSpinner size="lg" label="Computing clinical cohort statistics..." />;
  }

  if (!report) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-sm text-slate-500">Failed to generate report.</p>
        <button
          onClick={fetchReportsData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const { metrics, sampleSize, ageBreakdown } = report;

  return (
    <div className="space-y-6">
      {/* Header & CSV Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Clinical Outcomes & Statistical Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Mortality & survival tracking against facility reference benchmarks (15% mortality / 85% survival).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchReportsData}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors shadow-xs"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleDownloadCSV}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Exporting...' : 'Export Patient Registry (CSV)'}</span>
          </button>
        </div>
      </div>

      {/* Benchmark Warning Banner */}
      {metrics.mortalityWarning && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3.5 text-rose-950">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold">Facility Mortality Benchmark Threshold Exceeded:</span> Observed mortality is{' '}
            <strong className="text-rose-700 font-extrabold">{metrics.mortalityRate}%</strong>, exceeding the stated reference benchmark of 15.0%.
            <p className="mt-1 text-rose-800 leading-relaxed">
              Medical Rule Notice: The software displays this operational alert to notify leadership of statistical deviation. Clinical root causes must be determined by qualified epidemiological investigation, not assumed automatically by the application.
            </p>
          </div>
        </div>
      )}

      {/* Cohort Definition Banner */}
      <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-start gap-3 text-xs text-slate-700">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-900">Cohort Definition & Statistical Method:</span> Rates are computed strictly across patients with known final clinical outcomes (Recovered or Deceased). Ongoing quarantined patients are intentionally excluded from the denominator to prevent artificial deflation of true mortality rates.
        </div>
      </div>

      {/* Key Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Survival Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Survival Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-emerald-600">{metrics.survivalRate}%</span>
            <div className="text-xs text-slate-400 mt-0.5">Benchmark Target: ≥ 85.0%</div>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Total Recovered: <strong className="text-slate-800">{metrics.recovered} patients</strong>
          </div>
        </div>

        {/* Metric 2: Mortality Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Mortality Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-3xl font-black ${metrics.mortalityWarning ? 'text-rose-600' : 'text-slate-900'}`}>
              {metrics.mortalityRate}%
            </span>
            <div className="text-xs text-slate-400 mt-0.5">Benchmark Ceiling: ≤ 15.0%</div>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Total Deceased: <strong className="text-slate-800">{metrics.deceased} patients</strong>
          </div>
        </div>

        {/* Metric 3: Known Outcomes Denominator */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Resolved Cohort
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900">{sampleSize.knownFinalOutcomes}</span>
            <div className="text-xs text-slate-400 mt-0.5">Recovered + Deceased</div>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Denominator completeness: 100%
          </div>
        </div>

        {/* Metric 4: Quarantined / Active */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ongoing Active
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-amber-600">{sampleSize.currentlyActive}</span>
            <div className="text-xs text-slate-400 mt-0.5">Patients currently in beds</div>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Total All-Time Admitted: <strong className="text-slate-800">{sampleSize.totalAdmitted}</strong>
          </div>
        </div>
      </div>

      {/* Age Bracket Outcomes Breakdown */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Outcomes Breakdown by Age Bracket</h3>
        <p className="text-xs text-slate-400 mb-4">Mortality vulnerability distribution across age demographics</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-2.5 px-4">Age Demographic</th>
                <th className="py-2.5 px-4">Total Patients</th>
                <th className="py-2.5 px-4">Recovered</th>
                <th className="py-2.5 px-4">Deceased</th>
                <th className="py-2.5 px-4 text-right">Age-Specific Mortality</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {ageBreakdown.map((b: any) => (
                <tr key={b.bracket} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-800">{b.bracket} years</td>
                  <td className="py-3 px-4">{b.total}</td>
                  <td className="py-3 px-4 text-emerald-600 font-semibold">{b.recovered}</td>
                  <td className="py-3 px-4 text-rose-600 font-semibold">{b.deceased}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold">
                    <span className={b.mortalityRate > 15 ? 'text-rose-600' : 'text-slate-700'}>
                      {b.mortalityRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 14-Day Activity Trends Graph */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">14-Day Facility Admission vs Discharge Velocity</h3>
            <p className="text-xs text-slate-400">Flow of quarantine bed utilization</p>
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
              <Bar dataKey="admissions" name="Admissions" fill="#2563eb" radius={[4, 4, 0, 0]} />
              <Bar dataKey="discharges" name="Discharges" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
