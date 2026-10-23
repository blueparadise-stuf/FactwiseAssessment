import mongoose from 'mongoose';
import { TemperatureRecord, ITemperatureRecord } from '../models/TemperatureRecord.js';
import { Patient } from '../models/Patient.js';
import { FacilitySettings } from '../models/FacilitySettings.js';
import { getOrCreateSettings } from './patientService.js';
import { logAudit } from './auditService.js';
import { IUser } from '../models/User.js';
import { getTodayString } from '../utils/dateUtils.js';

export interface RecordTemperatureInput {
  patientId: string;
  temperatureCelsius: number;
  measurementDate?: string; // YYYY-MM-DD
  measuredAt?: Date;
  notes?: string;
  flaggedForReview?: boolean;
  flagReason?: string;
}

export const recordTemperature = async (
  input: RecordTemperatureInput,
  actor: IUser
): Promise<ITemperatureRecord> => {
  const settings = await getOrCreateSettings();

  // Validate patient existence and status
  const patient = await Patient.findById(input.patientId);
  if (!patient) {
    const error: any = new Error(`Patient with ID '${input.patientId}' not found.`);
    error.statusCode = 404;
    throw error;
  }

  if (patient.status === 'discharged') {
    const error: any = new Error('Cannot record temperature for a discharged patient.');
    error.statusCode = 400;
    throw error;
  }

  // Determine measurementDate using facility timezone
  const measurementDate = input.measurementDate || getTodayString(new Date(), settings.timezone);

  // Validate temperature range
  const temp = Number(input.temperatureCelsius);
  if (isNaN(temp) || temp < 34.0 || temp > 43.0) {
    const error: any = new Error(
      `Invalid temperature: ${input.temperatureCelsius}°C. Must be a plausible physiological value between 34.0°C and 43.0°C.`
    );
    error.statusCode = 400;
    throw error;
  }

  // Check if primary measurement already exists for this patient on this date
  const existingRecord = await TemperatureRecord.findOne({
    patient: patient._id,
    measurementDate,
  });

  if (existingRecord) {
    const error: any = new Error(
      `A primary daily temperature reading has already been recorded for patient ${patient.fullName} (${patient.patientId}) on ${measurementDate} (${existingRecord.temperatureCelsius}°C). Use the authorized correction workflow to amend this reading.`
    );
    error.statusCode = 409;
    throw error;
  }

  // Check clinical flags
  const feverThreshold = settings.feverThresholdCelsius;
  const isFever = temp >= feverThreshold;
  const isUnusual = temp >= 38.5 || temp <= 35.5;

  const record = await TemperatureRecord.create({
    patient: patient._id,
    measurementDate,
    measuredAt: input.measuredAt || new Date(),
    temperatureCelsius: temp,
    recordedBy: actor._id,
    notes: input.notes?.trim(),
    isFever,
    isUnusual,
    flaggedForReview: Boolean(input.flaggedForReview || isUnusual),
    flagReason: input.flagReason || (isUnusual ? `Unusual reading: ${temp}°C` : undefined),
    correctionHistory: [],
  });

  await logAudit({
    actor,
    action: 'TEMPERATURE_RECORDED',
    entityType: 'TemperatureRecord',
    entityId: record._id.toString(),
    reason: `Recorded ${temp}°C on ${measurementDate}${isFever ? ' (FEVER)' : ''}${isUnusual ? ' (UNUSUAL)' : ''}`,
    after: record.toObject(),
  });

  return record;
};

export interface CorrectTemperatureInput {
  newTemperatureCelsius: number;
  reason: string;
}

export const correctTemperatureRecord = async (
  recordId: string,
  input: CorrectTemperatureInput,
  actor: IUser
): Promise<ITemperatureRecord> => {
  const settings = await getOrCreateSettings();

  const record = await TemperatureRecord.findById(recordId).populate('patient');
  if (!record) {
    const error: any = new Error(`Temperature record with ID '${recordId}' not found.`);
    error.statusCode = 404;
    throw error;
  }

  if (!input.reason || input.reason.trim().length < 5) {
    const error: any = new Error('A detailed reason (minimum 5 characters) is required for correcting a medical record.');
    error.statusCode = 400;
    throw error;
  }

  const newTemp = Number(input.newTemperatureCelsius);
  if (isNaN(newTemp) || newTemp < 34.0 || newTemp > 43.0) {
    const error: any = new Error(
      `Invalid temperature: ${input.newTemperatureCelsius}°C. Must be between 34.0°C and 43.0°C.`
    );
    error.statusCode = 400;
    throw error;
  }

  const beforeState = record.toObject();
  const previousTemp = record.temperatureCelsius;

  // Append to correction history
  record.correctionHistory.push({
    previousTemperature: previousTemp,
    correctedBy: actor._id as mongoose.Types.ObjectId,
    correctedAt: new Date(),
    reason: input.reason.trim(),
  });

  // Update current record
  record.temperatureCelsius = newTemp;
  const feverThreshold = settings.feverThresholdCelsius;
  record.isFever = newTemp >= feverThreshold;
  record.isUnusual = newTemp >= 38.5 || newTemp <= 35.5;

  await record.save();

  await logAudit({
    actor,
    action: 'TEMPERATURE_CORRECTED',
    entityType: 'TemperatureRecord',
    entityId: record._id.toString(),
    reason: `Corrected temperature from ${previousTemp}°C to ${newTemp}°C. Reason: ${input.reason.trim()}`,
    before: beforeState,
    after: record.toObject(),
  });

  return record;
};

export const getPatientTemperatures = async (patientId: string): Promise<ITemperatureRecord[]> => {
  return TemperatureRecord.find({ patient: patientId })
    .sort({ measurementDate: -1, measuredAt: -1 })
    .populate('recordedBy', 'name email role')
    .populate('correctionHistory.correctedBy', 'name email role');
};

export const getPendingTemperaturePatients = async (dateStr?: string) => {
  const settings = await getOrCreateSettings();
  const targetDate = dateStr || getTodayString(new Date(), settings.timezone);

  // All active patients
  const activePatients = await Patient.find({
    status: { $in: ['admitted', 'discharge_recommended'] },
  }).sort({ room: 1 });

  // Patients who already have a reading for targetDate
  const recordedRecords = await TemperatureRecord.find({
    measurementDate: targetDate,
    patient: { $in: activePatients.map((p) => p._id) },
  }).select('patient temperatureCelsius isFever isUnusual measuredAt');

  const recordedPatientMap = new Map();
  recordedRecords.forEach((r) => {
    recordedPatientMap.set(r.patient.toString(), r);
  });

  const pending: any[] = [];
  const completed: any[] = [];

  activePatients.forEach((patient) => {
    const existing = recordedPatientMap.get(patient._id.toString());
    if (existing) {
      completed.push({
        patient,
        measurementDate: targetDate,
        record: existing,
        status: 'completed',
      });
    } else {
      pending.push({
        patient,
        measurementDate: targetDate,
        status: 'pending',
      });
    }
  });

  return {
    targetDate,
    pending,
    completed,
    totalActive: activePatients.length,
    pendingCount: pending.length,
    completedCount: completed.length,
  };
};
