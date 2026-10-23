import { Patient } from '../models/Patient.js';
import { TemperatureRecord } from '../models/TemperatureRecord.js';
import { DoctorVisit } from '../models/DoctorVisit.js';
import { FacilitySettings } from '../models/FacilitySettings.js';
import { getOrCreateSettings } from './patientService.js';
import { getPendingTemperaturePatients } from './temperatureService.js';
import { getDoctorRoundsQueue } from './doctorVisitService.js';
import { getDischargeCandidates } from './dischargeService.js';
import { getTodayString, subtractDays } from '../utils/dateUtils.js';

export const getDashboardSummary = async () => {
  const settings = await getOrCreateSettings();
  const todayStr = getTodayString(new Date(), settings.timezone);

  // Active patients
  const activeCount = await Patient.countDocuments({
    status: { $in: ['admitted', 'discharge_recommended'] },
  });

  const totalPatientsAllTime = await Patient.countDocuments();
  const totalDischarged = await Patient.countDocuments({ status: 'discharged' });
  const totalRecovered = await Patient.countDocuments({ finalOutcome: 'recovered' });
  const totalDeceased = await Patient.countDocuments({ finalOutcome: 'deceased' });
  const totalUnknown = await Patient.countDocuments({ finalOutcome: 'unknown' });

  const availableBeds = Math.max(0, settings.capacity - activeCount);

  // Today's tasks
  const tempStatus = await getPendingTemperaturePatients(todayStr);
  const doctorStatus = await getDoctorRoundsQueue(todayStr);
  const dischargeData = await getDischargeCandidates();

  // Recent 5 admissions
  const recentAdmissions = await Patient.find()
    .sort({ admissionDate: -1 })
    .limit(5)
    .populate('createdBy', 'name email');

  // Recent 5 discharges
  const recentDischarges = await Patient.find({ status: 'discharged' })
    .sort({ dischargeDate: -1 })
    .limit(5)
    .populate('dischargeConfirmedBy', 'name email');

  // Outcomes calculation
  const knownOutcomesCount = totalRecovered + totalDeceased;
  const mortalityRate = knownOutcomesCount > 0 ? (totalDeceased / knownOutcomesCount) * 100 : 0;
  const survivalRate = knownOutcomesCount > 0 ? (totalRecovered / knownOutcomesCount) * 100 : 0;
  const mortalityWarning = knownOutcomesCount > 0 && mortalityRate > 15;

  return {
    facility: {
      name: settings.facilityName,
      capacity: settings.capacity,
      occupiedBeds: activeCount,
      availableBeds,
      occupancyPercentage: Math.round((activeCount / settings.capacity) * 100),
      timezone: settings.timezone,
      feverThreshold: settings.feverThresholdCelsius,
      eligibilityRule: settings.feverFreeEligibilityRule,
    },
    today: {
      date: todayStr,
      temperaturesPending: tempStatus.pendingCount,
      temperaturesCompleted: tempStatus.completedCount,
      doctorVisitsPending: doctorStatus.pendingCount,
      doctorVisitsCompleted: doctorStatus.completedCount,
      dischargeCandidatesCount: dischargeData.candidateCount,
    },
    patientCounts: {
      totalAdmittedAllTime: totalPatientsAllTime,
      currentActive: activeCount,
      totalDischarged,
    },
    outcomes: {
      knownOutcomesCount,
      totalRecovered,
      totalDeceased,
      totalUnknown,
      mortalityRate: Number(mortalityRate.toFixed(1)),
      survivalRate: Number(survivalRate.toFixed(1)),
      mortalityBenchmark: 15,
      survivalBenchmark: 85,
      mortalityWarning,
      hasSufficientData: knownOutcomesCount > 0,
    },
    recentAdmissions,
    recentDischarges,
  };
};

