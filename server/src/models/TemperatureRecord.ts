import mongoose, { Document, Schema } from 'mongoose';

export interface ITemperatureCorrection {
  previousTemperature: number;
  correctedBy: mongoose.Types.ObjectId;
  correctedAt: Date;
  reason: string;
}

export interface ITemperatureRecord extends Document {
  patient: mongoose.Types.ObjectId;
  measurementDate: string; // "YYYY-MM-DD"
  measuredAt: Date;
  temperatureCelsius: number;
  recordedBy: mongoose.Types.ObjectId;
  notes?: string;
  isFever: boolean;
  isUnusual: boolean;
  flaggedForReview: boolean;
  flagReason?: string;
  correctionHistory: ITemperatureCorrection[];
  createdAt: Date;
  updatedAt: Date;
}

const temperatureCorrectionSchema = new Schema<ITemperatureCorrection>(
  {
    previousTemperature: {
      type: Number,
      required: true,
    },
    correctedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    correctedAt: {
      type: Date,
      default: Date.now,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
    },
  },
  { _id: false }
);

const temperatureRecordSchema = new Schema<ITemperatureRecord>(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient reference is required'],
      index: true,
    },
    measurementDate: {
      type: String,
      required: [true, 'Measurement date is required in YYYY-MM-DD format'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Measurement date must be in YYYY-MM-DD format'],
      index: true,
    },
    measuredAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    temperatureCelsius: {
      type: Number,
      required: [true, 'Temperature in Celsius is required'],
      min: [34.0, 'Temperature is physiologically implausibly low (< 34°C)'],
      max: [43.0, 'Temperature is physiologically implausibly high (> 43°C)'],
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recording nurse/user is required'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    isFever: {
      type: Boolean,
      default: false,
    },
    isUnusual: {
      type: Boolean,
      default: false,
    },
    flaggedForReview: {
      type: Boolean,
      default: false,
    },
    flagReason: {
      type: String,
      trim: true,
    },
    correctionHistory: [temperatureCorrectionSchema],
  },
  {
    timestamps: true,
  }
);

// Strictly prevent duplicate primary daily temperature records per patient and date
temperatureRecordSchema.index(
  { patient: 1, measurementDate: 1 },
  { unique: true, name: 'unique_daily_patient_temperature' }
);

export const TemperatureRecord = mongoose.model<ITemperatureRecord>(
  'TemperatureRecord',
  temperatureRecordSchema
);
