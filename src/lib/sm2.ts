// ============================================
// LexiFlow — SM-2 Spaced Repetition Algorithm
// ============================================
// Simplified SM-2 (SuperMemo 2) algorithm, similar to Anki.
// Calculates the next review interval based on user rating.

import type { SM2Input, SM2Output } from '@/types';
import { SM2_DEFAULTS } from './constants';

/**
 * Core SM-2 algorithm implementation.
 *
 * Quality ratings:
 * - 0 (Again/Quên): Complete failure, reset repetitions
 * - 3 (Hard/Khó): Correct but difficult, shorter interval
 * - 4 (Good/Nhớ): Correct with some effort, normal interval
 * - 5 (Easy/Dễ): Perfect recall, longer interval
 *
 * @param input Current review state and user quality rating
 * @returns New review state with next review date
 */
export function calculateSM2(input: SM2Input): SM2Output {
  const { quality, easeFactor, interval, repetitions } = input;

  // If answer was wrong (quality < 3), reset
  if (quality < 3) {
    return {
      easeFactor: Math.max(
        SM2_DEFAULTS.MIN_EASE_FACTOR,
        easeFactor - 0.2
      ),
      interval: 0, // Review again immediately (same session or next)
      repetitions: 0,
      nextReview: new Date(), // Due now
    };
  }

  // Calculate new ease factor using SM-2 formula
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const newEaseFactor = Math.max(
    SM2_DEFAULTS.MIN_EASE_FACTOR,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  const newRepetitions = repetitions + 1;

  // Calculate interval based on repetition count
  let newInterval: number;
  if (newRepetitions === 1) {
    newInterval = 1; // First correct: review tomorrow
  } else if (newRepetitions === 2) {
    newInterval = 6; // Second correct: review in 6 days
  } else {
    newInterval = Math.round(interval * newEaseFactor);
  }

  // Apply modifier based on quality
  if (quality === 3) {
    // Hard: reduce interval by 50% (but at least 1 day)
    newInterval = Math.max(1, Math.round(newInterval * 0.5));
  } else if (quality === 5) {
    // Easy: increase interval by 30%
    newInterval = Math.round(newInterval * 1.3);
  }

  // Calculate next review date
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReview,
  };
}

/**
 * Get a human-readable description of when the next review will be.
 */
export function getIntervalLabel(intervalDays: number): string {
  if (intervalDays === 0) return 'Ngay bây giờ';
  if (intervalDays === 1) return '1 ngày';
  if (intervalDays < 7) return `${intervalDays} ngày`;
  if (intervalDays < 30) {
    const weeks = Math.round(intervalDays / 7);
    return `${weeks} tuần`;
  }
  if (intervalDays < 365) {
    const months = Math.round(intervalDays / 30);
    return `${months} tháng`;
  }
  const years = Math.round(intervalDays / 365);
  return `${years} năm`;
}

/**
 * Check if a word is considered "memorized" based on SM-2 state.
 * Memorized = at least 3 successful repetitions and interval >= 21 days.
 */
export function isMemorized(repetitions: number, interval: number): boolean {
  return repetitions >= 3 && interval >= 21;
}
