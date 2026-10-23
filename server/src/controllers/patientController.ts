import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import * as patientService from '../services/patientService.js';
import * as temperatureService from '../services/temperatureService.js';
import * as doctorVisitService from '../services/doctorVisitService.js';
import * as dischargeService from '../services/dischargeService.js';
import { AuditLog } from '../models/AuditLog.js';

export const listPatients = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit, search, status, room, sortBy, sortOrder } = req.query;
    const result = await patientService.getPatients({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search: search as string,
      status: status as string,
      room: room as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

export const createPatient = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const patient = await patientService.registerPatient(req.body, req.user!);
    res.status(201).json({
      success: true,
      message: `Patient ${patient.fullName} successfully admitted to room ${patient.room}.`,
      patient,
    });
  } catch (err) {
    next(err);
  }
};

export const getPatientDetails = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = String(req.params.id);
    const patient = await patientService.getPatientById(id);
    const eligibility = await dischargeService.calculatePatientDischargeEligibility(patient._id);

    res.status(200).json({
      success: true,
      patient,
      eligibility,
    });
  } catch (err) {
    next(err);
  }
};

export const updatePatient = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { reason, ...updateData } = req.body;
    const patient = await patientService.updatePatient(id, updateData, req.user!, reason);

    res.status(200).json({
      success: true,
      message: 'Patient record successfully updated.',
      patient,
    });
  } catch (err) {
    next(err);
  }
};

export const getPatientHistory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = String(req.params.id);
    const patient = await patientService.getPatientById(id);

    const [temperatures, visits, audits, eligibility] = await Promise.all([
      temperatureService.getPatientTemperatures(patient._id.toString()),
      doctorVisitService.getPatientVisits(patient._id.toString()),
      req.user?.role === 'Administrator'
        ? AuditLog.find({ entityId: patient._id.toString() }).sort({ timestamp: -1 })
        : Promise.resolve([]),
      dischargeService.calculatePatientDischargeEligibility(patient._id),
    ]);

    res.status(200).json({
      success: true,
      patient,
      temperatures,
      doctorVisits: visits,
      eligibility,
      auditHistory: audits,
    });
  } catch (err) {
    next(err);
  }
};
