import mongoose, { Document, Schema } from 'mongoose';

export interface IFacilitySettings extends Document {
  facilityName: string;
  capacity: number;
  currentOccupancy: number;
  timezone: string;
  feverThresholdCelsius: number;
  feverFreeEligibilityRule: string;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const facilitySettingsSchema = new Schema<IFacilitySettings>(
  {
    facilityName: {
      type: String,
      default: 'CareTrack Virus Quarantine & Treatment Facility',
      trim: true,
    },
    capacity: {
      type: Number,
      default: 74,
      required: true,
      min: 1,
    },
    currentOccupancy: {
      type: Number,
      default: 0,
      min: 0,
    },
    timezone: {
      type: String,
      default: 'UTC',
      trim: true,
    },
    feverThresholdCelsius: {
      type: Number,
      default: 38.0,
      required: true,
      min: 35.0,
      max: 42.0,
    },
    feverFreeEligibilityRule: {
      type: String,
      default: 'THREE_FULL_CALENDAR_DAYS',
      enum: ['THREE_FULL_CALENDAR_DAYS', 'ROLLING_72_HOURS'],
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const FacilitySettings = mongoose.model<IFacilitySettings>('FacilitySettings', facilitySettingsSchema);
