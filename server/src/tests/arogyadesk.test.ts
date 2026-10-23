import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { seedDatabase } from '../scripts/seed.js';
import { Patient } from '../models/Patient.js';
import { TemperatureRecord } from '../models/TemperatureRecord.js';
import { DoctorVisit } from '../models/DoctorVisit.js';
import { FacilitySettings } from '../models/FacilitySettings.js';
import { User } from '../models/User.js';
import { calculatePatientDischargeEligibility } from '../services/dischargeService.js';
import { getOutcomesReport } from '../services/reportService.js';
import { getTodayString, subtractDays } from '../utils/dateUtils.js';

const app = createApp();

let adminToken = '';
let nurseToken = '';
let doctorToken = '';
let managerToken = '';

beforeAll(async () => {
  await connectDB();
  await seedDatabase();

  // Log in all roles to acquire tokens
  const adminRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@arogyadesk.in', password: 'Admin@123' });
  adminToken = adminRes.body.token;

  const nurseRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'nurse@arogyadesk.in', password: 'Nurse@123' });
  nurseToken = nurseRes.body.token;

  const doctorRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'doctor@arogyadesk.in', password: 'Doctor@123' });
  doctorToken = doctorRes.body.token;

  const managerRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'manager@arogyadesk.in', password: 'Manager@123' });
  managerToken = managerRes.body.token;
});

afterAll(async () => {
  await disconnectDB();
});

describe('1. Authentication & Authorization Tests', () => {
  it('Valid login succeeds and returns user info with token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@arogyadesk.in', password: 'Admin@123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('Administrator');
  });

  it('Invalid password fails safely with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@arogyadesk.in', password: 'WrongPassword!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('Inactive user cannot log in', async () => {
    await User.create({
      name: 'Deactivated Worker',
      email: 'inactive@arogyadesk.in',
      passwordHash: 'someHash',
      role: 'Nurse',
      isActive: false,
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'inactive@arogyadesk.in', password: 'Nurse@123' });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('deactivated');
  });

  it('Protected routes reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/v1/patients');
    expect(res.status).toBe(401);
  });

  it('Enforces server-side permissions: Nurse cannot admit patient (HTTP 403)', async () => {
    const res = await request(app)
      .post('/api/v1/patients')
      .set('Authorization', `Bearer ${nurseToken}`)
      .send({
        fullName: 'Test Patient',
        age: 30,
        room: 'BED-99',
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Forbidden');
  });
});

describe('2. Patient Registration & Capacity Tests', () => {
  it('Administrator can successfully admit a patient', async () => {
    const res = await request(app)
      .post('/api/v1/patients')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fullName: 'Admitted Test Patient',
        age: 45,
        room: 'BED-45',
        notes: 'Initial test patient',
      });

    expect(res.status).toBe(201);
    expect(res.body.patient.fullName).toBe('Admitted Test Patient');
    expect(res.body.patient.room).toBe('BED-45');
    expect(res.body.patient.status).toBe('admitted');
  });

  it('Rejects duplicate active room assignment (409 Conflict)', async () => {
    const res = await request(app)
      .post('/api/v1/patients')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fullName: 'Another Patient Same Room',
        age: 28,
        room: 'BED-45', // Already occupied!
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('currently occupied');
  });

  it('Rejects admission when maximum capacity of beds is reached', async () => {
    const activeCount = await Patient.countDocuments({ status: { $in: ['admitted', 'discharge_recommended'] } });
    await FacilitySettings.findOneAndUpdate({}, { capacity: activeCount, currentOccupancy: activeCount });

    const res = await request(app)
      .post('/api/v1/patients')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fullName: 'Over Capacity Patient',
        age: 50,
        room: 'BED-75',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('maximum capacity');

    // Restore standard 74 capacity
    await FacilitySettings.findOneAndUpdate({}, { capacity: 74, currentOccupancy: activeCount });
  });
});

