import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Avatar,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  CheckCircle as CheckIcon,
  School as SchoolIcon,
  Quiz as QuizIcon,
  Assignment as ExerciseIcon
} from '@mui/icons-material';

interface CompletionStats {
  totalExercises: number;
  completedExercises: number;
  totalTutorials: number;
  completedTutorials: number;
  totalQuizzes: number;
  completedQuizzes: number;
  averageQuizScore: number;
  isFullyCompleted: boolean;
}

const CompletionViewer: React.FC = () => {
  const [stats, setStats] = useState<CompletionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    fetchCompletionStats();
  }, []);

  const fetchCompletionStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (user) {
        setUserName(user.username || user.email || 'Student');
      }

      const response = await fetch('http://localhost:5001/api/dashboard/completion-stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching completion stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <LinearProgress />
      </Container>
    );
  }

  if (!stats) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography>Unable to load completion data</Typography>
      </Container>
    );
  }

  const completionPercentage = Math.round(
    ((stats.completedExercises + stats.completedTutorials + stats.completedQuizzes) /
     (stats.totalExercises + stats.totalTutorials + stats.totalQuizzes)) * 100
  );

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Paper elevation={3} sx={{ p: 4, mb: 4, textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'rgba(255,255,255,0.2)' }}>
          {stats.isFullyCompleted ? <TrophyIcon sx={{ fontSize: 40 }} /> : <SchoolIcon sx={{ fontSize: 40 }} />}
        </Avatar>
        
        <Typography variant="h3" gutterBottom>
          {stats.isFullyCompleted ? '🎉 Congratulations!' : 'Progress Dashboard'}
        </Typography>
        
        <Typography variant="h5" sx={{ mb: 2 }}>
          {userName}
        </Typography>
        
        {stats.isFullyCompleted ? (
          <Typography variant="h6">
            You've completed all courses! Outstanding work! 🏆
          </Typography>
        ) : (
          <Typography variant="h6">
            You're {completionPercentage}% complete - Keep going!
          </Typography>
        )}
        
        <Box sx={{ mt: 3, maxWidth: 400, mx: 'auto' }}>
          <LinearProgress 
            variant="determinate" 
            value={completionPercentage} 
            sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.3)' }}
          />
          <Typography variant="body2" sx={{ mt: 1 }}>
            {completionPercentage}% Complete
          </Typography>
        </Box>
      </Paper>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <ExerciseIcon sx={{ fontSize: 48, color: '#2196f3', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Exercises
              </Typography>
              <Typography variant="h4" color="primary">
                {stats.completedExercises}/{stats.totalExercises}
              </Typography>
              <Chip 
                label={stats.completedExercises === stats.totalExercises ? 'Complete' : 'In Progress'}
                color={stats.completedExercises === stats.totalExercises ? 'success' : 'warning'}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <SchoolIcon sx={{ fontSize: 48, color: '#4caf50', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Tutorials
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.completedTutorials}/{stats.totalTutorials}
              </Typography>
              <Chip 
                label={stats.completedTutorials === stats.totalTutorials ? 'Complete' : 'In Progress'}
                color={stats.completedTutorials === stats.totalTutorials ? 'success' : 'warning'}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <QuizIcon sx={{ fontSize: 48, color: '#ff9800', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Quizzes
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.completedQuizzes}/{stats.totalQuizzes}
              </Typography>
              <Chip 
                label={stats.completedQuizzes === stats.totalQuizzes ? 'Complete' : 'In Progress'}
                color={stats.completedQuizzes === stats.totalQuizzes ? 'success' : 'warning'}
                sx={{ mt: 1 }}
              />
              {stats.averageQuizScore > 0 && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Average: {stats.averageQuizScore}%
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Achievement Section */}
      {stats.isFullyCompleted && (
        <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: '#f8f9fa' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <TrophyIcon color="warning" />
              Course Completion Certificate
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body1" sx={{ mb: 2 }}>
              This certifies that <strong>{userName}</strong> has successfully completed all
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mb: 3 }}>
              <Chip icon={<ExerciseIcon />} label={`${stats.totalExercises} Exercises`} color="primary" />
              <Chip icon={<SchoolIcon />} label={`${stats.totalTutorials} Tutorials`} color="success" />
              <Chip icon={<QuizIcon />} label={`${stats.totalQuizzes} Quizzes`} color="warning" />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Completed on {new Date().toLocaleDateString()}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Quiz Average: {stats.averageQuizScore}%
            </Typography>
            <Button variant="contained" color="primary" sx={{ mt: 2 }}>
              Download Certificate
            </Button>
          </Box>
        </Paper>
      )}

      {/* Next Steps */}
      {!stats.isFullyCompleted && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            What's Next?
          </Typography>
          <Box>
            {stats.completedExercises < stats.totalExercises && (
              <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ExerciseIcon color="action" />
                Complete {stats.totalExercises - stats.completedExercises} more exercise(s)
              </Typography>
            )}
            {stats.completedTutorials < stats.totalTutorials && (
              <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SchoolIcon color="action" />
                Complete {stats.totalTutorials - stats.completedTutorials} more tutorial(s)
              </Typography>
            )}
            {stats.completedQuizzes < stats.totalQuizzes && (
              <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <QuizIcon color="action" />
                Complete {stats.totalQuizzes - stats.completedQuizzes} more quiz(es)
              </Typography>
            )}
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default CompletionViewer; 