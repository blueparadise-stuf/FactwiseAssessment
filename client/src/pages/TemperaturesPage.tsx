import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Thermometer,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Plus,
  Edit3,
  BedDouble,
  User,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/Common/Badge';
import { Modal } from '../components/Common/Modal';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { EmptyState } from '../components/Common/EmptyState';

export const TemperaturesPage: React.FC = () => {
  const { hasRole } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [pendingList, setPendingList] = useState<any[]>([]);
  const [completedList, setCompletedList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Record Modal
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [tempCelsius, setTempCelsius] = useState('');
  const [measurementNotes, setMeasurementNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Correction Modal
  const [correctModalOpen, setCorrectModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [newTemp, setNewTemp] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');

  const fetchTemperatureQueue = async () => {
    try {
      setLoading(true);
      const res = await api.get('/temperatures/pending');
      if (res.data.success) {
        setTargetDate(res.data.targetDate);
        setPendingList(res.data.pending);
        setCompletedList(res.data.completed);
      }
    } catch (err) {
      toast.error('Failed to load daily temperature queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemperatureQueue();
  }, []);

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(tempCelsius);
    if (isNaN(val) || val < 34.0 || val > 43.0) {
      toast.error('Please enter a physiologically plausible temperature between 34.0°C and 43.0°C.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/temperatures', {
        patientId: selectedPatient?._id,
        temperatureCelsius: val,
        measurementDate: targetDate,
        notes: measurementNotes.trim() || undefined,
      });

      if (res.data.success) {
        toast.success(`Temperature ${val}°C recorded for ${selectedPatient?.fullName}.`);
        setRecordModalOpen(false);
        setTempCelsius('');
        setMeasurementNotes('');
        fetchTemperatureQueue();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record temperature.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCorrectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(newTemp);
    if (isNaN(val) || val < 34.0 || val > 43.0) {
      toast.error('Invalid temperature value.');
      return;
    }
    if (correctionReason.trim().length < 5) {
      toast.error('Please enter at least 5 characters explaining the correction reason.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/temperatures/${selectedRecord?._id}/corrections`, {
        newTemperatureCelsius: val,
        reason: correctionReason.trim(),
      });

      if (res.data.success) {
        toast.success('Temperature record corrected with audit trail.');
        setCorrectModalOpen(false);
        setNewTemp('');
        setCorrectionReason('');
        fetchTemperatureQueue();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Correction failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentList = activeTab === 'pending' ? pendingList : completedList;
  const filteredList = currentList.filter((item) => {
    const p = item.patient;
    const term = searchTerm.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(term) ||
      p.patientId.toLowerCase().includes(term) ||
      p.room.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Daily Nurse Temperature Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational measurement roster for today (<strong>{targetDate || 'Today'}</strong>).
            Prevents duplicate submissions and tracks pending vitals.
          </p>
        </div>

        <button
          onClick={fetchTemperatureQueue}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Tabs & Search Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'pending'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Pending Today ({pendingList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'completed'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Completed Today ({completedList.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by name, ID, or bed..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Roster Cards / Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner size="md" label="Loading temperature queue..." />
        ) : filteredList.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Thermometer}
              title={activeTab === 'pending' ? 'All measurements complete!' : 'No completed measurements today'}
              description={
                activeTab === 'pending'
                  ? 'Great job! Every active patient has received their primary temperature measurement for today.'
                  : 'No temperature records have been saved yet for today.'
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Bed</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Admission Date</th>
                  {activeTab === 'completed' && <th className="py-3 px-4">Recorded Reading</th>}
                  {activeTab === 'completed' && <th className="py-3 px-4">Fever Status</th>}
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredList.map((item) => {
                  const p = item.patient;
                  const rec = item.record;
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {p.room}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link to={`/patients/${p._id}`} className="font-bold text-slate-900 hover:text-blue-600">
                          {p.fullName}
                        </Link>
                        <div className="text-[10px] text-slate-400 font-mono">{p.patientId}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(p.admissionDate).toLocaleDateString()}
                      </td>

                      {activeTab === 'completed' && rec && (
                        <td className="py-3 px-4">
                          <span className="font-mono font-black text-sm text-slate-900">
                            {rec.temperatureCelsius}°C
                          </span>
                        </td>
                      )}

                      {activeTab === 'completed' && rec && (
                        <td className="py-3 px-4">
                          {rec.isFever ? (
                            <Badge variant="danger" size="sm">Fever (≥ 38.0°C)</Badge>
                          ) : rec.isUnusual ? (
                            <Badge variant="warning" size="sm">Unusual Reading</Badge>
                          ) : (
                            <Badge variant="success" size="sm">Normal</Badge>
                          )}
                        </td>
                      )}

                      <td className="py-3 px-4 text-right">
                        {activeTab === 'pending' ? (
                          hasRole('Nurse', 'Doctor', 'Administrator') && (
                            <button
                              onClick={() => {
                                setSelectedPatient(p);
                                setTempCelsius('');
                                setMeasurementNotes('');
                                setRecordModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Take Reading</span>
                            </button>
                          )
                        ) : (
                          hasRole('Nurse', 'Administrator') && (
                            <button
                              onClick={() => {
                                setSelectedRecord(rec);
                                setNewTemp(String(rec.temperatureCelsius));
                                setCorrectionReason('');
                                setCorrectModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Correct</span>
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Modal */}
      <Modal
        isOpen={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
        title="Record Primary Daily Temperature"
        description={`Logging for ${selectedPatient?.fullName} (${selectedPatient?.room}) on ${targetDate}`}
      >
        <form onSubmit={handleRecordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Temperature in Celsius (°C) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="34.0"
              max="43.0"
              value={tempCelsius}
              onChange={(e) => setTempCelsius(e.target.value)}
              placeholder="e.g. 36.8"
              required
              autoFocus
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">Plausible range: 34.0°C to 43.0°C. Duplicate writes for today are strictly prevented.</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Measurement Notes (Optional)
            </label>
            <input
              type="text"
              value={measurementNotes}
              onChange={(e) => setMeasurementNotes(e.target.value)}
              placeholder="Patient resting, morning tympanic reading..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRecordModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Save Temperature
            </button>
          </div>
        </form>
      </Modal>

      {/* Authorized Correction Modal */}
      <Modal
        isOpen={correctModalOpen}
        onClose={() => setCorrectModalOpen(false)}
        title="Authorized Temperature Correction"
        description="Amends the primary reading and creates an indelible audit entry."
      >
        <form onSubmit={handleCorrectSubmit} className="space-y-4">
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
            Current logged value:{' '}
            <span className="font-mono font-bold">{selectedRecord?.temperatureCelsius}°C</span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Corrected Temperature (°C) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="34.0"
              max="43.0"
              value={newTemp}
              onChange={(e) => setNewTemp(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Authorized Reason (Required) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              placeholder="e.g. Typo in decimal entry; thermometer verified at 37.1°C"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCorrectModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
            >
              Commit Audited Correction
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
