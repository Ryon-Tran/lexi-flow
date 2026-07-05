'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { USER_ID, MEMORIZED_REPETITIONS, MEMORIZED_INTERVAL_DAYS } from '@/lib/constants';
import { calculateSM2 } from '@/lib/sm2';
import { SRS_CONFIG } from '@/lib/learning-config';
import { calculateCustomSRS } from '@/lib/custom-srs';
import type { WordWithReview, DashboardStats, Rating } from '@/types';

/** Hook for learning session and review operations */
export function useReviews() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Get words due for review today (next_review <= now) */
  const getDueWords = useCallback(async (): Promise<WordWithReview[]> => {
    const supabase = createClient();
    if (!supabase) return [];

    try {
      const now = new Date().toISOString();
      const { data, error: err } = await supabase
        .from('words')
        .select(`
          *,
          reviews (*)
        `)
        .eq('user_id', USER_ID)
        .not('reviews', 'is', null);

      if (err) throw err;

      // Filter for due words (next_review <= now) and sort
      const dueWords = (data || [])
        .map((word: Record<string, unknown>) => ({
          ...word,
          reviews: Array.isArray(word.reviews) ? word.reviews[0] : word.reviews,
        }))
        .filter((word: Record<string, unknown>) => {
          if (!word.reviews) return false;
          return new Date((word.reviews as Record<string, string>).next_review) <= new Date(now);
        })
        .sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
          // New words first (repetitions === 0), then by next_review
          const aRev = a.reviews as Record<string, unknown> | undefined;
          const bRev = b.reviews as Record<string, unknown> | undefined;
          const aReps = (aRev?.repetitions as number) || 0;
          const bReps = (bRev?.repetitions as number) || 0;
          if (aReps === 0 && bReps > 0) return -1;
          if (aReps > 0 && bReps === 0) return 1;
          const aDate = new Date((aRev?.next_review as string) || 0).getTime();
          const bDate = new Date((bRev?.next_review as string) || 0).getTime();
          return aDate - bDate;
        });

      return dueWords as WordWithReview[];
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to fetch due words'
      );
    }
  }, []);

  /** Submit a rating for a word and update its review state */
  const submitRating = useCallback(
    async (wordId: string, reviewId: string, rating: Rating, currentReview: {
      ease_factor: number;
      interval_days: number;
      repetitions: number;
      correct_count?: number;
      wrong_count?: number;
    }): Promise<void> => {
      const supabase = createClient();
      if (!supabase) throw new Error('Supabase chưa được cấu hình');

      let updateData: Record<string, unknown>;

      if (SRS_CONFIG.scheduler === 'custom_srs') {
        // Normalize rating to custom srs inputs: 0 (unknown), 3 (remembered), 5 (mastered)
        let normalizedRating: 0 | 3 | 5 = 3;
        if (rating === 0) normalizedRating = 0;
        else if (rating === 5) normalizedRating = 5;

        const result = calculateCustomSRS({
          rating: normalizedRating,
          currentLevel: currentReview.repetitions,
        });

        updateData = {
          repetitions: result.level,
          interval_days: result.intervalDays,
          last_review: new Date().toISOString(),
          next_review: result.nextReview.toISOString(),
        };

        if (result.isWrong) {
          updateData.wrong_count = (currentReview.wrong_count || 0) + 1;
        } else {
          updateData.correct_count = (currentReview.correct_count || 0) + 1;
        }
      } else {
        const result = calculateSM2({
          quality: rating as number,
          easeFactor: currentReview.ease_factor,
          interval: currentReview.interval_days,
          repetitions: currentReview.repetitions,
        });

        const isCorrect = (rating as number) >= 3;

        updateData = {
          ease_factor: result.easeFactor,
          interval_days: result.interval,
          repetitions: result.repetitions,
          last_review: new Date().toISOString(),
          next_review: result.nextReview.toISOString(),
        };

        // Increment the appropriate counter
        if (isCorrect) {
          updateData.correct_count = (currentReview.correct_count || 0) + 1;
        } else {
          updateData.wrong_count = (currentReview.wrong_count || 0) + 1;
        }
      }

      const { error: err } = await supabase
        .from('reviews')
        .update(updateData)
        .eq('id', reviewId);

      if (err) throw err;
    },
    []
  );

  /** Get dashboard statistics */
  const getStats = useCallback(async (): Promise<DashboardStats> => {
    const supabase = createClient();
    if (!supabase) {
      return { totalWords: 0, memorized: 0, dueToday: 0, streak: 0, newWords: 0 };
    }

    try {
      const now = new Date().toISOString();

      // Get all words with reviews
      const { data, error: err } = await supabase
        .from('words')
        .select(`
          id,
          reviews (
            repetitions,
            interval_days,
            next_review,
            last_review
          )
        `)
        .eq('user_id', USER_ID);

      if (err) throw err;

      const words = data || [];
      const totalWords = words.length;

      let memorized = 0;
      let dueToday = 0;
      let newWords = 0;
      const reviewDates: string[] = [];

      words.forEach((word: Record<string, unknown>) => {
        const review = Array.isArray(word.reviews)
          ? word.reviews[0]
          : word.reviews;

        if (!review) {
          newWords++;
          dueToday++;
          return;
        }

        const isCustom = SRS_CONFIG.scheduler === 'custom_srs';
        const isMemorized = isCustom
          ? review.repetitions >= 5
          : review.repetitions >= MEMORIZED_REPETITIONS && review.interval_days >= MEMORIZED_INTERVAL_DAYS;

        if (isMemorized) {
          memorized++;
        }

        if (new Date(review.next_review) <= new Date(now)) {
          dueToday++;
        }

        if (review.repetitions === 0) {
          newWords++;
        }

        if (review.last_review) {
          reviewDates.push(review.last_review);
        }
      });

      // Calculate streak
      const streak = calculateStreak(reviewDates);

      return { totalWords, memorized, dueToday, streak, newWords };
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to fetch stats'
      );
    }
  }, []);

  return {
    loading,
    error,
    getDueWords,
    submitRating,
    getStats,
    setLoading,
    setError,
  };
}

/** Calculate consecutive days streak from review dates */
function calculateStreak(reviewDates: string[]): number {
  if (reviewDates.length === 0) return 0;

  // Get unique dates (YYYY-MM-DD)
  const uniqueDates = [
    ...new Set(
      reviewDates.map((d) => {
        const date = new Date(d);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      })
    ),
  ].sort().reverse();

  if (uniqueDates.length === 0) return 0;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Check if there's activity today or yesterday
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) {
    return 0;
  }

  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const curr = new Date(uniqueDates[i - 1]);
    const prev = new Date(uniqueDates[i]);
    const diffDays = Math.round(
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
