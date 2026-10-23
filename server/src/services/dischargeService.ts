import mongoose from 'mongoose';
import { Patient, IPatient, FinalOutcome } from '../models/Patient.js';
import { TemperatureRecord } from '../models/TemperatureRecord.js';
import { FacilitySettings } from '../models/FacilitySettings.js';
import { getOrCreateSettings } from './patientService.js';
import { logAudit } from './auditService.js';
import { IUser } from '../models/User.js';
import { getTodayString, subtractDays } from '../utils/dateUtils.js';

export interface StreakDayDetail {
  date: string;
  hasReading: boolean;
  temperatureCelsius?: number;
  isFever?: boolean;
  status: 'fever_free' | 'fever' | 'missing';
}

export interface DischargeEligibilityResult {
  patientId: string;
  isEligible: boolean;
  feverFreeStreak: number;
  requiredStreak: number;
  ruleUsed: string;
  feverThreshold: number;
  streakDetails: StreakDayDetail[];
  explanation: string;
  canRecommend: boolean;
  recommendationStatus: string;
}

export const calculatePatientDischargeEligibility = async (
  patientId: string | mongoose.Types.ObjectId,
  targetDateStr?: string
): Promise<DischargeEligibilityResult> => {
  const settings = await getOrCreateSettings();
  const patient = await Patient.findById(patientId);

  if (!patient) {
    const error: any = new Error(`Patient with ID '${patientId}' not found.`);
    error.statusCode = 404;
    throw error;
  }

  const todayStr = targetDateStr || getTodayString(new Date(), settings.timezone);
  const feverThreshold = settings.feverThresholdCelsius;
  const requiredStreak = 3;

  // Fetch all temperature records for this patient sorted chronologically
  const records = await TemperatureRecord.find({
    patient: patient._id,
  }).sort({ measurementDate: 1 });

  const recordMap = new Map<string, number>();
  records.forEach((r) => {
    recordMap.set(r.measurementDate, r.temperatureCelsius);
  });

  // Check the last consecutive days up to today
  // For each day going backwards from today, verify reading
  const streakDetails: StreakDayDetail[] = [];
  let streak = 0;

  // We inspect a window of up to 5 days back to show recent context
  for (let i = 0; i < 5; i++) {
    const checkDate = subtractDays(todayStr, i);
    const temp = recordMap.get(checkDate);

    if (temp === undefined) {
      streakDetails.push({
        date: checkDate,
        hasReading: false,
        status: 'missing',
      });
      // Streak breaks if a day has no measurement
      if (i < 3 && streak === i) {
        // Missing required day breaks streak
      }
    } else if (temp >= feverThreshold) {
      streakDetails.push({
        date: checkDate,
        hasReading: true,
        temperatureCelsius: temp,
        isFever: true,
        status: 'fever',
      });
      // Fever breaks streak
      if (streak === i) {
        // Streak is 0
      }
    } else {
      streakDetails.push({
        date: checkDate,
        hasReading: true,
        temperatureCelsius: temp,
        isFever: false,
        status: 'fever_free',
      });
      if (streak === i) {
        streak++;
      }
    }
  }

  // Reverse so chronological in display
  streakDetails.reverse();

  // Alternative check: check if the most recent 3 consecutive calendar days (or consecutive recorded days) meet the criteria
  // Specifically: does patient have a 3-consecutive-calendar-day fever-free streak ending today or yesterday?
  let consecutiveCount = 0;
  for (let i = 0; i < 3; i++) {
    const day = subtractDays(todayStr, i);
    const temp = recordMap.get(day);
    if (temp !== undefined && temp < feverThreshold) {
      consecutiveCount++;
    } else {
      break;
    }
  }

  // Also check streak if ending yesterday (in case today's reading isn't taken yet or was taken earlier)
  let consecutiveCountEndingYesterday = 0;
  for (let i = 1; i <= 3; i++) {
    const day = subtractDays(todayStr, i);
    const temp = recordMap.get(day);
    if (temp !== undefined && temp < feverThreshold) {
      consecutiveCountEndingYesterday++;
    } else {
      break;
    }
  }

  const effectiveStreak = Math.max(consecutiveCount, consecutiveCountEndingYesterday);
  const isEligible = effectiveStreak >= requiredStreak && patient.status !== 'discharged';

  let explanation = '';
  if (patient.status === 'discharged') {
    explanation = 'Patient is already discharged.';
  } else if (isEligible) {
    explanation = `Qualified: Patient has achieved ${effectiveStreak} consecutive fever-free calendar days below ${feverThreshold}°C with verified measurements. Ready for clinical discharge recommendation and admin confirmation.`;
  } else {
    explanation = `In progress: Patient currently has a ${effectiveStreak} of ${requiredStreak} day fever-free streak below ${feverThreshold}°C. Note: Any missing daily measurement or fever reading resets the streak.`;
  }

  return {
    patientId: patient._id.toString(),
    isEligible,
    feverFreeStreak: effectiveStreak,
    requiredStreak,
    ruleUsed: settings.feverFreeEligibilityRule,
    feverThreshold,
    streakDetails,
    explanation,
    canRecommend: isEligible && patient.dischargeRecommendationStatus !== 'recommended',
    recommendationStatus: patient.dischargeRecommendationStatus,
  };
};

