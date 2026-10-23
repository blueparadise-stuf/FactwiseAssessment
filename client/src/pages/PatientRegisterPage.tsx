import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { UserPlus, ArrowLeft, BedDouble, AlertCircle, ShieldCheck } from 'lucide-react';

export const PatientRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [room, setRoom] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [capacityInfo, setCapacityInfo] = useState<{ occupied: number; total: number } | null>(null);

  useEffect(() => {
    const fetchCapacity = async () => {
      try {
        const res = await api.get('/dashboard/summary');
        if (res.data.success) {
          setCapacityInfo({
            occupied: res.data.summary.facility.occupiedBeds,
            total: res.data.summary.facility.capacity,
          });
        }
      } catch (err) {
        console.warn('Failed to load capacity:', err);
      }
    };
    fetchCapacity();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || age === '' || !room.trim()) {
      toast.error('Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/patients', {
        fullName: fullName.trim(),
        age: Number(age),
        room: room.trim().toUpperCase(),
        notes: notes.trim() || undefined,
      });

      if (res.data.success) {
        toast.success(`Patient admitted successfully to bed ${room.toUpperCase()}!`);
        navigate(`/patients/${res.data.patient._id}`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to admit patient. Please check bed assignment.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAtCapacity = capacityInfo ? capacityInfo.occupied >= capacityInfo.total : false;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/patients')}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Patient Admission & Bed Assignment
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admit an incoming quarantined individual and allocate a designated bed
          </p>
        </div>
      </div>

      {/* Facility Capacity Indicator Banner */}
      {capacityInfo && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
            isAtCapacity
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <BedDouble className="w-4 h-4 text-blue-600" />
            <span>
              Facility Occupancy: <strong>{capacityInfo.occupied} / {capacityInfo.total} beds occupied</strong>
            </span>
          </div>
          <span>
            {isAtCapacity ? (
              <span className="text-rose-600 font-bold">CAPACITY REACHED</span>
            ) : (
              <span>{capacityInfo.total - capacityInfo.occupied} beds available</span>
            )}
          </span>
        </div>
      )}

      {isAtCapacity && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            The facility is currently at maximum capacity (74 beds). New admissions cannot be confirmed until an existing patient is formally discharged.
          </span>
        </div>
      )}

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Full Legal Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Ramesh Verma"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Age */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Age (Years) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="130"
                value={age}
                onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 42"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-colors"
              />
            </div>

            {/* Room / Bed */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Room / Bed Designation <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="e.g. BED-18 or RM-104-A"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-colors"
              />
              <p className="text-[11px] text-slate-400 mt-1">Must be an unoccupied bed identifier.</p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Admission Clinical & Administrative Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Initial symptoms, known comorbidities, exposure history, or dietary considerations..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-colors"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/patients')}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isAtCapacity}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Confirm Admission</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
