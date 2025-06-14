export type ModuleType = 'all' | 'modules' | 'exercises' | 'quizzes';

export type BadgeType = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master';

export interface Badge {
  type: BadgeType;
  name: string;
  description: string;
  icon: string;
  earnedAt?: Date;
}

/**
 * Interface for leaderboard entry
 */
export interface LeaderboardEntry {
  _id: string;
  userId: string;
  username: string;
  email?: string;
  role: string;
  totalActivities: number;
  completedActivities: number;
  totalProgress: number;
  totalPoints: number;
  learningModules: number;
  exercises: number;
  quizzes: number;
  modulePoints: Record<string, number>;
  exercisePoints: number;
  quizPoints: number;
  rank: number;
  isCurrentUser: boolean;
  badges: Badge[];
}

/**
 * Type for leaderboard sorting options
 */
export type LeaderboardSortBy = 'totalPoints' | 'learningModules' | 'exercises' | 'quizzes';

/**
 * Interface for leaderboard filters
 */
export interface LeaderboardFilters {
  moduleType: ModuleType;
  searchTerm: string;
  badgeType?: BadgeType;
}

/**
 * Interface for leaderboard state
 */
export interface LeaderboardState {
  entries: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  sortBy: LeaderboardSortBy;
  filters: LeaderboardFilters;
} 