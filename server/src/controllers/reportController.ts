import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import * as reportService from '../services/reportService.js';
import { Patient } from '../models/Patient.js';

export const getDashboardSummary = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const summary = await reportService.getDashboardSummary();
    res.status(200).json({
      success: true,
      summary,
    });
  } catch (err) {
    next(err);
  }
};

export const getOutcomesReport = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    const report = await reportService.getOutcomesReport(
      startDate as string,
      endDate as string
    );
    res.status(200).json({
      success: true,
      report,
    });
  } catch (err) {
    next(err);
  }
};

export const getOccupancyReport = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { days } = req.query;
    const trends = await reportService.getOccupancyAndTaskTrends(days ? Number(days) : 7);
    res.status(200).json({
      success: true,
      trends,
    });
  } catch (err) {
    next(err);
  }
};

export const exportReportsCSV = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const patients = await Patient.find()
      .sort({ admissionDate: -1 })
      .populate('createdBy', 'name')
      .populate('dischargeConfirmedBy', 'name');

    // Build CSV headers and rows
    const headers = [
      'Patient ID',
      'Full Name',
      'Age',
      'Room',
      'Status',
      'Admission Date',
      'Discharge Date',
      'Final Outcome',
      'Discharge Recommendation',
      'Admitted By',
      'Discharge Confirmed By',
      'Notes',
    ];

    const rows = patients.map((p) => [
      `"${p.patientId}"`,
      `"${p.fullName.replace(/"/g, '""')}"`,
      p.age,
      `"${p.room}"`,
      `"${p.status}"`,
      `"${p.admissionDate ? p.admissionDate.toISOString().split('T')[0] : ''}"`,
      `"${p.dischargeDate ? p.dischargeDate.toISOString().split('T')[0] : ''}"`,
      `"${p.finalOutcome}"`,
      `"${p.dischargeRecommendationStatus}"`,
      `"${(p.createdBy as any)?.name || 'N/A'}"`,
      `"${(p.dischargeConfirmedBy as any)?.name || 'N/A'}"`,
      `"${(p.notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="caretrack-patients-${new Date().toISOString().split('T')[0]}.csv"`);
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};