describe('3. Temperature Recording & Duplicate Prevention Tests', () => {
  it('Nurse can record valid temperature reading in Celsius', async () => {
    const patient = await Patient.findOne({ patientId: 'AD-2026-0006' });
    const today = getTodayString(new Date(), 'UTC');

    const res = await request(app)
      .post('/api/v1/temperatures')
      .set('Authorization', `Bearer ${nurseToken}`)
      .send({
        patientId: patient!._id.toString(),
        temperatureCelsius: 37.1,
        measurementDate: today,
        notes: 'Normal morning reading',
      });

    expect(res.status).toBe(201);
    expect(res.body.record.temperatureCelsius).toBe(37.1);
    expect(res.body.record.isFever).toBe(false);
  });

  it('Duplicate primary daily temperature reading on same date is rejected (409)', async () => {
    const patient = await Patient.findOne({ patientId: 'AD-2026-0006' });
    const today = getTodayString(new Date(), 'UTC');

    const res = await request(app)
      .post('/api/v1/temperatures')
      .set('Authorization', `Bearer ${nurseToken}`)
      .send({
        patientId: patient!._id.toString(),
        temperatureCelsius: 37.3,
        measurementDate: today,
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('already been recorded');
  });

  it('Rejects physiologically implausible temperatures (< 34°C or > 43°C)', async () => {
    const patient = await Patient.findOne({ patientId: 'AD-2026-0007' });

    const resLow = await request(app)
      .post('/api/v1/temperatures')
      .set('Authorization', `Bearer ${nurseToken}`)
      .send({
        patientId: patient!._id.toString(),
        temperatureCelsius: 31.0,
      });
    expect(resLow.status).toBe(400);

    const resHigh = await request(app)
      .post('/api/v1/temperatures')
      .set('Authorization', `Bearer ${nurseToken}`)
      .send({
        patientId: patient!._id.toString(),
        temperatureCelsius: 45.5,
      });
    expect(resHigh.status).toBe(400);
  });

  it('Corrections preserve original record and require audit trail and reason', async () => {
    const patient = await Patient.findOne({ patientId: 'AD-2026-0006' });
    const today = getTodayString(new Date(), 'UTC');
    const existing = await TemperatureRecord.findOne({ patient: patient!._id, measurementDate: today });

    const res = await request(app)
      .post(`/api/v1/temperatures/${existing!._id}/corrections`)
      .set('Authorization', `Bearer ${nurseToken}`)
      .send({
        newTemperatureCelsius: 36.9,
        reason: 'Recalibrated thermometer reading per clinical protocol',
      });

    expect(res.status).toBe(200);
    expect(res.body.record.temperatureCelsius).toBe(36.9);
    expect(res.body.record.correctionHistory.length).toBe(1);
    expect(res.body.record.correctionHistory[0].previousTemperature).toBe(37.1);
  });
});

describe('4. Doctor Rounds & Visit Tests', () => {
  it('Doctor can complete daily visit notes', async () => {
    const patient = await Patient.findOne({ patientId: 'AD-2026-0008' });
    const today = getTodayString(new Date(), 'UTC');

    const res = await request(app)
      .post('/api/v1/doctor-visits')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId: patient!._id.toString(),
        visitDate: today,
        assessment: 'Patient alert and oriented. Oxygen saturation 98%.',
        treatmentDecision: 'Continue current oral hydration and vitamins.',
        dischargeRecommendation: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.visit.assessment).toContain('Patient alert');
    expect(res.body.visit.temperatureRecordedBeforeVisit).toBe(true);
  });

  it('Doctor visit on patient without temperature triggers warning flag', async () => {
    const patient = await Patient.findOne({ patientId: 'AD-2026-0007' });
    const today = getTodayString(new Date(), 'UTC');

    const res = await request(app)
      .post('/api/v1/doctor-visits')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId: patient!._id.toString(),
        visitDate: today,
        assessment: 'Urgent bedside clinical check. Coughing subsided.',
        treatmentDecision: 'Order nebulizer if wheezing recurs.',
      });

    expect(res.status).toBe(201);
    expect(res.body.visit.temperatureRecordedBeforeVisit).toBe(false);
  });

  it('Accidental duplicate primary daily visit is prevented (409)', async () => {
    const patient = await Patient.findOne({ patientId: 'AD-2026-0008' });
    const today = getTodayString(new Date(), 'UTC');

    const res = await request(app)
      .post('/api/v1/doctor-visits')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId: patient!._id.toString(),
        visitDate: today,
        assessment: 'Duplicate round attempt.',
        treatmentDecision: 'None',
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('already been completed');
  });
});

