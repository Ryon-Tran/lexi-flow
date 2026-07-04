// ============================================
// LexiFlow — Constants & Configuration
// ============================================

/** Fixed user ID for single-user MVP (no auth needed) */
export const USER_ID = '00000000-0000-0000-0000-000000000001';

/** Number of new words per day */
export const NEW_WORDS_PER_DAY = 20;

/** SM-2 Default values */
export const SM2_DEFAULTS = {
  EASE_FACTOR: 2.5,
  MIN_EASE_FACTOR: 1.3,
  INITIAL_INTERVAL: 0,
  INITIAL_REPETITIONS: 0,
} as const;

/** Rating options for UI */
export const RATING_OPTIONS = [
  {
    rating: 0 as const,
    label: 'Quên',
    emoji: '😵',
    color: 'var(--rating-forgot)',
    description: 'Không nhớ gì, xem lại ngay',
  },
  {
    rating: 3 as const,
    label: 'Khó',
    emoji: '🤔',
    color: 'var(--rating-hard)',
    description: 'Nhớ mang máng, cần ôn sớm',
  },
  {
    rating: 4 as const,
    label: 'Nhớ',
    emoji: '🙂',
    color: 'var(--rating-good)',
    description: 'Nhớ được, ổn',
  },
  {
    rating: 5 as const,
    label: 'Dễ',
    emoji: '😎',
    color: 'var(--rating-easy)',
    description: 'Quá dễ, tăng khoảng cách',
  },
] as const;

/** Part of Speech options */
export const POS_OPTIONS = [
  { value: 'noun', label: 'Noun (n.)' },
  { value: 'verb', label: 'Verb (v.)' },
  { value: 'adjective', label: 'Adjective (adj.)' },
  { value: 'adverb', label: 'Adverb (adv.)' },
  { value: 'preposition', label: 'Preposition (prep.)' },
  { value: 'conjunction', label: 'Conjunction (conj.)' },
  { value: 'pronoun', label: 'Pronoun (pron.)' },
  { value: 'determiner', label: 'Determiner (det.)' },
  { value: 'interjection', label: 'Interjection (interj.)' },
  { value: 'phrase', label: 'Phrase' },
] as const;

/** TOEIC Topic categories */
export const TOPIC_OPTIONS = [
  'General Business',
  'Office',
  'Finance & Banking',
  'Marketing & Sales',
  'Human Resources',
  'Manufacturing',
  'Technology',
  'Travel & Tourism',
  'Dining & Food',
  'Health & Wellness',
  'Entertainment',
  'Housing & Property',
  'Shopping & Retail',
  'Transportation',
  'Education',
  'Law & Regulations',
  'Environment',
  'Communication',
  'Other',
] as const;

/** Excel template column mapping */
export const EXCEL_COLUMNS = {
  word: ['word', 'từ', 'vocabulary'],
  pos: ['part of speech', 'pos', 'từ loại', 'loại từ'],
  ipa: ['transcription', 'ipa', 'phiên âm', 'pronunciation'],
  meaning: ['meaning', 'nghĩa', 'định nghĩa', 'definition'],
  phrase: ['phrase', 'cụm từ', 'collocation'],
  example: ['example', 'ví dụ', 'sentence'],
  note: ['note', 'ghi chú', 'notes'],
} as const;

/** Memorized threshold: repetitions >= this AND interval >= MEMORIZED_INTERVAL */
export const MEMORIZED_REPETITIONS = 3;
export const MEMORIZED_INTERVAL_DAYS = 21;
