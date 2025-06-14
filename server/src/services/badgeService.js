const { Badge, UserBadge } = require('../models/Badge');
const Progress = require('../models/Progress');
const { QuizResult } = require('../models/Quiz');
const TutorialProgress = require('../models/TutorialProgress');
const Tutorial = require('../models/Tutorial');
const Exercise = require('../models/Exercise');
const User = require('../models/User'); 

class BadgeService {
  // Initialize default badges in the database
  static async initializeDefaultBadges() {
    try {
      const existingBadges = await Badge.countDocuments();
      console.log(`Found ${existingBadges} existing badges in database`);
      
      if (existingBadges >= 18) {
        console.log('All badges already initialized');
        return;
      }

      const defaultBadges = [
        // Exercise Badges
        {
          name: 'First Steps',
          description: 'Complete your first exercise',
          type: 'exercise',
          level: 'bronze',
          icon: '👶',
          criteria: { exerciseCount: 1 },
          points: 50
        },
        {
          name: 'Exercise Enthusiast',
          description: 'Complete 5 exercises',
          type: 'exercise',
          level: 'silver',
          icon: '💪',
          criteria: { exerciseCount: 5 },
          points: 100
        },
        {
          name: 'Coding Master',
          description: 'Complete 10 exercises',
          type: 'exercise',
          level: 'gold',
          icon: '👑',
          criteria: { exerciseCount: 10 },
          points: 200
        },
        {
          name: 'Exercise Champion',
          description: 'Complete 20 exercises',
          type: 'exercise',
          level: 'platinum',
          icon: '🏆',
          criteria: { exerciseCount: 20 },
          points: 500
        },

        // Tutorial Badges
        {
          name: 'Learning Starter',
          description: 'Complete your first tutorial',
          type: 'tutorial',
          level: 'bronze',
          icon: '📚',
          criteria: { tutorialCount: 1 },
          points: 50
        },
        {
          name: 'Knowledge Seeker',
          description: 'Complete 3 tutorials',
          type: 'tutorial',
          level: 'silver',
          icon: '🔍',
          criteria: { tutorialCount: 3 },
          points: 100
        },
        {
          name: 'Tutorial Expert',
          description: 'Complete 5 tutorials',
          type: 'tutorial',
          level: 'gold',
          icon: '🎓',
          criteria: { tutorialCount: 5 },
          points: 200
        },
        {
          name: 'Learning Legend',
          description: 'Complete 10 tutorials',
          type: 'tutorial',
          level: 'platinum',
          icon: '🌟',
          criteria: { tutorialCount: 10 },
          points: 500
        },

        // Quiz Badges
        {
          name: 'Quiz Rookie',
          description: 'Complete your first quiz',
          type: 'quiz',
          level: 'bronze',
          icon: '❓',
          criteria: { quizCount: 1 },
          points: 50
        },
        {
          name: 'Quiz Challenger',
          description: 'Complete 5 quizzes',
          type: 'quiz',
          level: 'silver',
          icon: '🧠',
          criteria: { quizCount: 5 },
          points: 100
        },
        {
          name: 'Quiz Master',
          description: 'Complete 10 quizzes',
          type: 'quiz',
          level: 'gold',
          icon: '🎯',
          criteria: { quizCount: 10 },
          points: 200
        },
        {
          name: 'Quiz Genius',
          description: 'Complete 15 quizzes with 80%+ average',
          type: 'quiz',
          level: 'platinum',
          icon: '🧙',
          criteria: { quizCount: 15, averageScore: 80 },
          points: 500
        },

        // Completion Badges
        {
          name: 'Getting Started',
          description: 'Complete 25% of all content',
          type: 'completion',
          level: 'bronze',
          icon: '🚀',
          criteria: { completionPercentage: 25 },
          points: 100
        },
        {
          name: 'Half Way There',
          description: 'Complete 50% of all content',
          type: 'completion',
          level: 'silver',
          icon: '🏃',
          criteria: { completionPercentage: 50 },
          points: 200
        },
        {
          name: 'Almost There',
          description: 'Complete 75% of all content',
          type: 'completion',
          level: 'gold',
          icon: '🎖️',
          criteria: { completionPercentage: 75 },
          points: 300
        },
        {
          name: 'Course Champion',
          description: 'Complete 100% of all content',
          type: 'completion',
          level: 'platinum',
          icon: '👨‍🎓',
          criteria: { completionPercentage: 100 },
          points: 1000
        },

        // Milestone Badges
        {
          name: 'Perfect Score',
          description: 'Score 100% on any quiz',
          type: 'milestone',
          level: 'gold',
          icon: '💯',
          criteria: { averageScore: 100 },
          points: 300
        },
        {
          name: 'Consistency Star',
          description: 'Complete content for 7 consecutive days',
          type: 'milestone',
          level: 'silver',
          icon: '⭐',
          criteria: { },
          points: 250
        }
      ];

      const insertedBadges = await Badge.insertMany(defaultBadges);
      console.log(`✅ Successfully initialized ${insertedBadges.length} badges`);
    } catch (error) {
      console.error('Error initializing badges:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
  }

  // Check and award badges for a specific user
  static async checkAndAwardBadges(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      // Get user's current stats
      const stats = await this.getUserStats(userId);
      
      // Get all badges
      const allBadges = await Badge.find();
      
      // Get user's current badges
      const userBadges = await UserBadge.find({ userId }).populate('badgeId');
      const earnedBadgeIds = userBadges.map(ub => ub.badgeId._id.toString());

      const newBadges = [];

      // Check each badge criteria
      for (const badge of allBadges) {
        // Skip if user already has this badge
        if (earnedBadgeIds.includes(badge._id.toString())) {
          continue;
        }

        let qualified = false;

        switch (badge.type) {
          case 'exercise':
            qualified = stats.completedExercises >= (badge.criteria.exerciseCount || 0);
            break;
          
          case 'tutorial':
            qualified = stats.completedTutorials >= (badge.criteria.tutorialCount || 0);
            break;
          
          case 'quiz':
            const quizCountMet = stats.completedQuizzes >= (badge.criteria.quizCount || 0);
            const scoreMet = !badge.criteria.averageScore || stats.averageQuizScore >= badge.criteria.averageScore;
            qualified = quizCountMet && scoreMet;
            break;
          
          case 'completion':
            qualified = stats.completionPercentage >= (badge.criteria.completionPercentage || 0);
            break;
          
          case 'milestone':
            if (badge.name === 'Perfect Score') {
              qualified = stats.hasperfectScore;
            } else if (badge.name === 'Consistency Star') {
              qualified = stats.consecutiveDays >= 7;
            }
            break;
        }

        if (qualified) {
          // Award the badge
          const userBadge = new UserBadge({
            userId: userId,
            badgeId: badge._id,
            progress: 100
          });

          try {
            await userBadge.save();
            newBadges.push({
              ...badge.toObject(),
              earnedAt: userBadge.earnedAt
            });
            console.log(`Badge "${badge.name}" awarded to user ${userId}`);
          } catch (error) {
            if (error.code !== 11000) { // Ignore duplicate key errors
              console.error('Error saving user badge:', error);
            }
          }
        }
      }

      return newBadges;
    } catch (error) {
      console.error('Error checking badges:', error);
      return [];
    }
  }

  // Get user's current progress stats
  static async getUserStats(userId) {
    try {
      const [
        exercises,
        tutorials,
        publishedTutorials,
        progressRecords,
        quizResults,
        tutorialProgress
      ] = await Promise.all([
        Exercise.find().lean(),
        Tutorial.find().lean(),
        Tutorial.find({ published: true }).lean(),
        Progress.find({ userId }).lean(),
        QuizResult.find({ userId }).lean(),
        TutorialProgress.find({ userId }).lean()
      ]);

      // Calculate exercise completion
      const completedExercises = progressRecords.filter(p => p.completed).length;
      const totalExercises = exercises.length;

      // Calculate tutorial completion
      const completedTutorials = tutorialProgress.filter(tp => tp.status === 'completed').length;
      const totalTutorials = publishedTutorials.length;

      // Calculate quiz completion and average
      const uniqueQuizIds = new Set(
        quizResults
          .filter(result => result.quizId)
          .map(result => result.quizId.toString())
      );
      const completedQuizzes = uniqueQuizIds.size;
      
      const averageQuizScore = quizResults.length > 0 
        ? Math.round(quizResults.reduce((sum, result) => sum + result.score, 0) / quizResults.length)
        : 0;

      const hasperfectScore = quizResults.some(result => result.score === 100);

      // Calculate overall completion percentage
      const totalContent = totalExercises + totalTutorials + uniqueQuizIds.size;
      const completedContent = completedExercises + completedTutorials + completedQuizzes;
      const completionPercentage = totalContent > 0 
        ? Math.round((completedContent / totalContent) * 100) 
        : 0;

      // Calculate consecutive days (simplified - would need more complex logic for real implementation)
      const consecutiveDays = this.calculateConsecutiveDays(progressRecords, tutorialProgress, quizResults);

      return {
        completedExercises,
        totalExercises,
        completedTutorials,
        totalTutorials,
        completedQuizzes,
        averageQuizScore,
        hasperfectScore,
        completionPercentage,
        consecutiveDays
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        completedExercises: 0,
        totalExercises: 0,
        completedTutorials: 0,
        totalTutorials: 0,
        completedQuizzes: 0,
        averageQuizScore: 0,
        hasperfectScore: false,
        completionPercentage: 0,
        consecutiveDays: 0
      };
    }
  }

  // Calculate consecutive days of activity (simplified implementation)
  static calculateConsecutiveDays(progressRecords, tutorialProgress, quizResults) {
    try {
      const activityDates = new Set();
      
      // Add exercise completion dates
      progressRecords.forEach(record => {
        if (record.completed && record.updatedAt) {
          activityDates.add(record.updatedAt.toISOString().split('T')[0]);
        }
      });

      // Add tutorial completion dates
      tutorialProgress.forEach(record => {
        if (record.status === 'completed' && record.completedAt) {
          activityDates.add(record.completedAt.toISOString().split('T')[0]);
        }
      });

      // Add quiz completion dates
      quizResults.forEach(result => {
        if (result.submittedAt) {
          activityDates.add(result.submittedAt.toISOString().split('T')[0]);
        }
      });

      // Sort dates and find consecutive streak
      const sortedDates = Array.from(activityDates).sort();
      let maxStreak = 0;
      let currentStreak = 0;

      for (let i = 0; i < sortedDates.length; i++) {
        if (i === 0) {
          currentStreak = 1;
        } else {
          const prevDate = new Date(sortedDates[i - 1]);
          const currDate = new Date(sortedDates[i]);
          const diffInDays = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));

          if (diffInDays === 1) {
            currentStreak++;
          } else {
            maxStreak = Math.max(maxStreak, currentStreak);
            currentStreak = 1;
          }
        }
      }

      return Math.max(maxStreak, currentStreak);
    } catch (error) {
      console.error('Error calculating consecutive days:', error);
      return 0;
    }
  }

  // Get user's badges
  static async getUserBadges(userId) {
    try {
      const userBadges = await UserBadge.find({ userId })
        .populate('badgeId')
        .sort('-earnedAt');

      return userBadges.map(ub => ({
        ...ub.badgeId.toObject(),
        earnedAt: ub.earnedAt,
        progress: ub.progress
      }));
    } catch (error) {
      console.error('Error getting user badges:', error);
      return [];
    }
  }

  // Get all available badges with user's progress
  static async getAllBadgesWithProgress(userId) {
    try {
      const [allBadges, userBadges, userStats] = await Promise.all([
        Badge.find().sort('type level'),
        UserBadge.find({ userId }).populate('badgeId'),
        this.getUserStats(userId)
      ]);

      const earnedBadgeIds = userBadges.map(ub => ub.badgeId._id.toString());

      return allBadges.map(badge => {
        const isEarned = earnedBadgeIds.includes(badge._id.toString());
        const userBadge = userBadges.find(ub => ub.badgeId._id.toString() === badge._id.toString());

        let progress = 0;
        if (isEarned) {
          progress = 100;
        } else {
          // Calculate progress towards badge
          switch (badge.type) {
            case 'exercise':
              progress = Math.min(100, Math.round((userStats.completedExercises / (badge.criteria.exerciseCount || 1)) * 100));
              break;
            case 'tutorial':
              progress = Math.min(100, Math.round((userStats.completedTutorials / (badge.criteria.tutorialCount || 1)) * 100));
              break;
            case 'quiz':
              const quizProgress = Math.min(100, Math.round((userStats.completedQuizzes / (badge.criteria.quizCount || 1)) * 100));
              const scoreProgress = !badge.criteria.averageScore || userStats.averageQuizScore >= badge.criteria.averageScore ? 100 : 0;
              progress = Math.min(quizProgress, scoreProgress);
              break;
            case 'completion':
              progress = Math.min(100, Math.round((userStats.completionPercentage / (badge.criteria.completionPercentage || 1)) * 100));
              break;
          }
        }

        return {
          ...badge.toObject(),
          isEarned,
          earnedAt: userBadge?.earnedAt,
          progress
        };
      });
    } catch (error) {
      console.error('Error getting badges with progress:', error);
      return [];
    }
  }
}

module.exports = BadgeService; 