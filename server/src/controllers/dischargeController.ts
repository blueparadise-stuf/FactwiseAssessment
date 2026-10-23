import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import * as dischargeService from '../services/dischargeService.js';

export const getEligibleDischarges = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await dischargeService.getDischargeCandidates();
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

export const recommendDischarge = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const patientId = String(req.params.patientId);
    const { notes } = req.body;
    const patient = await dischargeService.recommendDischarge(patientId, req.user!, notes);

    res.status(200).json({
      success: true,
      message: `Discharge successfully recommended for patient ${patient.fullName}. Awaiting Administrator confirmation.`,
      patient,
    });
  } catch (err) {
    next(err);
  }
};

export const confirmDischarge = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const patientId = String(req.params.patientId);
    const { finalOutcome, notes, dischargeDate } = req.body;
    const patient = await dischargeService.confirmDischarge(patientId, req.user!, {
      finalOutcome,
      notes,
      dischargeDate: dischargeDate ? new Date(dischargeDate) : undefined,
    });

    res.status(200).json({
      success: true,
      message: `Discharge confirmed for patient ${patient.fullName}. Room ${patient.room} has been freed. Final outcome: ${patient.finalOutcome}.`,
      patient,
    });
  } catch (err) {
    next(err);
  }
};
