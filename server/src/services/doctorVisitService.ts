import mongoose from 'mongoose';
import { DoctorVisit, IDoctorVisit } from '../models/DoctorVisit.js';
import { Patient } from '../models/Patient.js';
import { TemperatureRecord } from '../models/TemperatureRecord.js';
import { getOrCreateSettings } from './patientService.js';
import { logAudit } from './auditService.js';
import { IUser } from '../models/User.js';
import { getTodayString } from '../utils/dateUtils.js';

export interface CreateDoctorVisitInput {
  patientId: string;
  visitDate?: string;
  visitedAt?: Date;
  assessment: string;
  treatmentDecision: string;
  dischargeRecommendation?: boolean;
  recommendationReason?: string;
  isPrimaryDailyVisit?: boolean;
}

export const recordDoctorVisit = async (
  input: CreateDoctorVisitInput,
  actor: IUser
): Promise<IDoctorVisit> => {
  const settings = await getOrCreateSettings();

  const patient = await Patient.findById(input.patientId);
  if (!patient) {
    const error: any = new Error(`Patient with ID '${input.patientId}' not found.`);
    error.statusCode = 404;
    throw error;
  }

  if (patient.status === 'discharged') {
    const error: any = new Error('Cannot conduct rounds or visits on a discharged patient.');
    error.statusCode = 400;
    throw error;
  }

  const visitDate = input.visitDate || getTodayString(new Date(), settings.timezone);
  const isPrimary = input.isPrimaryDailyVisit !== false; // Default true

  // Check if primary daily visit was already completed today
  if (isPrimary) {
    const existingVisit = await DoctorVisit.findOne({
      patient: patient._id,
      visitDate,
      isPrimaryDailyVisit: true,
    });

    if (existingVisit) {
      const error: any = new Error(
        `Primary doctor round for ${visitDate} has already been completed by Dr. ${existingVisit.doctor} at ${existingVisit.visitedAt}. If this is an additional urgent check-in, please record it as an additional clinical visit.`
      );
      error.statusCode = 409;
      throw error;
    }
  }

  // Check whether daily temperature has been recorded before this visit
  const todayTemp = await TemperatureRecord.findOne({
    patient: patient._id,
    measurementDate: visitDate,
  });

  const visit = await DoctorVisit.create({
    patient: patient._id,
    visitDate,
    visitedAt: input.visitedAt || new Date(),
    doctor: actor._id,
    assessment: input.assessment.trim(),
    treatmentDecision: input.treatmentDecision.trim(),
    dischargeRecommendation: Boolean(input.dischargeRecommendation),
    recommendationReason: input.recommendationReason?.trim(),
    temperatureRecordedBeforeVisit: Boolean(todayTemp),
    temperatureAtVisit: todayTemp ? todayTemp.temperatureCelsius : undefined,
    isPrimaryDailyVisit: isPrimary,
  });

  // If doctor recommended discharge, update patient recommendation status
  if (input.dischargeRecommendation) {
    patient.status = 'discharge_recommended';
    patient.dischargeRecommendationStatus = 'recommended';
    patient.dischargeRecommendedAt = new Date();
    patient.dischargeRecommendedBy = actor._id as mongoose.Types.ObjectId;
    patient.dischargeRecommendationNotes = input.recommendationReason || input.assessment;
    await patient.save();
  }

  await logAudit({
    actor,
    action: 'DOCTOR_VISIT_RECORDED',
    entityType: 'DoctorVisit',
    entityId: visit._id.toString(),
    reason: `Doctor visit completed on ${visitDate}.${todayTemp ? ` Temp at visit: ${todayTemp.temperatureCelsius}°C.` : ' [WARNING: Temperature was NOT recorded before visit]'}${input.dischargeRecommendation ? ' [DISCHARGE RECOMMENDED]' : ''}`,
    after: visit.toObject(),
  });

  return visit;
};

export const getDoctorRoundsQueue = async (dateStr?: string) => {
  const settings = await getOrCreateSettings();
  const targetDate = dateStr || getTodayString(new Date(), settings.timezone);

  const activePatients = await Patient.find({
    status: { $in: ['admitted', 'discharge_recommended'] },
  }).sort({ room: 1 });

  const patientIds = activePatients.map((p) => p._id);

  // Fetch today's temperatures
  const temperatures = await TemperatureRecord.find({
    patient: { $in: patientIds },
    measurementDate: targetDate,
  });

  const tempMap = new Map();
  temperatures.forEach((t) => tempMap.set(t.patient.toString(), t));

  // Fetch today's visits
  const visits = await DoctorVisit.find({
    patient: { $in: patientIds },
    visitDate: targetDate,
    isPrimaryDailyVisit: true,
  }).populate('doctor', 'name email');

  const visitMap = new Map();
  visits.forEach((v) => visitMap.set(v.patient.toString(), v));

  const queue = activePatients.map((patient) => {
    const todayTemp = tempMap.get(patient._id.toString());
    const todayVisit = visitMap.get(patient._id.toString());

    return {
      patient,
      hasTemperatureToday: Boolean(todayTemp),
      latestTemperature: todayTemp || null,
      temperatureMissingWarning: !todayTemp,
      hasDoctorVisitToday: Boolean(todayVisit),
      doctorVisit: todayVisit || null,
      status: todayVisit ? 'completed' : 'pending',
    };
  });

  const pending = queue.filter((q) => q.status === 'pending');
  const completed = queue.filter((q) => q.status === 'completed');

  return {
    targetDate,
    queue,
    pending,
    completed,
    total: queue.length,
    pendingCount: pending.length,
    completedCount: completed.length,
  };
};

export const getPatientVisits = async (patientId: string): Promise<IDoctorVisit[]> => {
  return DoctorVisit.find({ patient: patientId })
    .sort({ visitDate: -1, visitedAt: -1 })
    .populate('doctor', 'name email role');
};