describe('5. Discharge Eligibility & Confirmation Tests', () => {
  it('Calculates fever-free eligibility correctly (3 consecutive days)', async () => {
    const qualifiedPatient = await Patient.findOne({ patientId: 'AD-2026-0001' });
    const eligibility = await calculatePatientDischargeEligibility(qualifiedPatient!._id);

    expect(eligibility.isEligible).toBe(true);
    expect(eligibility.feverFreeStreak).toBeGreaterThanOrEqual(3);
  });

  it('A fever resets qualifying streak to zero', async () => {
    const feverPatient = await Patient.findOne({ patientId: 'AD-2026-0004' });
    const eligibility = await calculatePatientDischargeEligibility(feverPatient!._id);

    expect(eligibility.isEligible).toBe(false);
    expect(eligibility.feverFreeStreak).toBe(0);
  });

  it('Doctor can recommend discharge for eligible patient', async () => {
    const patient = await Patient.findOne({ patientId: 'AD-2026-0001' });

    const res = await request(app)
      .post(`/api/v1/discharges/${patient!._id}/recommend`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ notes: 'Fever-free streak verified. Ready for discharge.' });

    expect(res.status).toBe(200);
    expect(res.body.patient.status).toBe('discharge_recommended');
    expect(res.body.patient.dischargeRecommendationStatus).toBe('recommended');
  });

  it('Unauthorized user (Nurse or Doctor) cannot confirm discharge (HTTP 403)', async () => {
    const patient = await Patient.findOne({ patientId: 'AD-2026-0001' });

    const nurseConfirm = await request(app)
      .post(`/api/v1/discharges/${patient!._id}/confirm`)
      .set('Authorization', `Bearer ${nurseToken}`)
      .send({ finalOutcome: 'recovered' });
    expect(nurseConfirm.status).toBe(403);

    const docConfirm = await request(app)
      .post(`/api/v1/discharges/${patient!._id}/confirm`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ finalOutcome: 'recovered' });
    expect(docConfirm.status).toBe(403);
  });

  it('Administrator confirms discharge, updates occupancy, and frees room', async () => {
    const patient = await Patient.findOne({ patientId: 'AD-2026-0001' });
    const room = patient!.room;

    const res = await request(app)
      .post(`/api/v1/discharges/${patient!._id}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ finalOutcome: 'recovered', notes: 'Discharge cleared by Medical Admin' });

    expect(res.status).toBe(200);
    expect(res.body.patient.status).toBe('discharged');
    expect(res.body.patient.finalOutcome).toBe('recovered');

    // Room is now free for new admissions!
    const newAdmission = await request(app)
      .post('/api/v1/patients')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fullName: 'New Patient in Freed Room',
        age: 33,
        room,
      });
    expect(newAdmission.status).toBe(201);
  });
});

describe('6. Mortality and Survival Benchmark Reporting Tests', () => {
  it('Outcome formulas calculate correct rates and adhere to 15% benchmark', async () => {
    const report = await getOutcomesReport();

    expect(report.metrics).toBeDefined();
    expect(report.metrics.mortalityBenchmark).toBe(15);
    expect(report.metrics.survivalBenchmark).toBe(85);

    // Rate checks: Mortality + Survival = 100% of known final outcomes
    const totalKnown = report.sampleSize.knownFinalOutcomes;
    expect(totalKnown).toBeGreaterThan(0);
    const sum = report.metrics.mortalityRate + report.metrics.survivalRate;
    expect(Math.round(sum)).toBe(100);
  });
});
