import mongoose, { Document, Schema } from 'mongoose';

export interface IDoctorVisit extends Document {
  patient: mongoose.Types.ObjectId;
  visitDate: string; // "YYYY-MM-DD"
  visitedAt: Date;
  doctor: mongoose.Types.ObjectId;
  assessment: string;
  treatmentDecision: string;
  dischargeRecommendation: boolean;
  recommendationReason?: string;
  temperatureRecordedBeforeVisit: boolean;
  temperatureAtVisit?: number;
  isPrimaryDailyVisit: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const doctorVisitSchema = new Schema<IDoctorVisit>(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient reference is required'],
      index: true,
    },
    visitDate: {
      type: String,
      required: [true, 'Visit date is required in YYYY-MM-DD format'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Visit date must be in YYYY-MM-DD format'],
      index: true,
    },
    visitedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    doctor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Attending doctor reference is required'],
      index: true,
    },
    assessment: {
      type: String,
      required: [true, 'Clinical assessment is required'],
      trim: true,
      minlength: 5,
      maxlength: 2000,
    },
    treatmentDecision: {
      type: String,
      required: [true, 'Treatment decision is required'],
      trim: true,
      minlength: 3,
      maxlength: 1000,
    },
    dischargeRecommendation: {
      type: Boolean,
      default: false,
    },
    recommendationReason: {
      type: String,
      trim: true,
    },
    temperatureRecordedBeforeVisit: {
      type: Boolean,
      default: false,
    },
    temperatureAtVisit: {
      type: Number,
    },
    isPrimaryDailyVisit: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent accidental duplicate primary daily visits while preserving legitimate secondary visits
doctorVisitSchema.index(
  { patient: 1, visitDate: 1 },
  {
    unique: true,
    partialFilterExpression: { isPrimaryDailyVisit: true },
    name: 'unique_primary_daily_doctor_visit',
  }
);

export const DoctorVisit = mongoose.model<IDoctorVisit>('DoctorVisit', doctorVisitSchema);
