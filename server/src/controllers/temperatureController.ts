import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import * as temperatureService from '../services/temperatureService.js';
import { TemperatureRecord } from '../models/TemperatureRecord.js';

export const listTemperatures = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { date, patientId, limit = 50 } = req.query;
    const query: Record<string, any> = {};

    if (date) query.measurementDate = date;
    if (patientId) query.patient = patientId;

    const records = await TemperatureRecord.find(query)
      .sort({ measurementDate: -1, measuredAt: -1 })
      .limit(Number(limit))
      .populate('patient', 'fullName patientId room status')
      .populate('recordedBy', 'name email role');

    res.status(200).json({
      success: true,
      records,
    });
  } catch (err) {
    next(err);
  }
};

export const createTemperature = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const record = await temperatureService.recordTemperature(req.body, req.user!);
    res.status(201).json({
      success: true,
      message: `Recorded temperature: ${record.temperatureCelsius}°C for ${record.measurementDate}.`,
      record,
    });
  } catch (err) {
    next(err);
  }
};

export const getPendingTemperatures = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { date } = req.query;
    const result = await temperatureService.getPendingTemperaturePatients(date as string);
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

export const getPatientTemperatures = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const patientId = String(req.params.patientId);
    const records = await temperatureService.getPatientTemperatures(patientId);
    res.status(200).json({
      success: true,
      records,
    });
  } catch (err) {
    next(err);
  }
};

export const correctTemperature = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = String(req.params.id);
    const record = await temperatureService.correctTemperatureRecord(id, req.body, req.user!);
    res.status(200).json({
      success: true,
      message: `Temperature record successfully corrected to ${record.temperatureCelsius}°C with audit trail.`,
      record,
    });
  } catch (err) {
    next(err);
  }
};
