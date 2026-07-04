// ============================================
// LexiFlow — Shared TypeScript Types
// ============================================

/** Part of Speech enum */
export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'preposition'
  | 'conjunction'
  | 'pronoun'
  | 'determiner'
  | 'interjection'
  | 'phrase';

/** Word entity from database */
export interface Word {
  id: string;
  user_id: string;
  word: string;
  pos: string | null;
  ipa: string | null;
  meaning: string;
  phrase: string | null;
  example: string | null;
  family: string | null;
  topic: string | null;
  note: string | null;
  source: string | null;
  favorite: boolean;
  created_at: string;
  updated_at: string;
}

/** Form data for creating/editing a word */
export interface WordFormData {
  word: string;
  pos: string;
  ipa: string;
  meaning: string;
  phrase: string;
  example: string;
  family: string;
  topic: string;
  note: string;
  source: string;
}

/** Review entity from database (SM-2 algorithm state) */
export interface Review {
  id: string;
  word_id: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  last_review: string | null;
  next_review: string;
  wrong_count: number;
  correct_count: number;
  created_at: string;
}

/** Word joined with its review data */
export interface WordWithReview extends Word {
  reviews: Review | null;
}

/** SM-2 Rating levels */
export enum Rating {
  Again = 0,  // 😵 Quên
  Hard = 3,   // 🤔 Khó
  Good = 4,   // 🙂 Nhớ
  Easy = 5,   // 😎 Dễ
}

/** Rating metadata for UI */
export interface RatingOption {
  rating: Rating;
  label: string;
  emoji: string;
  color: string;
  description: string;
}

/** SM-2 algorithm input/output */
export interface SM2Input {
  quality: number;        // 0-5 rating quality
  easeFactor: number;     // Current ease factor
  interval: number;       // Current interval in days
  repetitions: number;    // Consecutive correct answers
}

export interface SM2Output {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: Date;
}

/** Dashboard statistics */
export interface DashboardStats {
  totalWords: number;
  memorized: number;      // repetitions >= 3 && interval >= 21
  dueToday: number;       // next_review <= now
  streak: number;         // Consecutive days with reviews
  newWords: number;       // Words never reviewed (repetitions === 0)
}

/** Excel import row */
export interface ExcelRow {
  word: string;
  pos: string;
  ipa: string;
  meaning: string;
  phrase: string;
  example: string;
  note: string;
  rowNumber: number;
}

/** Import validation result */
export interface ImportValidation {
  row: ExcelRow;
  status: 'valid' | 'error' | 'duplicate';
  errors: string[];
  existingWord?: Word;
}

/** Conflict resolution strategy */
export type ConflictStrategy = 'skip' | 'overwrite' | 'update';

/** Learning session state */
export interface LearningSession {
  words: WordWithReview[];
  currentIndex: number;
  isFlipped: boolean;
  completed: number;
  totalNew: number;
  totalReview: number;
  results: SessionResult[];
}

/** Individual card result in a session */
export interface SessionResult {
  wordId: string;
  word: string;
  rating: Rating;
  wasNew: boolean;
}
