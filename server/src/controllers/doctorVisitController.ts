import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import * as doctorVisitService from '../services/doctorVisitService.js';
import { DoctorVisit } from '../models/DoctorVisit.js';
import { logAudit } from '../services/auditService.js';

export const getDoctorRoundsQueue = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { date } = req.query;
    const result = await doctorVisitService.getDoctorRoundsQueue(date as string);
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

export const createDoctorVisit = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const visit = await doctorVisitService.recordDoctorVisit(req.body, req.user!);
    res.status(201).json({
      success: true,
      message: `Doctor round successfully recorded for ${visit.visitDate}.`,
      visit,
    });
  } catch (err) {
    next(err);
  }
};

export const updateDoctorVisit = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { assessment, treatmentDecision, reason } = req.body;

    const visit = await DoctorVisit.findById(id);
    if (!visit) {
      res.status(404).json({ success: false, message: 'Doctor visit record not found' });
      return;
    }

    const beforeState = visit.toObject();
    if (assessment) visit.assessment = assessment.trim();
    if (treatmentDecision) visit.treatmentDecision = treatmentDecision.trim();

    await visit.save();

    await logAudit({
      actor: req.user,
      action: 'DOCTOR_VISIT_AMENDED',
      entityType: 'DoctorVisit',
      entityId: visit._id.toString(),
      reason: reason || 'Amended clinical assessment or treatment decision',
      before: beforeState,
      after: visit.toObject(),
    });

    res.status(200).json({
      success: true,
      message: 'Doctor visit notes updated successfully',
      visit,
    });
  } catch (err) {
    next(err);
  }
};

export const getPatientDoctorVisits = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const patientId = String(req.params.patientId);
    const visits = await doctorVisitService.getPatientVisits(patientId);
    res.status(200).json({
      success: true,
      visits,
    });
  } catch (err) {
    next(err);
  }
};
