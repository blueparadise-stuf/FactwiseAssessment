import mongoose from 'mongoose';
import { Patient, IPatient, PatientStatus, DischargeRecommendationStatus, FinalOutcome } from '../models/Patient.js';
import { FacilitySettings } from '../models/FacilitySettings.js';
import { logAudit } from './auditService.js';
import { IUser } from '../models/User.js';

export const getOrCreateSettings = async () => {
  let settings = await FacilitySettings.findOne();
  if (!settings) {
    const activeCount = await Patient.countDocuments({
      status: { $in: ['admitted', 'discharge_recommended'] },
    });
    settings = await FacilitySettings.create({
      facilityName: 'CareTrack Virus Quarantine & Treatment Facility',
      capacity: 74,
      currentOccupancy: activeCount,
      timezone: 'UTC',
      feverThresholdCelsius: 38.0,
      feverFreeEligibilityRule: 'THREE_FULL_CALENDAR_DAYS',
    });
  }
  return settings;
};

export const syncOccupancyCount = async (): Promise<number> => {
  const activeCount = await Patient.countDocuments({
    status: { $in: ['admitted', 'discharge_recommended'] },
  });
  await FacilitySettings.findOneAndUpdate({}, { currentOccupancy: activeCount }, { upsert: true });
  return activeCount;
};

export interface CreatePatientInput {
  fullName: string;
  age: number;
  dateOfBirth?: Date;
  admissionDate?: Date;
  room: string;
  notes?: string;
  patientId?: string;
}

export const registerPatient = async (
  input: CreatePatientInput,
  actor: IUser
): Promise<IPatient> => {
  await getOrCreateSettings();

  // 1. Check real active patients against capacity
  const activeCount = await Patient.countDocuments({
    status: { $in: ['admitted', 'discharge_recommended'] },
  });

  const settingsDoc = await FacilitySettings.findOne();
  const capacity = settingsDoc?.capacity || 74;

  if (activeCount >= capacity) {
    const error: any = new Error(
      `Facility maximum capacity of ${capacity} patients has been reached. Current occupied beds: ${activeCount}. Cannot admit new patient.`
    );
    error.statusCode = 400;
    throw error;
  }

  // Atomic increment with capacity check
  const reservation = await FacilitySettings.findOneAndUpdate(
    {
      $expr: { $lt: ['$currentOccupancy', '$capacity'] },
    },
    { $inc: { currentOccupancy: 1 } },
    { new: true }
  );

  if (!reservation) {
    const error: any = new Error(
      `Facility maximum capacity of ${capacity} patients has been reached. Current occupied beds: ${activeCount}. Cannot admit new patient.`
    );
    error.statusCode = 400;
    throw error;
  }

  try {
    // 2. Generate unique Patient ID if not provided
    let patientId = input.patientId?.trim().toUpperCase();
    if (!patientId) {
      const count = await Patient.countDocuments();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      patientId = `AD-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}-${randomSuffix}`;
    }

    // 3. Check active room conflict upfront for clean messaging
    const existingActiveRoom = await Patient.findOne({
      room: input.room.trim().toUpperCase(),
      status: { $in: ['admitted', 'discharge_recommended'] },
    });
    if (existingActiveRoom) {
      const error: any = new Error(
        `Room/Bed '${input.room.trim().toUpperCase()}' is currently occupied by patient ${existingActiveRoom.fullName} (${existingActiveRoom.patientId}).`
      );
      error.statusCode = 409;
      throw error;
    }

    const patient = await Patient.create({
      patientId,
      fullName: input.fullName.trim(),
      age: input.age,
      dateOfBirth: input.dateOfBirth,
      admissionDate: input.admissionDate || new Date(),
      room: input.room.trim().toUpperCase(),
      status: 'admitted',
      dischargeRecommendationStatus: 'none',
      finalOutcome: 'unknown',
      notes: input.notes?.trim(),
      createdBy: actor._id,
    });

    await logAudit({
      actor,
      action: 'PATIENT_ADMITTED',
      entityType: 'Patient',
      entityId: patient._id.toString(),
      reason: `Admitted to room ${patient.room}. Bed capacity: ${reservation?.currentOccupancy || 'N/A'}/74`,
      after: patient.toObject(),
    });

    return patient;
  } catch (error) {
    // Rollback atomic occupancy increment if patient creation failed
    await FacilitySettings.findOneAndUpdate(
      { currentOccupancy: { $gt: 0 } },
      { $inc: { currentOccupancy: -1 } }
    );
    throw error;
  }
};

