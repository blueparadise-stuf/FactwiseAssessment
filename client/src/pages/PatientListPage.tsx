import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  BedDouble,
  Eye,
} from 'lucide-react';
import api from '../services/api';
import { Patient } from '../types';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Common/Badge';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { EmptyState } from '../components/Common/EmptyState';

export const PatientListPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });

  // Query states from searchParams or defaults
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'active';
  const page = Number(searchParams.get('page')) || 1;
  const sortBy = searchParams.get('sortBy') || 'admissionDate';
  const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

  const [searchInput, setSearchInput] = useState(search);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: String(page),
        limit: '10',
        search,
        status: status === 'all' ? '' : status,
        sortBy,
        sortOrder,
      });

      const res = await api.get(`/patients?${query.toString()}`);
      if (res.data.success) {
        setPatients(res.data.patients);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [page, status, search, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({
      search: searchInput,
      status,
      page: '1',
      sortBy,
      sortOrder,
    });
  };

  const handleStatusFilter = (newStatus: string) => {
    setSearchParams({
      search,
      status: newStatus,
      page: '1',
      sortBy,
      sortOrder,
    });
  };

  const handleSortToggle = (field: string) => {
    const isCurrent = sortBy === field;
    const newOrder = isCurrent && sortOrder === 'desc' ? 'asc' : 'desc';
    setSearchParams({
      search,
      status,
      page: String(page),
      sortBy: field,
      sortOrder: newOrder,
    });
  };

  const statusVariant = (pStatus: string) => {
    if (pStatus === 'admitted') return 'info';
    if (pStatus === 'discharge_recommended') return 'warning';
    if (pStatus === 'discharged') return 'neutral';
    return 'neutral';
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Admit Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Patient Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active quarantine cohort, room assignments, and clinical status
          </p>
        </div>

        {hasRole('Administrator') && (
          <Link
            to="/patients/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Admit New Patient</span>
          </Link>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, ID (e.g. CT-2026), or bed..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-colors"
            />
          </form>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 text-xs font-semibold">
            {[
              { id: 'active', label: 'Active Cohort' },
              { id: 'all', label: 'All Records' },
              { id: 'admitted', label: 'Admitted' },
              { id: 'discharge_recommended', label: 'Discharge Pending' },
              { id: 'discharged', label: 'Discharged' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  status === tab.id
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner size="md" label="Loading patients..." />
        ) : patients.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Users}
              title="No patients found"
              description="No patient records match the current filter or search criteria."
              actionText={hasRole('Administrator') ? 'Admit Patient' : undefined}
              onAction={hasRole('Administrator') ? () => (window.location.href = '/patients/new') : undefined}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">
                    <button
                      onClick={() => handleSortToggle('patientId')}
                      className="flex items-center gap-1 hover:text-slate-800"
                    >
                      <span>Patient ID</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4">
                    <button
                      onClick={() => handleSortToggle('fullName')}
                      className="flex items-center gap-1 hover:text-slate-800"
                    >
                      <span>Full Name</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4">Age</th>
                  <th className="py-3 px-4">Bed / Room</th>
                  <th className="py-3 px-4">
                    <button
                      onClick={() => handleSortToggle('admissionDate')}
                      className="flex items-center gap-1 hover:text-slate-800"
                    >
                      <span>Admission Date</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4">Clinical Status</th>
                  <th className="py-3 px-4">Discharge Rec</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {patients.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {p.patientId}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        to={`/patients/${p._id}`}
                        className="font-bold text-slate-900 hover:text-blue-600"
                      >
                        {p.fullName}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{p.age} yrs</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-semibold">
                        <BedDouble className="w-3 h-3 text-slate-400" />
                        {p.room}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(p.admissionDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={statusVariant(p.status)}>
                        {p.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {p.dischargeRecommendationStatus === 'recommended' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                          Recommended
                        </span>
                      ) : p.dischargeRecommendationStatus === 'confirmed' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          Confirmed ({p.finalOutcome})
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/patients/${p._id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages || 1}</strong> (Total: {pagination.total} patients)
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setSearchParams({ search, status, page: String(pagination.page - 1), sortBy, sortOrder })}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setSearchParams({ search, status, page: String(pagination.page + 1), sortBy, sortOrder })}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
