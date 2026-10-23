import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import { Patient } from '../src/models/Patient.js';
import { TemperatureRecord } from '../src/models/TemperatureRecord.js';
import { DoctorVisit } from '../src/models/DoctorVisit.js';
import { FacilitySettings } from '../src/models/FacilitySettings.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { connectDB } from '../src/config/db.js';
import { getTodayString, subtractDays } from '../src/utils/dateUtils.js';
export const seedDatabase = async () => {
    console.log('Seeding CareTrack development demo dataset...');
    // Ensure DB connected
    if (mongoose.connection.readyState !== 1) {
        await connectDB();
    }
    // Clear existing collections safely for clean seed
    await Promise.all([
        User.deleteMany({}),
        Patient.deleteMany({}),
        TemperatureRecord.deleteMany({}),
        DoctorVisit.deleteMany({}),
        FacilitySettings.deleteMany({}),
        AuditLog.deleteMany({}),
    ]);
    // 1. Create Facility Settings
    const settings = await FacilitySettings.create({
        facilityName: 'CareTrack Virus Quarantine & Treatment Facility',
        capacity: 74,
        currentOccupancy: 0,
        timezone: 'UTC',
        feverThresholdCelsius: 38.0,
        feverFreeEligibilityRule: 'THREE_FULL_CALENDAR_DAYS',
    });
    // 2. Create the 4 Demo Users
    const salt = await bcrypt.genSalt(10);
    const passwordAdmin = await bcrypt.hash('Admin@123', salt);
    const passwordNurse = await bcrypt.hash('Nurse@123', salt);
    const passwordDoctor = await bcrypt.hash('Doctor@123', salt);
    const passwordManager = await bcrypt.hash('Manager@123', salt);
    const admin = await User.create({
        name: 'Dr. Sarah Chen (Chief Administrator)',
        email: 'admin@caretrack.org',
        passwordHash: passwordAdmin,
        role: 'Administrator',
        isActive: true,
    });
    const nurse = await User.create({
        name: 'Nurse David Kim, BSN RN',
        email: 'nurse@caretrack.org',
        passwordHash: passwordNurse,
        role: 'Nurse',
        isActive: true,
    });
    const doctor = await User.create({
        name: 'Dr. Marcus Patel, MD (Infectious Disease)',
        email: 'doctor@caretrack.org',
        passwordHash: passwordDoctor,
        role: 'Doctor',
        isActive: true,
    });
    const manager = await User.create({
        name: 'Elena Rostova (Operations Director)',
        email: 'manager@caretrack.org',
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
    // 3. Create Fictional Patients with diverse clinical journeys
    const samplePatients = [
        // --- GROUP A: Patients Qualified for Discharge (3 consecutive fever-free days below 38.0°C) ---
        {
            patientId: 'CT-2026-0001',
            fullName: 'Johnathan Hayes',
            age: 42,
            admissionDate: new Date(`${fiveDaysAgoStr}T09:00:00Z`),
            room: 'BED-01',
            status: 'admitted',
            dischargeRecommendationStatus: 'none',
            finalOutcome: 'unknown',
            notes: 'Admitted with respiratory symptoms. Responded well to antiviral regimen.',
            createdBy: admin._id,
            // Temps: 4, 3, 2, 1 days ago and today all normal
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
            patientId: 'CT-2026-0002',
            fullName: 'Amina Al-Mansoor',
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
            patientId: 'CT-2026-0003',
            fullName: 'Robert Sterling',
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
        // --- GROUP B: Active Patients with Active Fever (Resets streak) ---
        {
            patientId: 'CT-2026-0004',
            fullName: 'Clara Oswald',
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
                { date: yesterdayStr, temp: 38.9 }, // Fever!
                { date: todayStr, temp: 38.2 }, // Fever!
            ],
            hasTodayVisit: true,
            visitNotes: 'Persistent febrile state. Added antipyretics and ordered blood cultures.',
        },
        {
            patientId: 'CT-2026-0005',
            fullName: 'Dante Moretti',
            age: 63,
            admissionDate: new Date(`${twoDaysAgoStr}T16:45:00Z`),
            room: 'BED-05',
            status: 'admitted',
            dischargeRecommendationStatus: 'none',
            finalOutcome: 'unknown',
            notes: 'Shortness of breath on exertion. Oxygen saturation 95%.',
            createdBy: admin._id,
            temps: [
                { date: yesterdayStr, temp: 38.4 },
                // Today temperature pending!
            ],
            hasTodayVisit: false,
        },
        // --- GROUP C: Patients with Missing Temperature Measurement Today ---
        {
            patientId: 'CT-2026-0006',
            fullName: 'Grace Hopper-Vance',
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
                // No today temp! (Pending measurement)
            ],
            hasTodayVisit: false, // Pending doctor visit
        },
        {
            patientId: 'CT-2026-0007',
            fullName: 'Kwame Mensah',
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
                // No today temp
            ],
            hasTodayVisit: false,
        },
        // --- GROUP D: Patients with Today Temperature Done, Pending Doctor Visit ---
        {
            patientId: 'CT-2026-0008',
            fullName: 'Mei-Ling Zhou',
            age: 26,
            admissionDate: new Date(`${yesterdayStr}T15:00:00Z`),
            room: 'BED-08',
            status: 'admitted',
            dischargeRecommendationStatus: 'none',
            finalOutcome: 'unknown',
            notes: 'New admission from border screening.',
            createdBy: admin._id,
            temps: [
                { date: yesterdayStr, temp: 37.5 },
                { date: todayStr, temp: 37.2 },
            ],
            hasTodayVisit: false, // Pending doctor round
        },
        {
            patientId: 'CT-2026-0009',
            fullName: 'Santiago Cruz',
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
        // --- GROUP E: Historical Discharged Patients (To verify mortality & survival benchmark) ---
        // Benchmark: 15% mortality, 85% survival
        // Let's seed 8 recovered patients and 1 deceased patient (Mortality = 1 / 9 = 11.1%) + 1 unknown
        {
            patientId: 'CT-2026-0010',
            fullName: 'Helena Berg',
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
            patientId: 'CT-2026-0011',
            fullName: 'Tariq O\'Connor',
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
            patientId: 'CT-2026-0012',
            fullName: 'Arthur Pendelton',
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
            patientId: 'CT-2026-0013',
            fullName: 'Fatima Zahra',
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
            patientId: 'CT-2026-0014',
            fullName: 'Liam Gallagher',
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
            patientId: 'CT-2026-0015',
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
            patientId: 'CT-2026-0016',
            fullName: 'George Washington Carver Jr.',
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
        const { temps, hasTodayVisit, visitNotes, ...pData } = patientData;
        const patient = await Patient.create(pData);
        if (patient.status !== 'discharged') {
            activeCount++;
        }
        // Insert temperature records
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
        // Insert doctor visit if flagged
        if (hasTodayVisit) {
            const todayTemp = temps?.find((t) => t.date === todayStr);
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
    // Update occupancy count in facility settings
    await FacilitySettings.findByIdAndUpdate(settings._id, { currentOccupancy: activeCount });
    console.log('Seed completed successfully!');
    console.log(`- Created 4 Demo Users:`);
    console.log(`  * Administrator: admin@caretrack.org / Admin@123`);
    console.log(`  * Nurse: nurse@caretrack.org / Nurse@123`);
    console.log(`  * Doctor: doctor@caretrack.org / Doctor@123`);
    console.log(`  * Facility Manager: manager@caretrack.org / Manager@123`);
    console.log(`- Seeded ${samplePatients.length} Patients (Active: ${activeCount}, Discharged: ${samplePatients.length - activeCount})`);
    console.log(`- Facility capacity: 74 beds, Occupied: ${activeCount}`);
};
// If run directly from CLI
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
    seedDatabase()
        .then(() => process.exit(0))
        .catch((err) => {
        console.error('Seed failed:', err);
        process.exit(1);
    });
}