export const getDischargeCandidates = async () => {
  const activePatients = await Patient.find({
    status: { $in: ['admitted', 'discharge_recommended'] },
  }).sort({ room: 1 });

  const candidates: any[] = [];
  const inProgress: any[] = [];

  for (const patient of activePatients) {
    const eligibility = await calculatePatientDischargeEligibility(patient._id);
    const item = {
      patient,
      eligibility,
    };
    if (eligibility.isEligible || patient.status === 'discharge_recommended') {
      candidates.push(item);
    } else {
      inProgress.push(item);
    }
  }

  return {
    candidates,
    inProgress,
    candidateCount: candidates.length,
    inProgressCount: inProgress.length,
  };
};

export const recommendDischarge = async (
  patientId: string,
  actor: IUser,
  notes?: string
): Promise<IPatient> => {
  const patient = await Patient.findById(patientId);
  if (!patient) {
    const error: any = new Error(`Patient with ID '${patientId}' not found.`);
    error.statusCode = 404;
    throw error;
  }

  if (patient.status === 'discharged') {
    const error: any = new Error('Patient is already discharged.');
    error.statusCode = 400;
    throw error;
  }

  const eligibility = await calculatePatientDischargeEligibility(patient._id);

  const beforeState = patient.toObject();

  patient.status = 'discharge_recommended';
  patient.dischargeRecommendationStatus = 'recommended';
  patient.dischargeRecommendedAt = new Date();
  patient.dischargeRecommendedBy = actor._id as mongoose.Types.ObjectId;
  patient.dischargeRecommendationNotes =
    notes?.trim() || `Clinically recommended: ${eligibility.explanation}`;

  await patient.save();

  await logAudit({
    actor,
    action: 'DISCHARGE_RECOMMENDED',
    entityType: 'Patient',
    entityId: patient._id.toString(),
    reason: `Doctor ${actor.name} recommended discharge. Streak: ${eligibility.feverFreeStreak}/3 days. Notes: ${patient.dischargeRecommendationNotes}`,
    before: beforeState,
    after: patient.toObject(),
  });

  return patient;
};

export interface ConfirmDischargeInput {
  finalOutcome?: FinalOutcome;
  notes?: string;
  dischargeDate?: Date;
}

export const confirmDischarge = async (
  patientId: string,
  actor: IUser,
  input: ConfirmDischargeInput = {}
): Promise<IPatient> => {
  const patient = await Patient.findById(patientId);
  if (!patient) {
    const error: any = new Error(`Patient with ID '${patientId}' not found.`);
    error.statusCode = 404;
    throw error;
  }

  if (patient.status === 'discharged') {
    const error: any = new Error('Patient has already been discharged.');
    error.statusCode = 400;
    throw error;
  }

  const beforeState = patient.toObject();
  const dischargeDate = input.dischargeDate || new Date();
  const finalOutcome = input.finalOutcome || 'recovered';

  patient.status = 'discharged';
  patient.dischargeRecommendationStatus = 'confirmed';
  patient.dischargeDate = dischargeDate;
  patient.dischargeConfirmedBy = actor._id as mongoose.Types.ObjectId;
  patient.dischargeConfirmedAt = new Date();
  patient.finalOutcome = finalOutcome;
  if (input.notes) {
    patient.notes = patient.notes ? `${patient.notes}\n[Discharge]: ${input.notes}` : input.notes;
  }

  await patient.save();

  // Atomically decrement currentOccupancy in FacilitySettings
  await FacilitySettings.findOneAndUpdate(
    { currentOccupancy: { $gt: 0 } },
    { $inc: { currentOccupancy: -1 } }
  );

  await logAudit({
    actor,
    action: 'DISCHARGE_CONFIRMED',
    entityType: 'Patient',
    entityId: patient._id.toString(),
    reason: `Administrator ${actor.name} confirmed discharge with final outcome: ${finalOutcome}. Room ${patient.room} freed.`,
    before: beforeState,
    after: patient.toObject(),
  });

  return patient;
};
