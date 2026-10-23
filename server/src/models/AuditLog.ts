import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  actor?: mongoose.Types.ObjectId;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: 'Patient' | 'TemperatureRecord' | 'DoctorVisit' | 'User' | 'FacilitySettings' | 'Auth';
  entityId?: string;
  timestamp: Date;
  reason?: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    actorName: {
      type: String,
      required: true,
      default: 'System',
    },
    actorRole: {
      type: String,
      required: true,
      default: 'System',
      index: true,
    },
    action: {
      type: String,
      required: [true, 'Action name is required'],
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      enum: ['Patient', 'TemperatureRecord', 'DoctorVisit', 'User', 'FacilitySettings', 'Auth'],
      index: true,
    },
    entityId: {
      type: String,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    before: {
      type: Schema.Types.Mixed,
    },
    after: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: false,
    capped: false,
  }
);

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
