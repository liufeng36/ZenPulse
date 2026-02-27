export enum InputMode {
  FACE_HAND = 'FACE_HAND',
  HAND_ONLY = 'HAND_ONLY',
  DATA_ONLY = 'DATA_ONLY',
  MEDICAL_REPORT = 'MEDICAL_REPORT',
}

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  UNSPECIFIED = 'Unspecified'
}

export interface UserProfile {
  gender: Gender;
  age?: number; // Manual entry for Data Only mode
  chronicConditions: string[]; // e.g., "High Blood Pressure"
  customSymptoms?: string; // User typed history/symptoms
  hasWellnessNeeds: boolean;
}

export interface VisualFeature {
  area: string;
  finding: string;
  implication: string;
  severity: 'Low' | 'Medium' | 'High';
}

export interface DietItem {
  name: string;
  description: string;
  tag: string; // e.g., "Low GI", "Low Sodium"
  value: string; // e.g., "GI: 45", "Na: 50mg"
  ingredients: string[]; // New: List of ingredients
  recipe: string; // New: Preparation method
  imageUrl?: string; // New: URL for the food image
}

export interface ExerciseItem {
  name: string;
  duration: string;
  intensity: 'Level 1' | 'Level 2' | 'Level 3';
  benefit: string;
  isChronicFriendly: boolean;
  instructions: string; // New: How to perform the exercise
  imageUrl?: string; // New: URL for the exercise demonstration
}

export interface DailyPlan {
  diet: {
    breakfast: DietItem;
    lunch: DietItem;
    dinner: DietItem;
    snack?: DietItem;
  };
  exercise: ExerciseItem[];
  advice: string; // "One sentence optimization"
}

export interface HealthTrend {
  date: string;
  score: number;
  reportId?: string; // New: Link to full report
}

export interface AnalysisResult {
  id: string; // New: Unique ID for the report
  timestamp: string; // New: When the analysis was done
  nextPredictionDate: string; // New: Suggested next scan date
  tcmBodyType: string; // e.g., "Qi Deficiency"
  chronicRiskLevel: 'Low' | 'Medium' | 'High';
  chronicRiskType: string; // e.g., "Hypertension Risk"
  healthScore: number;
  predictedAge: number; // AI predicted or User entered
  detectedGender: string; // AI detected or User entered
  visualFeatures: VisualFeature[]; // Simulated MobileNet findings
  summary: string; // Detailed 300-word summary
  plan: DailyPlan;
  trends: HealthTrend[]; // Simulated LSTM prediction
}
