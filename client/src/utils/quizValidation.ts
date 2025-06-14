import { Quiz, QuizQuestion } from '../types/quiz';

export const REQUIRED_TOTAL_POINTS = 100;

/**
 * Calculate total points for a quiz
 */
export const calculateTotalPoints = (questions: QuizQuestion[]): number => {
  return questions.reduce((total, question) => total + (question.points || 1), 0);
};

/**
 * Validate that quiz has exactly 100 points
 */
export const validateQuizPoints = (questions: QuizQuestion[]): { isValid: boolean; message: string } => {
  const totalPoints = calculateTotalPoints(questions);
  
  if (totalPoints === REQUIRED_TOTAL_POINTS) {
    return { isValid: true, message: 'Quiz has exactly 100 points' };
  } else if (totalPoints < REQUIRED_TOTAL_POINTS) {
    return { 
      isValid: false, 
      message: `Quiz needs ${REQUIRED_TOTAL_POINTS - totalPoints} more points (currently ${totalPoints}/100)` 
    };
  } else {
    return { 
      isValid: false, 
      message: `Quiz has too many points (currently ${totalPoints}/100, reduce by ${totalPoints - REQUIRED_TOTAL_POINTS})` 
    };
  }
};

/**
 * Validate individual question points
 */
export const validateQuestionPoints = (points: number): { isValid: boolean; message: string } => {
  if (!points || points <= 0) {
    return { isValid: false, message: 'Points must be a positive number' };
  }
  
  if (points > REQUIRED_TOTAL_POINTS) {
    return { isValid: false, message: `Points cannot exceed ${REQUIRED_TOTAL_POINTS}` };
  }
  
  if (!Number.isInteger(points)) {
    return { isValid: false, message: 'Points must be a whole number' };
  }
  
  return { isValid: true, message: 'Valid point value' };
};

/**
 * Suggest point distribution for questions
 */
export const suggestPointDistribution = (questionCount: number): number => {
  if (questionCount === 0) return 1;
  return Math.floor(REQUIRED_TOTAL_POINTS / questionCount);
};

/**
 * Auto-distribute points evenly across questions
 */
export const autoDistributePoints = (questions: QuizQuestion[]): QuizQuestion[] => {
  if (questions.length === 0) return questions;
  
  const basePoints = Math.floor(REQUIRED_TOTAL_POINTS / questions.length);
  const remainder = REQUIRED_TOTAL_POINTS % questions.length;
  
  return questions.map((question, index) => ({
    ...question,
    points: basePoints + (index < remainder ? 1 : 0)
  }));
}; 