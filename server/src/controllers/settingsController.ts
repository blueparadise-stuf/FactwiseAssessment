import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { FacilitySettings } from '../models/FacilitySettings.js';
import { getOrCreateSettings } from '../services/patientService.js';
import { logAudit } from '../services/auditService.js';

export const getSettings = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const settings = await getOrCreateSettings();
    res.status(200).json({
      success: true,
      settings,
    });
  } catch (err) {
    next(err);
  }
};

export const updateSettings = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { facilityName, feverThresholdCelsius, feverFreeEligibilityRule, timezone } = req.body;
    const settings = await getOrCreateSettings();

    const beforeState = settings.toObject();

    if (facilityName) settings.facilityName = facilityName.trim();
    if (feverThresholdCelsius !== undefined) {
      const val = Number(feverThresholdCelsius);
      if (val < 35 || val > 42) {
        res.status(400).json({ success: false, message: 'Fever threshold must be between 35°C and 42°C.' });
        return;
      }
      settings.feverThresholdCelsius = val;
    }
    if (feverFreeEligibilityRule) {
      settings.feverFreeEligibilityRule = feverFreeEligibilityRule;
    }
    if (timezone) settings.timezone = timezone.trim();

    settings.updatedBy = req.user!._id;
    await settings.save();

    await logAudit({
      actor: req.user,
      action: 'FACILITY_SETTINGS_UPDATED',
      entityType: 'FacilitySettings',
      entityId: settings._id.toString(),
      reason: 'Administrator updated facility settings',
      before: beforeState,
      after: settings.toObject(),
    });

    res.status(200).json({
      success: true,
      message: 'Facility settings updated successfully.',
      settings,
    });
  } catch (err) {
    next(err);
  }
};
