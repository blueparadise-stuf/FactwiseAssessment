import React, { useEffect, useState } from 'react';
import { Settings, Shield, Sliders, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';

export const SettingsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const toast = useToast();

  const [settings, setSettings] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [facilityName, setFacilityName] = useState('');
  const [feverThreshold, setFeverThreshold] = useState(38.0);
  const [timezone, setTimezone] = useState('UTC');
  const [eligibilityRule, setEligibilityRule] = useState('THREE_FULL_CALENDAR_DAYS');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      if (res.data.success) {
        setSettings(res.data.settings);
        setFacilityName(res.data.settings.facilityName);
        setFeverThreshold(res.data.settings.feverThresholdCelsius);
        setTimezone(res.data.settings.timezone);
        setEligibilityRule(res.data.settings.feverFreeEligibilityRule);
      }
    } catch (err) {
      toast.error('Failed to load facility settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasRole('Administrator')) {
      toast.error('Only administrators can modify facility parameters.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.patch('/settings', {
        facilityName: facilityName.trim(),
        feverThresholdCelsius: Number(feverThreshold),
        timezone: timezone.trim(),
        feverFreeEligibilityRule: eligibilityRule,
      });

      if (res.data.success) {
        toast.success('Facility operational settings updated.');
        fetchSettings();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !settings) {
    return <LoadingSpinner size="md" label="Loading facility settings..." />;
  }

  const isAdmin = hasRole('Administrator');

  return (
    <div className="max-w-3xl space-y-6">
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Facility Parameters & Clinical Configurations
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configurable facility thresholds, operational capacity, and timezone settings
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Facility Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Facility Name
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              value={facilityName}
              onChange={(e) => setFacilityName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 disabled:opacity-75"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total Bed Capacity (Fixed at 74) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Total Quarantine Capacity
              </label>
              <div className="px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold font-mono text-slate-700 flex items-center justify-between">
                <span>74 Beds (Hardcoded System Limit)</span>
                <span className="text-[11px] text-blue-600 font-semibold">Fixed</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Atomically enforced on backend patient admission.</p>
            </div>

            {/* Facility Timezone */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Facility Local Timezone
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="e.g. UTC, Asia/Kolkata, America/New_York"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 disabled:opacity-75"
              />
              <p className="text-[11px] text-slate-400 mt-1">Defines boundary for primary daily temperature records.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Clinical Definition of Cure & Fever</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Fever Threshold */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Fever Threshold (°Celsius)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="35.0"
                  max="42.0"
                  disabled={!isAdmin}
                  value={feverThreshold}
                  onChange={(e) => setFeverThreshold(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 disabled:opacity-75"
                />
                <p className="text-[11px] text-slate-400 mt-1">Readings ≥ this threshold reset the fever-free streak.</p>
              </div>

              {/* Eligibility Rule Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Fever-Free Days Interpretation
                </label>
                <select
                  disabled={!isAdmin}
                  value={eligibilityRule}
                  onChange={(e) => setEligibilityRule(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 disabled:opacity-75"
                >
                  <option value="THREE_FULL_CALENDAR_DAYS">Three Full Calendar Days (Default Approved)</option>
                  <option value="ROLLING_72_HOURS">Rolling 72-Hour Continuous Window</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Requires verified daily measurements with no missing records.</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
            <strong>Clinical Governance Notice:</strong> The clinical team must approve the operational definition of fever and the exact interpretation of three full fever-free days before production rollout.
          </div>

          {isAdmin && (
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Configurations</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
