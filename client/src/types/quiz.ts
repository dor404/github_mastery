/**
 * Interface for quiz option
 */
export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

/**
 * Question types supported by the quiz system
 */
export type QuestionType = 'single' | 'multiple';

/**
 * Interface for quiz question
 */
export interface QuizQuestion {
  id: string;
  text: string;
  options: QuizOption[];
  type: QuestionType;
  points: number; // Point value for this question (default: 1)
}

/**
 * Interface for quiz data
 */
export interface Quiz {
  id?: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  timeLimit: number; // in minutes
  createdBy?: string; // user ID of the creator
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Interface for quiz submission by a student
 */
export interface QuizSubmission {
  id?: string;
  quizId: string;
  userId: string;
  answers: {
    questionId: string;
    selectedOptions: string[]; // array of selected option IDs
  }[];
  score?: number;
  completed: boolean;
  startedAt: Date;
  submittedAt?: Date;
}

/**
 * Interface for quiz result
 */
export interface QuizResult {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  totalQuestions: number;
  totalPoints: number; // Total possible points in the quiz
  earnedPoints: number; // Points earned by the student
  submittedAt: Date;
} 