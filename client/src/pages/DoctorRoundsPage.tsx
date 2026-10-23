import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Thermometer,
  BedDouble,
  FileText,
  UserCheck,
  RefreshCw,
  Plus,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/Common/Badge';
import { Modal } from '../components/Common/Modal';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { EmptyState } from '../components/Common/EmptyState';

export const DoctorRoundsPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const toast = useToast();

  const [queue, setQueue] = useState<any[]>([]);
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterPending, setFilterPending] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Round modal
  const [roundModalOpen, setRoundModalOpen] = useState(false);
  const [selectedPatientItem, setSelectedPatientItem] = useState<any | null>(null);
  const [assessment, setAssessment] = useState('');
  const [treatment, setTreatment] = useState('');
  const [recommendDischarge, setRecommendDischarge] = useState(false);
  const [isAdditionalVisit, setIsAdditionalVisit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchRoundsQueue = async () => {
    try {
      setLoading(true);
      const res = await api.get('/doctor-visits');
      if (res.data.success) {
        setTargetDate(res.data.targetDate);
        setQueue(res.data.queue);
      }
    } catch (err) {
      toast.error('Failed to load doctor rounds queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoundsQueue();
  }, []);

  const handleRoundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessment.trim() || !treatment.trim()) {
      toast.error('Assessment and treatment plan are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/doctor-visits', {
        patientId: selectedPatientItem?.patient?._id,
        assessment: assessment.trim(),
        treatmentDecision: treatment.trim(),
        dischargeRecommendation: recommendDischarge,
        isPrimaryDailyVisit: !isAdditionalVisit,
      });

      if (res.data.success) {
        toast.success(`Doctor round completed for ${selectedPatientItem?.patient?.fullName}.`);
        setRoundModalOpen(false);
        setAssessment('');
        setTreatment('');
        setRecommendDischarge(false);
        setIsAdditionalVisit(false);
        fetchRoundsQueue();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record visit.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredQueue = queue.filter((item) => {
    if (filterPending && item.hasDoctorVisitToday) return false;
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Daily Doctor Rounds & Clinical Assessments
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Conduct bedside visits for date: <strong>{targetDate || 'Today'}</strong>. Alerts when morning vitals are pending without blocking emergency care.
          </p>
        </div>

        <button
          onClick={fetchRoundsQueue}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Rounds</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterPending(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterPending
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Pending Rounds ({queue.filter((q) => !q.hasDoctorVisitToday).length})
          </button>
          <button
            onClick={() => setFilterPending(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              !filterPending
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Patients ({queue.length})
          </button>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patient, bed..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          />
        </div>
      </div>

      {/* Rounds Queue List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2">
            <LoadingSpinner size="md" label="Loading doctor rounds..." />
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="col-span-2">
            <EmptyState
              icon={Stethoscope}
              title={filterPending ? 'All doctor rounds completed!' : 'No patients in rounds queue'}
              description={
                filterPending
                  ? 'All admitted patients have been visited by an attending physician for today.'
                  : 'No active patients currently assigned to quarantine beds.'
              }
            />
          </div>
        ) : (
          filteredQueue.map((item) => {
            const p = item.patient;
            const hasVisit = item.hasDoctorVisitToday;
            const hasTemp = item.hasTemperatureToday;

            return (
              <div
                key={p._id}
                className={`p-5 rounded-2xl border transition-all ${
                  hasVisit
                    ? 'bg-slate-50/60 border-slate-200/80 opacity-90'
                    : 'bg-white border-slate-200/80 shadow-xs hover:border-blue-300'
                }`}
              >
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
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {p.patientId} • Age {p.age} • Admitted {new Date(p.admissionDate).toLocaleDateString()}
                    </p>
                  </div>

                  <Badge variant={hasVisit ? 'success' : 'warning'}>
                    {hasVisit ? 'Round Done' : 'Pending Visit'}
                  </Badge>
                </div>

                {/* Vitals Warning & Coordination Badge */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-slate-400 shrink-0" />
                    {hasTemp ? (
                      <span className="font-medium text-slate-700">
                        Today's Temp:{' '}
                        <strong className={item.latestTemperature?.isFever ? 'text-rose-600' : 'text-slate-900'}>
                          {item.latestTemperature?.temperatureCelsius}°C
                        </strong>
                      </span>
                    ) : (
                      <span className="text-amber-700 font-semibold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Temp Not Recorded Today</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Visit summary if already done */}
                {hasVisit && item.doctorVisit && (
                  <div className="mt-3 p-3 bg-white rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
                    <p>
                      <strong>Assessment:</strong> {item.doctorVisit.assessment}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Completed by Dr. {item.doctorVisit.doctor?.name || 'Physician'} at{' '}
                      {new Date(item.doctorVisit.visitedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to={`/patients/${p._id}`}
                    className="text-xs font-semibold text-slate-600 hover:text-blue-600"
                  >
                    View History
                  </Link>

                  {hasRole('Doctor') && (
                    <button
                      onClick={() => {
                        setSelectedPatientItem(item);
                        setAssessment('');
                        setTreatment('');
                        setRecommendDischarge(false);
                        setIsAdditionalVisit(hasVisit);
                        setRoundModalOpen(true);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-colors ${
                        hasVisit
                          ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>{hasVisit ? 'Additional Visit' : 'Conduct Round'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Doctor Round Modal */}
      <Modal
        isOpen={roundModalOpen}
        onClose={() => setRoundModalOpen(false)}
        title={isAdditionalVisit ? 'Record Additional Bedside Visit' : 'Complete Primary Daily Round'}
        description={`Clinical visit for ${selectedPatientItem?.patient?.fullName} (${selectedPatientItem?.patient?.room})`}
      >
        <form onSubmit={handleRoundSubmit} className="space-y-4">
          {/* Temperature Coordination Warning Notice */}
          {!selectedPatientItem?.hasTemperatureToday && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Coordination Warning:</span> Morning temperature has not yet been logged by nursing for this patient today.
                <p className="mt-0.5 text-amber-700">Urgent bedside care is not blocked—you may proceed with this clinical check-in.</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Clinical Assessment <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={assessment}
              onChange={(e) => setAssessment(e.target.value)}
              placeholder="Physical findings, chest auscultation, respiratory rate, cognitive alertness, symptom progression..."
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Treatment & Care Orders <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
              placeholder="e.g. Continue symptomatic therapy, monitor O2 saturation, adjust antipyretics"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
            <input
              type="checkbox"
              id="recommendDischargeCheck"
              checked={recommendDischarge}
              onChange={(e) => setRecommendDischarge(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="recommendDischargeCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
              Recommend for Clinical Discharge (Initiate review for 3-day fever-free recovery)
            </label>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRoundModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Sign & Save Visit Notes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
