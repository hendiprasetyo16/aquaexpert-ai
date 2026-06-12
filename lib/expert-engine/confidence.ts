// lib/expert-engine/confidence.ts
import { ConfidenceKey } from "./types";

export function calculateConfidence(score: number): ConfidenceKey {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "VeryGood";
  if (score >= 60) return "Good";
  return "Moderate";
}