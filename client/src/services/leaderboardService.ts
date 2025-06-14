import apiClient from './apiClient';
import { LeaderboardEntry, ModuleType, BadgeType } from '../types/leaderboard';

/**
 * Service for leaderboard-related API calls
 */
export class LeaderboardService {
  /**
   * Fetch leaderboard data
   * @param moduleType - Filter by module type
   * @param badgeType - Filter by badge type
   * @returns Promise<LeaderboardEntry[]>
   */
  static async getLeaderboard(moduleType: ModuleType = 'all', badgeType?: BadgeType): Promise<LeaderboardEntry[]> {
    try {
      const response = await apiClient.get('/progress/leaderboard', {
        params: {
          moduleType,
          badgeType
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching leaderboard:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch leaderboard data');
    }
  }
}

export default LeaderboardService; 