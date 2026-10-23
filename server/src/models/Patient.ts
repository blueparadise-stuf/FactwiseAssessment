import mongoose, { Document, Schema } from 'mongoose';

export type PatientStatus = 'admitted' | 'discharge_recommended' | 'discharged';
export type DischargeRecommendationStatus = 'none' | 'recommended' | 'confirmed' | 'rejected';
export type FinalOutcome = 'recovered' | 'deceased' | 'unknown';

export interface IPatient extends Document {
  patientId: string;
  fullName: string;
  age: number;
  dateOfBirth?: Date;
  admissionDate: Date;
  dischargeDate?: Date;
  room: string;
  status: PatientStatus;
  dischargeRecommendationStatus: DischargeRecommendationStatus;
  dischargeRecommendedAt?: Date;
  dischargeRecommendedBy?: mongoose.Types.ObjectId;
  dischargeRecommendationNotes?: string;
  dischargeConfirmedBy?: mongoose.Types.ObjectId;
  dischargeConfirmedAt?: Date;
  finalOutcome: FinalOutcome;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const patientSchema = new Schema<IPatient>(
  {
    patientId: {
      type: String,
      required: [true, 'Patient ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: 2,
      maxlength: 120,
      index: true,
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [0, 'Age cannot be negative'],
      max: [130, 'Age must be valid'],
    },
    dateOfBirth: {
      type: Date,
    },
    admissionDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    dischargeDate: {
      type: Date,
      index: true,
    },
    room: {
      type: String,
      required: [true, 'Room/Bed designation is required'],
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['admitted', 'discharge_recommended', 'discharged'],
      default: 'admitted',
      index: true,
    },
    dischargeRecommendationStatus: {
      type: String,
      enum: ['none', 'recommended', 'confirmed', 'rejected'],
      default: 'none',
      index: true,
    },
    dischargeRecommendedAt: {
      type: Date,
    },
    dischargeRecommendedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    dischargeRecommendationNotes: {
      type: String,
      trim: true,
    },
    dischargeConfirmedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    dischargeConfirmedAt: {
      type: Date,
    },
    finalOutcome: {
      type: String,
      enum: ['recovered', 'deceased', 'unknown'],
      default: 'unknown',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate active room assignments with a partial unique index
patientSchema.index(
  { room: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['admitted', 'discharge_recommended'] } },
    name: 'unique_active_room_assignment',
  }
);

export const Patient = mongoose.model<IPatient>('Patient', patientSchema);
