import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createPatientSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(120),
  age: z.coerce.number().int().min(0, 'Age cannot be negative').max(130, 'Age must be valid'),
  dateOfBirth: z.string().optional(),
  admissionDate: z.string().optional(),
  room: z.string().min(1, 'Room or Bed designation is required').max(30),
  notes: z.string().max(1000).optional(),
  patientId: z.string().optional(),
});

export const updatePatientSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  age: z.coerce.number().int().min(0).max(130).optional(),
  room: z.string().min(1).max(30).optional(),
  notes: z.string().max(1000).optional(),
  finalOutcome: z.enum(['recovered', 'deceased', 'unknown']).optional(),
  reason: z.string().optional(),
});

export const recordTemperatureSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  temperatureCelsius: z.coerce.number().min(34.0, 'Temperature is implausibly low (< 34.0°C)').max(43.0, 'Temperature is implausibly high (> 43.0°C)'),
  measurementDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Measurement date must be in YYYY-MM-DD format').optional(),
  notes: z.string().max(500).optional(),
  flaggedForReview: z.boolean().optional(),
  flagReason: z.string().optional(),
});

export const correctTemperatureSchema = z.object({
  newTemperatureCelsius: z.coerce.number().min(34.0).max(43.0),
  reason: z.string().min(5, 'A clinical reason of at least 5 characters is required for record correction'),
});

export const createDoctorVisitSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  assessment: z.string().min(5, 'Clinical assessment must be at least 5 characters').max(2000),
  treatmentDecision: z.string().min(3, 'Treatment decision is required').max(1000),
  dischargeRecommendation: z.boolean().optional(),
  recommendationReason: z.string().optional(),
  isPrimaryDailyVisit: z.boolean().optional(),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
});

export const confirmDischargeSchema = z.object({
  finalOutcome: z.enum(['recovered', 'deceased', 'unknown']).optional(),
  notes: z.string().max(1000).optional(),
  dischargeDate: z.string().optional(),
});

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['Administrator', 'Nurse', 'Doctor', 'FacilityManager']),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(['Administrator', 'Nurse', 'Doctor', 'FacilityManager']).optional(),
  isActive: z.boolean().optional(),
});
