import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  BedDouble,
  ShieldAlert,
  ArrowRight,
  Shield,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/Common/Badge';
import { Modal } from '../components/Common/Modal';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { EmptyState } from '../components/Common/EmptyState';

export const DischargesPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const toast = useToast();

  const [candidates, setCandidates] = useState<any[]>([]);
  const [inProgress, setInProgress] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'qualified' | 'in_progress'>('qualified');
  const [loading, setLoading] = useState(true);

  // Recommend Modal
  const [recommendModalOpen, setRecommendModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [recommendNotes, setRecommendNotes] = useState('');

  // Confirm Discharge Modal (Admin)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [finalOutcome, setFinalOutcome] = useState<'recovered' | 'deceased'>('recovered');
  const [confirmNotes, setConfirmNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/discharges/eligible');
      if (res.data.success) {
        setCandidates(res.data.candidates);
        setInProgress(res.data.inProgress);
      }
    } catch (err) {
      toast.error('Failed to load discharge eligibility roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleRecommendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post(`/discharges/${selectedCandidate?.patient?._id}/recommend`, {
        notes: recommendNotes.trim() || undefined,
      });

      if (res.data.success) {
        toast.success(`Discharge recommended for ${selectedCandidate?.patient?.fullName}.`);
        setRecommendModalOpen(false);
        setRecommendNotes('');
        fetchCandidates();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to recommend discharge.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post(`/discharges/${selectedCandidate?.patient?._id}/confirm`, {
        finalOutcome,
        notes: confirmNotes.trim() || undefined,
      });

      if (res.data.success) {
        toast.success(`Discharge confirmed! Bed ${selectedCandidate?.patient?.room} is now released.`);
        setConfirmModalOpen(false);
        setConfirmNotes('');
        fetchCandidates();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to confirm discharge.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentList = activeTab === 'qualified' ? candidates : inProgress;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Discharge Eligibility & Coordination Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational definition of cure: <strong>3 full consecutive fever-free calendar days below 38.0°C</strong>.
            Requires clinical physician recommendation followed by administrative confirmation to release bed capacity.
          </p>
        </div>

        <button
          onClick={fetchCandidates}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Candidates</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('qualified')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'qualified'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Qualified Candidates ({candidates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('in_progress')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'in_progress'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>In-Progress Recovery ({inProgress.length})</span>
        </button>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2">
            <LoadingSpinner size="md" label="Evaluating discharge eligibility..." />
          </div>
        ) : currentList.length === 0 ? (
          <div className="col-span-2">
            <EmptyState
              icon={UserCheck}
              title={activeTab === 'qualified' ? 'No patients currently meet 3-day discharge criteria' : 'No patients currently in progress'}
              description={
                activeTab === 'qualified'
                  ? 'Patients must complete 3 verified consecutive calendar days below 38.0°C without any missing measurements.'
                  : 'All admitted patients are either qualified or have not accumulated streak history.'
              }
            />
          </div>
        ) : (
          currentList.map((item) => {
            const p = item.patient;
            const elig = item.eligibility;
            const isRec = p.dischargeRecommendationStatus === 'recommended';

            return (
              <div
                key={p._id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {p.room}
                        </span>
                        <Link to={`/patients/${p._id}`} className="font-bold text-sm text-slate-900 hover:text-blue-600">
                          {p.fullName}
                        </Link>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        {p.patientId} • Age {p.age} • Admitted {new Date(p.admissionDate).toLocaleDateString()}
                      </p>
                    </div>

                    <Badge variant={elig.isEligible ? 'success' : 'warning'}>
                      {elig.isEligible ? '3-Day Fever-Free' : `${elig.feverFreeStreak}/3 Days`}
                    </Badge>
                  </div>

                  {/* Recommendation status banner */}
                  {isRec && (
                    <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>Clinically Recommended — Awaiting Admin Confirmation</span>
                      </span>
                    </div>
                  )}

                  {/* Streak explanation */}
                  <div className="mt-3 text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="font-semibold text-slate-800 mb-1">Status Narrative:</p>
                    {elig.explanation}
                  </div>

                  {/* Verified Streak Days Breakdown */}
                  {elig.streakDetails && elig.streakDetails.length > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 overflow-x-auto text-xs">
                      {elig.streakDetails.slice(-3).map((d: any) => (
                        <div
                          key={d.date}
                          className={`flex-1 p-2 rounded-lg border text-center font-semibold text-[11px] ${
                            d.status === 'fever_free'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : d.status === 'fever'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          <div>{d.date.split('-').slice(1).join('/')}</div>
                          <div className="font-bold">{d.hasReading ? `${d.temperatureCelsius}°C` : 'Missing'}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to={`/patients/${p._id}`}
                    className="text-xs font-semibold text-slate-600 hover:text-blue-600"
                  >
                    View Chart
                  </Link>

                  <div className="flex items-center gap-2">
                    {/* Doctor can recommend if qualified and not yet recommended */}
                    {hasRole('Doctor') && elig.isEligible && !isRec && (
                      <button
                        onClick={() => {
                          setSelectedCandidate(item);
                          setRecommendNotes('');
                          setRecommendModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Recommend Discharge</span>
                      </button>
                    )}

                    {/* Administrator can confirm discharge if recommended */}
                    {hasRole('Administrator') && isRec && (
                      <button
                        onClick={() => {
                          setSelectedCandidate(item);
                          setFinalOutcome('recovered');
                          setConfirmNotes('');
                          setConfirmModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm & Release Bed</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Recommend Modal */}
      <Modal
        isOpen={recommendModalOpen}
        onClose={() => setRecommendModalOpen(false)}
        title="Doctor Discharge Recommendation"
        description={`Clinical recommendation for ${selectedCandidate?.patient?.fullName}`}
      >
        <form onSubmit={handleRecommendSubmit} className="space-y-4">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
            <strong>Fever-Free Verification:</strong> Patient has achieved 3 consecutive verified days below 38.0°C.
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Physician Clearance Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={recommendNotes}
              onChange={(e) => setRecommendNotes(e.target.value)}
              placeholder="Vital signs reviewed, respiratory clearance confirmed, ready for release..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRecommendModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Submit Recommendation
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Discharge Modal (Admin) */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Administrator Final Discharge Confirmation"
        description={`Formal discharge review for ${selectedCandidate?.patient?.fullName} (${selectedCandidate?.patient?.room})`}
      >
        <form onSubmit={handleConfirmSubmit} className="space-y-4">
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
            Bed <strong>{selectedCandidate?.patient?.room}</strong> will be released and returned to available facility capacity immediately upon confirmation.
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Final Recorded Outcome <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFinalOutcome('recovered')}
                className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                  finalOutcome === 'recovered'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                Recovered / Cleared
              </button>
              <button
                type="button"
                onClick={() => setFinalOutcome('deceased')}
                className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                  finalOutcome === 'deceased'
                    ? 'bg-rose-50 border-rose-300 text-rose-800 ring-2 ring-rose-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                Deceased
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Administrative Record Notes
            </label>
            <textarea
              rows={3}
              value={confirmNotes}
              onChange={(e) => setConfirmNotes(e.target.value)}
              placeholder="Final administrative disposition..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Confirm Discharge & Release Bed
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
