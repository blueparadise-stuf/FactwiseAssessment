export type UserRole = 'Administrator' | 'Nurse' | 'Doctor' | 'FacilityManager';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export type PatientStatus = 'admitted' | 'discharge_recommended' | 'discharged';
export type DischargeRecommendationStatus = 'none' | 'recommended' | 'confirmed' | 'rejected';
export type FinalOutcome = 'recovered' | 'deceased' | 'unknown';

export interface Patient {
  _id: string;
  patientId: string;
  fullName: string;
  age: number;
  dateOfBirth?: string;
  admissionDate: string;
  dischargeDate?: string;
  room: string;
  status: PatientStatus;
  dischargeRecommendationStatus: DischargeRecommendationStatus;
  dischargeRecommendedAt?: string;
  dischargeRecommendedBy?: User;
  dischargeRecommendationNotes?: string;
  dischargeConfirmedBy?: User;
  dischargeConfirmedAt?: string;
  finalOutcome: FinalOutcome;
  notes?: string;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface TemperatureCorrection {
  previousTemperature: number;
  correctedBy: User;
  correctedAt: string;
  reason: string;
}

export interface TemperatureRecord {
  _id: string;
  patient: Patient | string;
  measurementDate: string;
  measuredAt: string;
  temperatureCelsius: number;
  recordedBy: User;
  notes?: string;
  isFever: boolean;
  isUnusual: boolean;
  flaggedForReview: boolean;
  flagReason?: string;
  correctionHistory: TemperatureCorrection[];
}

export interface DoctorVisit {
  _id: string;
  patient: Patient | string;
  visitDate: string;
  visitedAt: string;
  doctor: User;
  assessment: string;
  treatmentDecision: string;
  dischargeRecommendation: boolean;
  recommendationReason?: string;
  temperatureRecordedBeforeVisit: boolean;
  temperatureAtVisit?: number;
  isPrimaryDailyVisit: boolean;
}

export interface StreakDayDetail {
  date: string;
  hasReading: boolean;
  temperatureCelsius?: number;
  isFever?: boolean;
  status: 'fever_free' | 'fever' | 'missing';
}

export interface DischargeEligibility {
  patientId: string;
  isEligible: boolean;
  feverFreeStreak: number;
  requiredStreak: number;
  ruleUsed: string;
  feverThreshold: number;
  streakDetails: StreakDayDetail[];
  explanation: string;
  canRecommend: boolean;
  recommendationStatus: string;
}

export interface FacilitySettings {
  facilityName: string;
  capacity: number;
  currentOccupancy: number;
  timezone: string;
  feverThresholdCelsius: number;
  feverFreeEligibilityRule: string;
}

export interface DashboardSummary {
  facility: {
    name: string;
    capacity: number;
    occupiedBeds: number;
    availableBeds: number;
    occupancyPercentage: number;
    timezone: string;
    feverThreshold: number;
    eligibilityRule: string;
  };
  today: {
    date: string;
    temperaturesPending: number;
    temperaturesCompleted: number;
    doctorVisitsPending: number;
    doctorVisitsCompleted: number;
    dischargeCandidatesCount: number;
  };
  patientCounts: {
    totalAdmittedAllTime: number;
    currentActive: number;
    totalDischarged: number;
  };
  outcomes: {
    knownOutcomesCount: number;
    totalRecovered: number;
    totalDeceased: number;
    totalUnknown: number;
    mortalityRate: number;
    survivalRate: number;
    mortalityBenchmark: number;
    survivalBenchmark: number;
    mortalityWarning: boolean;
    hasSufficientData: boolean;
  };
  recentAdmissions: Patient[];
  recentDischarges: Patient[];
}
