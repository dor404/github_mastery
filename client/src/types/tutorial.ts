import { User } from './user';

/**
 * Available difficulty levels for tutorials and exercises
 */
export type DifficultyLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'expert';

/**
 * Interface for exercise included in tutorials
 */
export interface TutorialExercise {
  _id?: string;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  difficultyStars?: number; // 1-5 star rating
  points: number;
}

/**
 * Interface for tutorial page
 */
export interface TutorialPage {
  _id?: string;
  title: string;
  content: string;
  order: number;
}

/**
 * Interface for tutorial model
 */
export interface Tutorial {
  _id?: string;
  title: string;
  content: string;
  description: string;
  author: User | string;
  version: number;
  difficulty: DifficultyLevel;
  difficultyStars?: number; // 1-5 star rating
  tags: string[];
  exercises: TutorialExercise[];
  prerequisites: (Tutorial | string)[];
  pages: TutorialPage[];
  createdAt?: Date;
  updatedAt?: Date;
  published: boolean;
}

/**
 * Interface for tutorial creation form data
 */
export interface TutorialFormData {
  title: string;
  content: string;
  description: string;
  difficulty: DifficultyLevel;
  difficultyStars?: number; // 1-5 star rating
  tags: string[];
  exercises: TutorialExercise[];
  prerequisites: string[];
  pages: TutorialPage[];
  published: boolean;
} 