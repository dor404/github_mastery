import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Avatar,
  Button,
  CircularProgress,
  Alert,
  Box
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';

interface UserStats {
  completedExercises: number;
  totalExercises: number;
  completedTutorials: number;
  totalTutorials: number;
  completedQuizzes: number;
  averageQuizScore: number;
  completionPercentage: number;
}

interface AchievementSummary {
  totalBadges: number;
  badges: any[];
  stats: UserStats;
  recentBadges: any[];
}

const MyAchievements: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<AchievementSummary | null>(null);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5001/api/badges/achievements', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Achievement data:', data);
        setAchievements(data);
        setError(null);
      } else {
        throw new Error('Failed to fetch achievements');
      }
    } catch (err: any) {
      console.error('Error fetching achievements:', err);
      setError(err.message || 'Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading achievements...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={fetchAchievements}>
          Try Again
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ 
        p: 4, 
        mb: 4, 
        textAlign: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'rgba(255,255,255,0.2)' }}>
          <TrophyIcon sx={{ fontSize: 40 }} />
        </Avatar>
        
        <Typography variant="h3" gutterBottom>
          My Achievements
        </Typography>
        
        {achievements && (
          <>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              🏆 You have earned {achievements.totalBadges} badges!
            </Typography>
            
            <Typography variant="body1" sx={{ mt: 2, opacity: 0.8 }}>
              Exercises: {achievements.stats.completedExercises}/{achievements.stats.totalExercises} | 
              Tutorials: {achievements.stats.completedTutorials}/{achievements.stats.totalTutorials} | 
              Quizzes: {achievements.stats.completedQuizzes} completed
            </Typography>

            {achievements.badges.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Recent Badges:</Typography>
                {achievements.recentBadges.map((badge, index) => (
                  <Box key={index} sx={{ 
                    display: 'inline-block', 
                    mx: 1, 
                    p: 1, 
                    bgcolor: 'rgba(255,255,255,0.1)', 
                    borderRadius: 1 
                  }}>
                    <Typography variant="body2">
                      {badge.icon} {badge.name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </>
        )}
        
        {(!achievements || achievements.totalBadges === 0) && (
          <>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              🎯 No badges earned yet
            </Typography>
            
            <Typography variant="body1" sx={{ mt: 2, opacity: 0.8 }}>
              Complete exercises, tutorials, and quizzes to earn your first badges!
            </Typography>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default MyAchievements;