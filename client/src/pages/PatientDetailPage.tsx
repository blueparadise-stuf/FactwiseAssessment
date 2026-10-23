import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Thermometer,
  Stethoscope,
  UserCheck,
  Calendar,
  BedDouble,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  History,
  Shield,
  Edit3,
  Plus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import api from '../services/api';
import { Patient, TemperatureRecord, DoctorVisit, DischargeEligibility } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/Common/Badge';
import { Modal } from '../components/Common/Modal';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';

export const PatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const toast = useToast();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [temperatures, setTemperatures] = useState<TemperatureRecord[]>([]);
  const [visits, setVisits] = useState<DoctorVisit[]>([]);
  const [eligibility, setEligibility] = useState<DischargeEligibility | null>(null);
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [tempModalOpen, setTempModalOpen] = useState(false);
  const [tempInput, setTempInput] = useState('');
  const [tempNotes, setTempNotes] = useState('');
  const [tempDate, setTempDate] = useState('');

  const [correctModalOpen, setCorrectModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<TemperatureRecord | null>(null);
  const [correctTempInput, setCorrectTempInput] = useState('');
  const [correctReason, setCorrectReason] = useState('');

  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [visitAssessment, setVisitAssessment] = useState('');
  const [visitTreatment, setVisitTreatment] = useState('');
  const [visitRecommendDischarge, setVisitRecommendDischarge] = useState(false);

  const [confirmDischargeModalOpen, setConfirmDischargeModalOpen] = useState(false);
  const [dischargeOutcome, setDischargeOutcome] = useState<'recovered' | 'deceased'>('recovered');
  const [dischargeNotes, setDischargeNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/patients/${id}/history`);
      if (res.data.success) {
        setPatient(res.data.patient);
        setTemperatures(res.data.temperatures);
        setVisits(res.data.doctorVisits);
        setEligibility(res.data.eligibility);
        setAuditHistory(res.data.auditHistory || []);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load patient history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchPatientData();
  }, [id]);

  // Handle Log Temperature
  const handleRecordTemperature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempInput || isNaN(Number(tempInput))) {
      toast.error('Please enter a valid temperature value.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/temperatures', {
        patientId: patient?._id,
        temperatureCelsius: Number(tempInput),
        measurementDate: tempDate || undefined,
        notes: tempNotes || undefined,
      });

      if (res.data.success) {
        toast.success(`Temperature ${tempInput}°C logged successfully!`);
        setTempModalOpen(false);
        setTempInput('');
        setTempNotes('');
        setTempDate('');
        fetchPatientData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record temperature.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Authorized Correction
  const handleCorrectTemperature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !correctTempInput || correctReason.length < 5) {
      toast.error('Please provide a valid temperature and minimum 5-character reason.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/temperatures/${selectedRecord._id}/corrections`, {
        newTemperatureCelsius: Number(correctTempInput),
        reason: correctReason.trim(),
      });

      if (res.data.success) {
        toast.success('Reading corrected with authorized audit entry.');
        setCorrectModalOpen(false);
        setSelectedRecord(null);
        setCorrectTempInput('');
        setCorrectReason('');
        fetchPatientData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Correction failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Record Doctor Round
  const handleRecordDoctorVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitAssessment.trim() || !visitTreatment.trim()) {
      toast.error('Please enter assessment and treatment decision.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/doctor-visits', {
        patientId: patient?._id,
        assessment: visitAssessment.trim(),
        treatmentDecision: visitTreatment.trim(),
        dischargeRecommendation: visitRecommendDischarge,
      });

      if (res.data.success) {
        toast.success('Doctor visit recorded successfully!');
        setVisitModalOpen(false);
        setVisitAssessment('');
        setVisitTreatment('');
        setVisitRecommendDischarge(false);
        fetchPatientData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to complete visit.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Confirm Discharge
  const handleConfirmDischarge = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post(`/discharges/${patient?._id}/confirm`, {
        finalOutcome: dischargeOutcome,
        notes: dischargeNotes.trim(),
      });

      if (res.data.success) {
        toast.success(`Discharge confirmed! Bed ${patient?.room} is now released.`);
        setConfirmDischargeModalOpen(false);
        fetchPatientData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to confirm discharge.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Quick Doctor Recommend
  const handleRecommendDischarge = async () => {
    try {
      const res = await api.post(`/discharges/${patient?._id}/recommend`, {
        notes: 'Clinical recommendation: 3 consecutive fever-free days verified.',
      });
      if (res.data.success) {
        toast.success('Discharge recommended. Awaiting Administrator confirmation.');
        fetchPatientData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to recommend discharge.');
    }
  };

  if (loading && !patient) {
    return <LoadingSpinner size="lg" label="Loading patient record..." />;
  }

  if (!patient) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-sm text-slate-500">Patient record not found.</p>
        <button
          onClick={() => navigate('/patients')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold"
        >
          Return to Patients
        </button>
      </div>
    );
  }

  const chartData = temperatures
    .slice()
    .reverse()
    .map((t) => ({
      date: t.measurementDate,
      temp: t.temperatureCelsius,
      fever: t.isFever,
    }));

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/patients')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {patient.fullName}
              </h1>
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                {patient.patientId}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Room: <strong className="text-slate-800 font-mono">{patient.room}</strong> • Admitted:{' '}
              {new Date(patient.admissionDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Action Buttons based on User Role */}
        <div className="flex items-center gap-2 flex-wrap">
          {hasRole('Nurse', 'Doctor', 'Administrator') && patient.status !== 'discharged' && (
            <button
              onClick={() => setTempModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Thermometer className="w-4 h-4" />
              <span>Record Temp</span>
            </button>
          )}

          {hasRole('Doctor') && patient.status !== 'discharged' && (
            <button
              onClick={() => setVisitModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Stethoscope className="w-4 h-4" />
              <span>Doctor Visit</span>
            </button>
          )}

          {hasRole('Doctor') &&
            patient.status === 'admitted' &&
            eligibility?.isEligible && (
              <button
                onClick={handleRecommendDischarge}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                <UserCheck className="w-4 h-4" />
                <span>Recommend Discharge</span>
              </button>
            )}

          {hasRole('Administrator') &&
            patient.status !== 'discharged' &&
            patient.dischargeRecommendationStatus === 'recommended' && (
              <button
                onClick={() => setConfirmDischargeModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Discharge</span>
              </button>
            )}
        </div>
      </div>

      {/* Patient Summary Header Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</span>
          <div className="mt-1">
            <Badge variant={patient.status === 'admitted' ? 'info' : patient.status === 'discharge_recommended' ? 'warning' : 'neutral'}>
              {patient.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Age / Comorbidities</span>
          <p className="text-sm font-bold text-slate-900 mt-1">{patient.age} years</p>
        </div>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Bed Designation</span>
          <p className="text-sm font-bold font-mono text-slate-900 mt-1">{patient.room}</p>
        </div>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Final Outcome</span>
          <div className="mt-1">
            <Badge variant={patient.finalOutcome === 'recovered' ? 'success' : patient.finalOutcome === 'deceased' ? 'danger' : 'neutral'}>
              {patient.finalOutcome}
            </Badge>
          </div>
        </div>
      </div>

      {/* Discharge Eligibility Tracker Card */}
      {eligibility && (
        <div
          className={`p-6 rounded-2xl border ${
            eligibility.isEligible
              ? 'bg-emerald-50/70 border-emerald-200'
              : 'bg-white border-slate-200/80'
          } shadow-xs`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Clinical Cure & Discharge Eligibility Tracker
                </span>
                {eligibility.isEligible ? (
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                    ELIGIBLE (3-DAY FEVER-FREE)
                  </span>
                ) : (
                  <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                    IN PROGRESS ({eligibility.feverFreeStreak}/3 DAYS)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl">{eligibility.explanation}</p>
            </div>

            {/* Streak Counter Visual */}
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((step) => {
                const reached = eligibility.feverFreeStreak >= step;
                return (
                  <div
                    key={step}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-colors ${
                      reached
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    Day {step}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Visual Day-by-Day Checklist */}
          {eligibility.streakDetails && eligibility.streakDetails.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-5 gap-2">
              {eligibility.streakDetails.map((day) => (
                <div
                  key={day.date}
                  className={`p-2.5 rounded-xl border text-xs ${
                    day.status === 'fever_free'
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : day.status === 'fever'
                      ? 'bg-rose-50 text-rose-900 border-rose-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>{day.date}</span>
                    {day.status === 'fever_free' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    {day.status === 'fever' && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                  </div>
                  <div className="mt-1 font-semibold">
                    {day.hasReading ? `${day.temperatureCelsius}°C` : 'No reading'}
                  </div>
                  <div className="text-[10px] opacity-75 capitalize">{day.status.replace('_', ' ')}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Temperature Trend Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Temperature Trend (°Celsius)</h3>
            <p className="text-xs text-slate-400">
              Reference fever threshold at 38.0°C. Readings at or above threshold reset qualification streak.
            </p>
          </div>
        </div>

        <div className="h-60 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  domain={[35.0, 41.0]}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  unit="°C"
                />
                <Tooltip
                  formatter={(val: any) => [`${val}°C`, 'Temperature']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <ReferenceLine
                  y={38.0}
                  stroke="#f43f5e"
                  strokeDasharray="4 4"
                  label={{ value: 'Fever Threshold (38.0°C)', fill: '#f43f5e', fontSize: 11 }}
                />
                <Line
                  type="monotone"
                  dataKey="temp"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No temperature records logged yet.
            </div>
          )}
        </div>
      </div>

      {/* Two Columns: Temperature Records & Doctor Visits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Temperature Records Table */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-amber-500" />
              <span>Daily Temperature Records</span>
            </h3>
            {hasRole('Nurse', 'Doctor', 'Administrator') && patient.status !== 'discharged' && (
              <button
                onClick={() => setTempModalOpen(true)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Reading</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider sticky top-0 bg-white">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Reading</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Nurse</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {temperatures.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50">
                    <td className="py-2.5">{t.measurementDate}</td>
                    <td className="py-2.5 font-bold font-mono">
                      <span className={t.isFever ? 'text-rose-600' : 'text-slate-800'}>
                        {t.temperatureCelsius}°C
                      </span>
                    </td>
                    <td className="py-2.5">
                      {t.isFever ? (
                        <Badge variant="danger" size="sm">Fever</Badge>
                      ) : t.isUnusual ? (
                        <Badge variant="warning" size="sm">Unusual</Badge>
                      ) : (
                        <Badge variant="success" size="sm">Normal</Badge>
                      )}
                    </td>
                    <td className="py-2.5 text-slate-500 truncate max-w-[100px]">
                      {t.recordedBy?.name || 'Nurse'}
                    </td>
                    <td className="py-2.5 text-right">
                      {hasRole('Nurse', 'Administrator') && (
                        <button
                          onClick={() => {
                            setSelectedRecord(t);
                            setCorrectTempInput(String(t.temperatureCelsius));
                            setCorrectReason('');
                            setCorrectModalOpen(true);
                          }}
                          className="text-[11px] font-semibold text-slate-600 hover:text-blue-600 inline-flex items-center gap-1"
                          title="Authorized Correction"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Correct</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Doctor Visits History */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-blue-600" />
              <span>Doctor Rounds & Assessments</span>
            </h3>
            {hasRole('Doctor') && patient.status !== 'discharged' && (
              <button
                onClick={() => setVisitModalOpen(true)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Conduct Visit</span>
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {visits.length > 0 ? (
              visits.map((v) => (
                <div key={v._id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="font-bold text-slate-800">{v.visitDate}</span>
                    <span className="text-[11px]">By Dr. {v.doctor?.name || 'Staff Physician'}</span>
                  </div>
                  <p className="font-medium text-slate-700 leading-relaxed mb-1.5">
                    <strong>Assessment:</strong> {v.assessment}
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    <strong>Treatment:</strong> {v.treatmentDecision}
                  </p>
                  {v.dischargeRecommendation && (
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Discharge Recommended in this visit</span>
                    </div>
                  )}
                  {!v.temperatureRecordedBeforeVisit && (
                    <div className="mt-1.5 text-[10px] text-amber-700 flex items-center gap-1 font-semibold">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Note: Round conducted before morning temperature recorded</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No doctor visits recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audit History (Administrator Only) */}
      {hasRole('Administrator') && auditHistory.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>Audit Trail & Record Corrections (HIPAA/Admin Compliance)</span>
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {auditHistory.map((a: any) => (
              <div key={a._id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">{a.action}</span>
                  <span className="text-slate-500 ml-2">{a.reason || 'Record updated'}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {a.actorName} • {new Date(a.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: Log Temperature */}
      <Modal
        isOpen={tempModalOpen}
        onClose={() => setTempModalOpen(false)}
        title="Record Daily Temperature Measurement"
        description={`Record primary daily reading for ${patient.fullName} (${patient.room})`}
      >
        <form onSubmit={handleRecordTemperature} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Temperature in Celsius (°C) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="34.0"
              max="43.0"
              value={tempInput}
              onChange={(e) => setTempInput(e.target.value)}
              placeholder="e.g. 36.8"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">Plausible clinical range: 34.0°C to 43.0°C. Fever threshold: 38.0°C.</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Measurement Date (Default: Today)
            </label>
            <input
              type="date"
              value={tempDate}
              onChange={(e) => setTempDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Clinical Notes (Optional)
            </label>
            <input
              type="text"
              value={tempNotes}
              onChange={(e) => setTempNotes(e.target.value)}
              placeholder="e.g. Normal morning reading, resting comfortably"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setTempModalOpen(false)}
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

      {/* MODAL 2: Authorized Correction */}
      <Modal
        isOpen={correctModalOpen}
        onClose={() => setCorrectModalOpen(false)}
        title="Authorized Clinical Record Correction"
        description="Amending a previously saved temperature requires an audit reason and preserves history."
      >
        <form onSubmit={handleCorrectTemperature} className="space-y-4">
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
            Original Reading on <strong>{selectedRecord?.measurementDate}</strong>:{' '}
            <span className="font-mono font-bold">{selectedRecord?.temperatureCelsius}°C</span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Corrected Value (°C) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="34.0"
              max="43.0"
              value={correctTempInput}
              onChange={(e) => setCorrectTempInput(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Authorized Clinical Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={correctReason}
              onChange={(e) => setCorrectReason(e.target.value)}
              placeholder="e.g. Typographical error during morning entry; re-checked tympanic thermometer log"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
            />
            <p className="text-[11px] text-slate-400 mt-1">Minimum 5 characters required for compliance.</p>
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
              Submit Audited Correction
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Doctor Round */}
      <Modal
        isOpen={visitModalOpen}
        onClose={() => setVisitModalOpen(false)}
        title="Record Daily Doctor Round"
        description={`Record clinical assessment and daily treatment for ${patient.fullName}`}
      >
        <form onSubmit={handleRecordDoctorVisit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Clinical Assessment <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={visitAssessment}
              onChange={(e) => setVisitAssessment(e.target.value)}
              placeholder="General appearance, respiratory condition, auscultation, symptoms..."
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Treatment & Care Decision <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={visitTreatment}
              onChange={(e) => setVisitTreatment(e.target.value)}
              placeholder="e.g. Continue supportive hydration, nebulizer as needed"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
            />
          </div>

          {eligibility?.isEligible && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2">
              <input
                type="checkbox"
                id="recommendDischarge"
                checked={visitRecommendDischarge}
                onChange={(e) => setVisitRecommendDischarge(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <label htmlFor="recommendDischarge" className="text-xs font-bold text-emerald-900 cursor-pointer">
                Recommend Patient for Discharge (Fever-free streak qualified)
              </label>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setVisitModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Complete Round
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: Confirm Discharge (Admin) */}
      <Modal
        isOpen={confirmDischargeModalOpen}
        onClose={() => setConfirmDischargeModalOpen(false)}
        title="Confirm Formal Patient Discharge"
        description="Completing this administrative review will release room/bed availability."
      >
        <form onSubmit={handleConfirmDischarge} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Recorded Final Clinical Outcome <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDischargeOutcome('recovered')}
                className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                  dischargeOutcome === 'recovered'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                Recovered / Cleared
              </button>
              <button
                type="button"
                onClick={() => setDischargeOutcome('deceased')}
                className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                  dischargeOutcome === 'deceased'
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
              Administrative Discharge Notes
            </label>
            <textarea
              rows={3}
              value={dischargeNotes}
              onChange={(e) => setDischargeNotes(e.target.value)}
              placeholder="Confirmation details, transfer paperwork, or discharge summary..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmDischargeModalOpen(false)}
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
