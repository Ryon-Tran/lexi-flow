// ============================================
// LexiFlow — Custom Spaced Repetition Scheduler
// ============================================

export interface CustomSRSInput {
  rating: 0 | 3 | 5; // 0: Chưa biết (Wrong), 3: Khá nhớ (Remembered), 5: Đã thuộc (Mastered)
  currentLevel: number; // mapped to repetitions
}

export interface CustomSRSOutput {
  level: number;
  intervalDays: number;
  nextReview: Date;
  isWrong: boolean;
}

/**
 * Calculates review intervals based on custom user requirements:
 * - Sai (rating = 0): Ôn lại sau 10 phút (next review due in 10 minutes, level resets to 0)
 * - Đúng lần 1 (rating = 3, level = 1): Ôn lại sau 1 ngày
 * - Đúng lần 2 (rating = 3, level = 2): Ôn lại sau 3 ngày
 * - Đúng lần 3 (rating = 3, level = 3): Ôn lại sau 7 ngày
 * - Đúng lần 4 (rating = 3, level = 4): Ôn lại sau 14 ngày
 * - Đúng lần 5 (rating = 3, level = 5): Ôn lại sau 30 ngày
 * - Đã thuộc (rating = 5): Ôn lại sau 30 ngày, level đặt thành 5 trực tiếp.
 */
export function calculateCustomSRS(input: CustomSRSInput): CustomSRSOutput {
  const { rating, currentLevel } = input;
  let nextLevel = currentLevel;
  let intervalMinutes = 0;
  let isWrong = false;

  if (rating === 0) {
    // Forgot/Wrong
    nextLevel = 0;
    intervalMinutes = 10; // 10 minutes
    isWrong = true;
  } else if (rating === 5) {
    // Mastered directly
    nextLevel = 5;
    intervalMinutes = 30 * 24 * 60; // 30 days in minutes
  } else {
    // rating === 3 (Khá nhớ / Correct progression)
    // Advance to next level (0 -> 1 -> 2 -> 3 -> 4 -> 5)
    nextLevel = Math.min(5, currentLevel + 1);
    if (nextLevel === 0) {
      nextLevel = 1;
    }

    switch (nextLevel) {
      case 1:
        intervalMinutes = 1 * 24 * 60; // 1 day
        break;
      case 2:
        intervalMinutes = 3 * 24 * 60; // 3 days
        break;
      case 3:
        intervalMinutes = 7 * 24 * 60; // 7 days
        break;
      case 4:
        intervalMinutes = 14 * 24 * 60; // 14 days
        break;
      case 5:
      default:
        intervalMinutes = 30 * 24 * 60; // 30 days
        break;
    }
  }

  const nextReview = new Date();
  nextReview.setMinutes(nextReview.getMinutes() + intervalMinutes);

  return {
    level: nextLevel,
    intervalDays: Math.round(intervalMinutes / (24 * 60)),
    nextReview,
    isWrong,
  };
}

/**
 * Gets a friendly string label for the custom scheduler interval
 */
export function getCustomIntervalLabel(level: number, rating: number): string {
  if (rating === 0) return '10 phút';
  if (rating === 5 || level === 5) return '30 ngày';
  switch (level) {
    case 1: return '1 ngày';
    case 2: return '3 ngày';
    case 3: return '7 ngày';
    case 4: return '14 ngày';
    case 5: return '30 ngày';
    default: return '10 phút';
  }
}