export interface PatientFilterOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  room?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const getPatients = async (options: PatientFilterOptions) => {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(options.limit) || 10));
  const skip = (page - 1) * limit;

  const query: Record<string, any> = {};

  if (options.status) {
    if (options.status === 'active') {
      query.status = { $in: ['admitted', 'discharge_recommended'] };
    } else {
      query.status = options.status;
    }
  }

  if (options.room) {
    query.room = new RegExp(options.room, 'i');
  }

  if (options.search) {
    const searchRegex = new RegExp(options.search.trim(), 'i');
    query.$or = [
      { fullName: searchRegex },
      { patientId: searchRegex },
      { room: searchRegex },
    ];
  }

  const sortField = options.sortBy || 'admissionDate';
  const sortDirection = options.sortOrder === 'asc' ? 1 : -1;

  const [patients, total] = await Promise.all([
    Patient.find(query)
      .sort({ [sortField]: sortDirection })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email role')
      .populate('dischargeRecommendedBy', 'name email role')
      .populate('dischargeConfirmedBy', 'name email role'),
    Patient.countDocuments(query),
  ]);

  return {
    patients,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getPatientById = async (id: string): Promise<IPatient> => {
  let patient: IPatient | null = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    patient = await Patient.findById(id)
      .populate('createdBy', 'name email role')
      .populate('dischargeRecommendedBy', 'name email role')
      .populate('dischargeConfirmedBy', 'name email role');
  } else {
    patient = await Patient.findOne({ patientId: id.toUpperCase() })
      .populate('createdBy', 'name email role')
      .populate('dischargeRecommendedBy', 'name email role')
      .populate('dischargeConfirmedBy', 'name email role');
  }

  if (!patient) {
    const error: any = new Error(`Patient with ID '${id}' not found.`);
    error.statusCode = 404;
    throw error;
  }

  return patient;
};

export const updatePatient = async (
  id: string,
  updateData: Partial<{
    fullName: string;
    age: number;
    room: string;
    notes: string;
    finalOutcome: FinalOutcome;
  }>,
  actor: IUser,
  reason?: string
): Promise<IPatient> => {
  const patient = await getPatientById(id);
  const beforeState = patient.toObject();

  if (updateData.room && updateData.room.trim().toUpperCase() !== patient.room) {
    const newRoom = updateData.room.trim().toUpperCase();
    // Check if new room is occupied
    const occupied = await Patient.findOne({
      _id: { $ne: patient._id },
      room: newRoom,
      status: { $in: ['admitted', 'discharge_recommended'] },
    });

    if (occupied) {
      const error: any = new Error(`Room/Bed '${newRoom}' is currently occupied by patient ${occupied.fullName}.`);
      error.statusCode = 409;
      throw error;
    }
    patient.room = newRoom;
  }

  if (updateData.fullName) patient.fullName = updateData.fullName.trim();
  if (updateData.age !== undefined) patient.age = updateData.age;
  if (updateData.notes !== undefined) patient.notes = updateData.notes.trim();
  if (updateData.finalOutcome) patient.finalOutcome = updateData.finalOutcome;

  await patient.save();

  await logAudit({
    actor,
    action: 'PATIENT_UPDATED',
    entityType: 'Patient',
    entityId: patient._id.toString(),
    reason: reason || 'Updated patient record',
    before: beforeState,
    after: patient.toObject(),
  });

  return patient;
};