export const getOutcomesReport = async (startDate?: string, endDate?: string) => {
  const query: Record<string, any> = {};

  if (startDate || endDate) {
    query.admissionDate = {};
    if (startDate) query.admissionDate.$gte = new Date(startDate);
    if (endDate) query.admissionDate.$lte = new Date(`${endDate}T23:59:59Z`);
  }

  const [
    totalPatients,
    activePatients,
    dischargedPatients,
    recoveredCount,
    deceasedCount,
    unknownOutcomeCount,
  ] = await Promise.all([
    Patient.countDocuments(query),
    Patient.countDocuments({ ...query, status: { $in: ['admitted', 'discharge_recommended'] } }),
    Patient.countDocuments({ ...query, status: 'discharged' }),
    Patient.countDocuments({ ...query, finalOutcome: 'recovered' }),
    Patient.countDocuments({ ...query, finalOutcome: 'deceased' }),
    Patient.countDocuments({ ...query, finalOutcome: 'unknown' }),
  ]);

  const knownOutcomesDenominator = recoveredCount + deceasedCount;
  const mortalityRate =
    knownOutcomesDenominator > 0
      ? Number(((deceasedCount / knownOutcomesDenominator) * 100).toFixed(2))
      : 0;
  const survivalRate =
    knownOutcomesDenominator > 0
      ? Number(((recoveredCount / knownOutcomesDenominator) * 100).toFixed(2))
      : 0;

  const mortalityBenchmark = 15;
  const survivalBenchmark = 85;
  const mortalityWarning = knownOutcomesDenominator > 0 && mortalityRate > mortalityBenchmark;

  // Breakdown by age brackets
  const ageBrackets = [
    { label: '< 18', min: 0, max: 17 },
    { label: '18-40', min: 18, max: 40 },
    { label: '41-65', min: 41, max: 65 },
    { label: '> 65', min: 66, max: 130 },
  ];

  const ageBreakdown = await Promise.all(
    ageBrackets.map(async (bracket) => {
      const count = await Patient.countDocuments({
        ...query,
        age: { $gte: bracket.min, $lte: bracket.max },
      });
      const recovered = await Patient.countDocuments({
        ...query,
        age: { $gte: bracket.min, $lte: bracket.max },
        finalOutcome: 'recovered',
      });
      const deceased = await Patient.countDocuments({
        ...query,
        age: { $gte: bracket.min, $lte: bracket.max },
        finalOutcome: 'deceased',
      });
      const known = recovered + deceased;
      return {
        bracket: bracket.label,
        total: count,
        recovered,
        deceased,
        mortalityRate: known > 0 ? Number(((deceased / known) * 100).toFixed(1)) : 0,
      };
    })
  );

  return {
    cohortDefinition:
      'All patients with recorded final outcome (Recovered or Deceased). Ongoing active patients are excluded from denominator to avoid underestimating mortality rate.',
    sampleSize: {
      totalAdmitted: totalPatients,
      currentlyActive: activePatients,
      discharged: dischargedPatients,
      knownFinalOutcomes: knownOutcomesDenominator,
      pendingOrUnknownOutcomes: unknownOutcomeCount,
    },
    metrics: {
      recovered: recoveredCount,
      deceased: deceasedCount,
      mortalityRate,
      survivalRate,
      mortalityBenchmark,
      survivalBenchmark,
      mortalityWarning,
      hasSufficientData: knownOutcomesDenominator >= 5,
      isSmallSample: knownOutcomesDenominator < 10,
    },
    ageBreakdown,
  };
};

export const getOccupancyAndTaskTrends = async (days = 7) => {
  const settings = await getOrCreateSettings();
  const todayStr = getTodayString(new Date(), settings.timezone);

  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    dates.push(subtractDays(todayStr, i));
  }

  const trendData = await Promise.all(
    dates.map(async (date) => {
      const [tempCount, visitCount, admissionsOnDate, dischargesOnDate] = await Promise.all([
        TemperatureRecord.countDocuments({ measurementDate: date }),
        DoctorVisit.countDocuments({ visitDate: date, isPrimaryDailyVisit: true }),
        Patient.countDocuments({
          admissionDate: {
            $gte: new Date(`${date}T00:00:00.000Z`),
            $lte: new Date(`${date}T23:59:59.999Z`),
          },
        }),
        Patient.countDocuments({
          dischargeDate: {
            $gte: new Date(`${date}T00:00:00.000Z`),
            $lte: new Date(`${date}T23:59:59.999Z`),
          },
        }),
      ]);

      return {
        date,
        temperaturesLogged: tempCount,
        doctorVisitsLogged: visitCount,
        admissions: admissionsOnDate,
        discharges: dischargesOnDate,
      };
    })
  );

  return trendData;
};
