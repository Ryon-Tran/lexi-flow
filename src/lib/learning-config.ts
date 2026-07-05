// ============================================
// LexiFlow — Learning Modes Configuration
// ============================================

export interface LearningModeConfig {
  id: string;
  name: string;
  vietnameseName: string;
  description: string;
  enabled: boolean;
  path: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

/** Configurable list of active learning/practice modes */
export const LEARNING_MODES: LearningModeConfig[] = [
  {
    id: 'flashcard',
    name: 'Flashcard',
    vietnameseName: 'Thẻ ghi nhớ (Flashcard)',
    description: 'Học từ vựng theo cơ chế lật thẻ mặt trước/sau và đánh giá mức độ nhớ.',
    enabled: true,
    path: '/learn',
    difficulty: 'easy',
  },
  {
    id: 'fill_blank',
    name: 'Fill in the Blank',
    vietnameseName: 'Điền vào chỗ trống',
    description: 'Luyện ghi nhớ từ vựng trong ngữ cảnh câu ví dụ thực tế.',
    enabled: true,
    path: '/practice/fill-blank',
    difficulty: 'medium',
  },
  {
    id: 'matching',
    name: 'Matching',
    vietnameseName: 'Ghép từ và nghĩa',
    description: 'Nối các từ tiếng Anh với nghĩa tiếng Việt tương ứng thật nhanh.',
    enabled: true,
    path: '/practice/matching',
    difficulty: 'easy',
  },
  {
    id: 'collocation',
    name: 'Collocation Practice',
    vietnameseName: 'Học cụm từ',
    description: 'Ôn tập cụm từ hay đi kèm thường gặp trong đề thi TOEIC.',
    enabled: true,
    path: '/practice/collocation',
    difficulty: 'medium',
  },
  {
    id: 'dictation',
    name: 'Listening Dictation',
    vietnameseName: 'Nghe và gõ lại',
    description: 'Luyện nghe phát âm từ vựng và gõ lại chính xác chính tả.',
    enabled: true,
    path: '/practice/dictation',
    difficulty: 'hard',
  },
  {
    id: 'letter_hint',
    name: 'Letter Hint',
    vietnameseName: 'Gợi ý ký tự',
    description: 'Điền các chữ cái còn thiếu của từ dựa trên nghĩa tiếng Việt.',
    enabled: true,
    path: '/practice/letter-hint',
    difficulty: 'easy',
  },
  {
    id: 'quiz',
    name: 'Memory Quiz',
    vietnameseName: 'Kiểm tra trí nhớ',
    description: 'Làm bài kiểm tra trắc nghiệm để đánh giá tổng hợp khả năng nhớ từ.',
    enabled: true,
    path: '/quiz',
    difficulty: 'medium',
  },
];

/** Spaced Repetition Scheduling Config */
export const SRS_CONFIG = {
  // 'sm2' (original algorithm) or 'custom_srs' (new custom level system)
  scheduler: 'custom_srs' as 'sm2' | 'custom_srs',
};
