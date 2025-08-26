
export enum AppState {
  IDLE,
  ANALYZING,
  SUCCESS,
  ERROR,
  HISTORY,
  CAMERA_ACTIVE,
}

export interface AnalysisCategory {
  title: string;
  description: string;
}

export interface AncestryAnalysis extends AnalysisCategory {
  metrics: {
    globalPrevalence: string;
    regionalHotspots: string[];
    geneticProbability: string;
  };
}

export interface RarityAnalysis extends AnalysisCategory {
  percentage: number;
}

export interface HealthIndicator {
  name: string;
  description: string;
  level: 'Low' | 'Moderate' | 'High' | 'Normal';
}

export interface IrisAnalysis {
  ancestry: AncestryAnalysis;
  healthClues: AnalysisCategory;
  biometricSignature: AnalysisCategory;
  rarityIndex: RarityAnalysis;
  personalityVibe: AnalysisCategory;
  pigmentOddities: AnalysisCategory;
  healthIndicators: HealthIndicator[];
  uniquePatterns: {
    name: string;
    description: string;
  }[];
  dominantColor: {
    name: string;
    confidence: number;
    hexCode: string;
  };
  colorComposition: {
    colorName: string;
    hexCode: string;
    percentage: number;
  }[];
}

export interface HistoryItem {
  id: number; // timestamp
  date: string; // ISO string
  imageSrc: string;
  analysis: IrisAnalysis;
}