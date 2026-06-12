// lib/expert-engine/types.ts

export type ConfidenceKey = "Excellent" | "VeryGood" | "Good" | "Moderate";

export interface RawEvaluation<T> {
  item: T;
  rawScore: number;
  reasons: string[];
}

export interface CoreExpertResult<T> {
  item: T;
  matchScore: number;
  matchReasons: string[];
  matchConfidenceKey: ConfidenceKey;
}