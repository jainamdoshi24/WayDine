import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ScoreComponents } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `<1 min`;
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function formatTime(isoString: string): string {
  try {
    return new Date(isoString).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  } catch { return '—'; }
}

export function priceLevelSymbol(level: number): string {
  return '₹'.repeat(Math.min(Math.max(level, 1), 4));
}

export function getRatingColor(rating: number | null): string {
  if (rating === null) return 'text-slate-400';
  if (rating >= 4.3)  return 'text-emerald-600';
  if (rating >= 3.8)  return 'text-amber-600';
  return 'text-red-500';
}

export function getScoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-red-500';
}

export function getScoreBg(score: number): string {
  if (score >= 75) return 'bg-emerald-50 border-emerald-200';
  if (score >= 50) return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
}

export function getScoreRingColor(score: number): string {
  if (score >= 75) return '#16a34a';
  if (score >= 50) return '#d97706';
  return '#dc2626';
}

export function scoreLabel(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Great';
  if (score >= 55) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
}

/** Human-readable names for score components */
export const SCORE_COMPONENT_LABELS: Record<keyof ScoreComponents, string> = {
  detourEfficiency:     'Detour efficiency',
  directionSuitability: 'Direction suitability',
  accessibility:        'Road accessibility',
  timeSuitability:      'Meal timing',
  preferenceMatch:      'Preference match',
};

/** Default score weights for display */
export const SCORE_WEIGHTS: Record<keyof ScoreComponents, number> = {
  detourEfficiency:     0.35,
  directionSuitability: 0.25,
  accessibility:        0.20,
  timeSuitability:      0.10,
  preferenceMatch:      0.10,
};
