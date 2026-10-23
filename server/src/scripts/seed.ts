import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Patient } from '../models/Patient.js';
import { TemperatureRecord } from '../models/TemperatureRecord.js';
import { DoctorVisit } from '../models/DoctorVisit.js';
import { FacilitySettings } from '../models/FacilitySettings.js';
import { AuditLog } from '../models/AuditLog.js';
import { connectDB } from '../config/db.js';
import { getTodayString, subtractDays } from '../utils/dateUtils.js';

export const seedDatabase = async () => {
  console.log('Seeding ArogyaDesk demo dataset...');

  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }

  await Promise.all([
    User.deleteMany({}),
    Patient.deleteMany({}),
    TemperatureRecord.deleteMany({}),
    DoctorVisit.deleteMany({}),
    FacilitySettings.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  const settings = await FacilitySettings.create({
    facilityName: 'ArogyaDesk Patient Care & Monitoring Center',
    capacity: 74,
    currentOccupancy: 0,
    timezone: 'Asia/Kolkata',
    feverThresholdCelsius: 38.0,
    feverFreeEligibilityRule: 'THREE_FULL_CALENDAR_DAYS',
  });

  const salt = await bcrypt.genSalt(10);
  const passwordAdmin = await bcrypt.hash('Admin@123', salt);
  const passwordNurse = await bcrypt.hash('Nurse@123', salt);
  const passwordDoctor = await bcrypt.hash('Doctor@123', salt);
  const passwordManager = await bcrypt.hash('Manager@123', salt);

  const admin = await User.create({
    name: 'Dr. Sunita Deshmukh',
    email: 'admin@arogyadesk.in',
    passwordHash: passwordAdmin,
    role: 'Administrator',
    isActive: true,
  });

  const nurse = await User.create({
    name: 'Sister Meena Nair, RN',
    email: 'nurse@arogyadesk.in',
    passwordHash: passwordNurse,
    role: 'Nurse',
    isActive: true,
  });

  const doctor = await User.create({
    name: 'Dr. Arvind Patel, MD',
    email: 'doctor@arogyadesk.in',
    passwordHash: passwordDoctor,
    role: 'Doctor',
    isActive: true,
  });

  const manager = await User.create({
    name: 'Vijay Gaud',
    email: 'manager@arogyadesk.in',
    passwordHash: passwordManager,
    role: 'FacilityManager',
    isActive: true,
  });

  const todayStr = getTodayString(new Date(), settings.timezone);
  const yesterdayStr = subtractDays(todayStr, 1);
  const twoDaysAgoStr = subtractDays(todayStr, 2);
  const threeDaysAgoStr = subtractDays(todayStr, 3);
  const fourDaysAgoStr = subtractDays(todayStr, 4);
  const fiveDaysAgoStr = subtractDays(todayStr, 5);

  const samplePatients = [
    {
      patientId: 'AD-2026-0001',
      fullName: 'Ramesh Verma',
      age: 42,
      admissionDate: new Date(`${fiveDaysAgoStr}T09:00:00Z`),
      room: 'BED-01',
      status: 'admitted',
      dischargeRecommendationStatus: 'none',
      finalOutcome: 'unknown',
      notes: 'Admitted with respiratory symptoms. Responded well to antiviral regimen.',
      createdBy: admin._id,
      temps: [
        { date: fourDaysAgoStr, temp: 37.8 },
        { date: threeDaysAgoStr, temp: 36.8 },
        { date: twoDaysAgoStr, temp: 36.6 },
        { date: yesterdayStr, temp: 36.7 },
        { date: todayStr, temp: 36.5 },
      ],
      hasTodayVisit: false,
    },
    {
      patientId: 'AD-2026-0002',
      fullName: 'Pooja Deshmukh',
      age: 35,
      admissionDate: new Date(`${fiveDaysAgoStr}T11:30:00Z`),
      room: 'BED-02',
      status: 'discharge_recommended',
      dischargeRecommendationStatus: 'recommended',
      dischargeRecommendedAt: new Date(`${todayStr}T08:30:00Z`),
      dischargeRecommendedBy: doctor._id,
      dischargeRecommendationNotes: 'Patient completed 4 full fever-free days. Vital signs stable, lungs clear.',
      finalOutcome: 'unknown',
      notes: 'Initial moderate viral load, cleared successfully.',
      createdBy: admin._id,
      temps: [
        { date: threeDaysAgoStr, temp: 36.9 },
        { date: twoDaysAgoStr, temp: 36.6 },
        { date: yesterdayStr, temp: 36.5 },
        { date: todayStr, temp: 36.4 },
      ],
      hasTodayVisit: true,
      visitNotes: 'Full recovery observed. Discharge clinically recommended for admin review.',
    },
    {
      patientId: 'AD-2026-0003',
      fullName: 'Suresh Kulkarni',
      age: 58,
      admissionDate: new Date(`${fourDaysAgoStr}T14:15:00Z`),
      room: 'BED-03',
      status: 'admitted',
      dischargeRecommendationStatus: 'none',
      finalOutcome: 'unknown',
      notes: 'Hypertensive, monitored carefully throughout quarantine.',
      createdBy: admin._id,
      temps: [
        { date: threeDaysAgoStr, temp: 37.1 },
        { date: twoDaysAgoStr, temp: 36.8 },
        { date: yesterdayStr, temp: 36.7 },
        { date: todayStr, temp: 36.6 },
      ],
      hasTodayVisit: false,
    },
    {
      patientId: 'AD-2026-0004',
      fullName: 'Kavita Reddy',
      age: 29,
      admissionDate: new Date(`${threeDaysAgoStr}T10:00:00Z`),
      room: 'BED-04',
      status: 'admitted',
      dischargeRecommendationStatus: 'none',
      finalOutcome: 'unknown',
      notes: 'High fever spike yesterday evening. Hydration maintained.',
      createdBy: admin._id,
      temps: [
        { date: twoDaysAgoStr, temp: 37.4 },
        { date: yesterdayStr, temp: 38.9 },
        { date: todayStr, temp: 38.2 },
      ],
      hasTodayVisit: true,
      visitNotes: 'Persistent febrile state. Added antipyretics and ordered blood cultures.',
    },
    {
      patientId: 'AD-2026-0005',
      fullName: 'Deepak Gupta',
      age: 63,
      admissionDate: new Date(`${twoDaysAgoStr}T16:45:00Z`),
      room: 'BED-05',
      status: 'admitted',
      dischargeRecommendationStatus: 'none',
      finalOutcome: 'unknown',
      notes: 'Shortness of breath on exertion. Oxygen saturation 95%.',
      createdBy: admin._id,
      temps: [{ date: yesterdayStr, temp: 38.4 }],
      hasTodayVisit: false,
    },
    {
      patientId: 'AD-2026-0006',
      fullName: 'Sunita Rao',
      age: 51,
      admissionDate: new Date(`${fourDaysAgoStr}T08:00:00Z`),
      room: 'BED-06',
      status: 'admitted',
      dischargeRecommendationStatus: 'none',
      finalOutcome: 'unknown',
      notes: 'Awaiting morning temperature measurement from nursing team.',
      createdBy: admin._id,
      temps: [
        { date: threeDaysAgoStr, temp: 37.0 },
        { date: twoDaysAgoStr, temp: 36.9 },
        { date: yesterdayStr, temp: 36.7 },
      ],
      hasTodayVisit: false,
    },
    {
      patientId: 'AD-2026-0007',
      fullName: 'Manoj Tiwari',
      age: 38,
      admissionDate: new Date(`${threeDaysAgoStr}T13:20:00Z`),
      room: 'BED-07',
      status: 'admitted',
      dischargeRecommendationStatus: 'none',
      finalOutcome: 'unknown',
      notes: 'Quarantine day 3. Mild headache.',
      createdBy: admin._id,
      temps: [
        { date: twoDaysAgoStr, temp: 37.2 },
        { date: yesterdayStr, temp: 37.1 },
      ],
      hasTodayVisit: false,
    },
    {
      patientId: 'AD-2026-0008',
      fullName: 'Anjali Joshi',
      age: 26,
      admissionDate: new Date(`${yesterdayStr}T15:00:00Z`),
      room: 'BED-08',
      status: 'admitted',
      dischargeRecommendationStatus: 'none',
      finalOutcome: 'unknown',
      notes: 'New admission from screening center.',
      createdBy: admin._id,
      temps: [
        { date: yesterdayStr, temp: 37.5 },
        { date: todayStr, temp: 37.2 },
      ],
      hasTodayVisit: false,
    },
    {
      patientId: 'AD-2026-0009',
      fullName: 'Vikram Malhotra',
      age: 47,
      admissionDate: new Date(`${twoDaysAgoStr}T12:00:00Z`),
      room: 'BED-09',
      status: 'admitted',
      dischargeRecommendationStatus: 'none',
      finalOutcome: 'unknown',
      notes: 'Improving appetite, coughing reduced.',
      createdBy: admin._id,
      temps: [
        { date: yesterdayStr, temp: 37.0 },
        { date: todayStr, temp: 36.8 },
      ],
      hasTodayVisit: false,
    },
    {
      patientId: 'AD-2026-0010',
      fullName: 'Neha Nair',
      age: 31,
      admissionDate: new Date(`${subtractDays(todayStr, 12)}T08:00:00Z`),
      dischargeDate: new Date(`${subtractDays(todayStr, 4)}T14:00:00Z`),
      room: 'BED-10',
      status: 'discharged',
      dischargeRecommendationStatus: 'confirmed',
      dischargeConfirmedBy: admin._id,
      finalOutcome: 'recovered',
      notes: 'Successfully recovered after 8 days quarantine.',
      createdBy: admin._id,
      temps: [
        { date: subtractDays(todayStr, 6), temp: 36.6 },
        { date: subtractDays(todayStr, 5), temp: 36.5 },
        { date: subtractDays(todayStr, 4), temp: 36.4 },
      ],
    },
    {
      patientId: 'AD-2026-0011',
      fullName: 'Amitabh Sen',
      age: 45,
      admissionDate: new Date(`${subtractDays(todayStr, 14)}T10:00:00Z`),
      dischargeDate: new Date(`${subtractDays(todayStr, 6)}T11:00:00Z`),
      room: 'BED-11',
      status: 'discharged',
      dischargeRecommendationStatus: 'confirmed',
      dischargeConfirmedBy: admin._id,
      finalOutcome: 'recovered',
      notes: 'Discharged with full clearance certificate.',
      createdBy: admin._id,
      temps: [],
    },
    {
      patientId: 'AD-2026-0012',
      fullName: 'Harishchandra Mehta',
      age: 82,
      admissionDate: new Date(`${subtractDays(todayStr, 10)}T09:30:00Z`),
      dischargeDate: new Date(`${subtractDays(todayStr, 2)}T18:00:00Z`),
      room: 'BED-12',
      status: 'discharged',
      dischargeRecommendationStatus: 'confirmed',
      dischargeConfirmedBy: admin._id,
      finalOutcome: 'deceased',
      notes: 'Patient experienced severe acute respiratory distress syndrome (ARDS) and multi-organ complications.',
      createdBy: admin._id,
      temps: [
        { date: subtractDays(todayStr, 4), temp: 39.2 },
        { date: subtractDays(todayStr, 3), temp: 39.5 },
        { date: subtractDays(todayStr, 2), temp: 39.8 },
      ],
    },
    {
      patientId: 'AD-2026-0013',
      fullName: 'Zoya Khan',
      age: 39,
      admissionDate: new Date(`${subtractDays(todayStr, 15)}T11:00:00Z`),
      dischargeDate: new Date(`${subtractDays(todayStr, 5)}T16:00:00Z`),
      room: 'BED-13',
      status: 'discharged',
      dischargeRecommendationStatus: 'confirmed',
      dischargeConfirmedBy: admin._id,
      finalOutcome: 'recovered',
      notes: 'Cleared quarantine smoothly.',
      createdBy: admin._id,
      temps: [],
    },
    {
      patientId: 'AD-2026-0014',
      fullName: 'Alok Pandey',
      age: 54,
      admissionDate: new Date(`${subtractDays(todayStr, 9)}T14:00:00Z`),
      dischargeDate: new Date(`${subtractDays(todayStr, 1)}T10:00:00Z`),
      room: 'BED-14',
      status: 'discharged',
      dischargeRecommendationStatus: 'confirmed',
      dischargeConfirmedBy: admin._id,
      finalOutcome: 'recovered',
      notes: 'Patient completed treatment protocol successfully.',
      createdBy: admin._id,
      temps: [],
    },
    {
      patientId: 'AD-2026-0015',
      fullName: 'Sunita Sharma',
      age: 49,
      admissionDate: new Date(`${subtractDays(todayStr, 11)}T12:00:00Z`),
      dischargeDate: new Date(`${subtractDays(todayStr, 3)}T15:00:00Z`),
      room: 'BED-15',
      status: 'discharged',
      dischargeRecommendationStatus: 'confirmed',
      dischargeConfirmedBy: admin._id,
      finalOutcome: 'recovered',
      notes: 'Negative PCR confirmation, discharged home.',
      createdBy: admin._id,
      temps: [],
    },
    {
      patientId: 'AD-2026-0016',
      fullName: 'Devendra Mukherjee',
      age: 67,
      admissionDate: new Date(`${subtractDays(todayStr, 16)}T07:30:00Z`),
      dischargeDate: new Date(`${subtractDays(todayStr, 7)}T13:00:00Z`),
      room: 'BED-16',
      status: 'discharged',
      dischargeRecommendationStatus: 'confirmed',
      dischargeConfirmedBy: admin._id,
      finalOutcome: 'recovered',
      notes: 'Full recovery from mild viral illness.',
      createdBy: admin._id,
      temps: [],
    },
  ];

  let activeCount = 0;

  for (const patientData of samplePatients) {
    const { temps, hasTodayVisit, visitNotes, ...pData } = patientData as any;
    const patient = await Patient.create(pData);

    if (patient.status !== 'discharged') {
      activeCount++;
    }

    if (temps && temps.length > 0) {
      for (const t of temps) {
        const isFever = t.temp >= settings.feverThresholdCelsius;
        const isUnusual = t.temp >= 38.5 || t.temp <= 35.5;
        await TemperatureRecord.create({
          patient: patient._id,
          measurementDate: t.date,
          measuredAt: new Date(`${t.date}T07:30:00Z`),
          temperatureCelsius: t.temp,
          recordedBy: nurse._id,
          isFever,
          isUnusual,
          flaggedForReview: isUnusual,
          flagReason: isUnusual ? `Flagged: ${t.temp}°C is outside typical range` : undefined,
          notes: isFever ? 'Fever observed during morning rounds' : 'Normal resting temperature',
        });
      }
    }

    if (hasTodayVisit) {
      const todayTemp = temps?.find((t: any) => t.date === todayStr);
      await DoctorVisit.create({
        patient: patient._id,
        visitDate: todayStr,
        visitedAt: new Date(`${todayStr}T10:30:00Z`),
        doctor: doctor._id,
        assessment: visitNotes || 'Patient examined. Vital signs reviewed.',
        treatmentDecision: 'Continue supportive therapy and monitored isolation.',
        dischargeRecommendation: patient.status === 'discharge_recommended',
        temperatureRecordedBeforeVisit: Boolean(todayTemp),
        temperatureAtVisit: todayTemp ? todayTemp.temp : undefined,
        isPrimaryDailyVisit: true,
      });
    }
  }

  await FacilitySettings.findByIdAndUpdate(settings._id, { currentOccupancy: activeCount });
  console.log(`Seed completed successfully! Occupied beds: ${activeCount}`);
};

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
