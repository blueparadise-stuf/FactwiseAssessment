import { AuditLog } from '../models/AuditLog.js';
import { IUser } from '../models/User.js';

export interface AuditParams {
  actor?: IUser;
  action: string;
  entityType: 'Patient' | 'TemperatureRecord' | 'DoctorVisit' | 'User' | 'FacilitySettings' | 'Auth';
  entityId?: string;
  reason?: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export const logAudit = async (params: AuditParams): Promise<void> => {
  try {
    await AuditLog.create({
      actor: params.actor?._id,
      actorName: params.actor?.name || 'System / Unauthenticated',
      actorRole: params.actor?.role || 'System',
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      reason: params.reason,
      before: params.before,
      after: params.after,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Failed to write audit log entry:', error);
  }
};
