import React, { useEffect, useState } from 'react';
import { Box, Container, Grid, Paper, Typography, Button, CircularProgress, Alert } from '@mui/material';
import { Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
} from 'chart.js';
import { useNavigate } from 'react-router-dom';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
);

interface ProgressData {
  completedModules: number;
  totalModules: number;
  quizScores: { date: string; score: number }[];
  incompleteModules: { 
    id: string;
    title: string;
    type: 'exercise';  // Add type to distinguish exercises
  }[];
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [progressData, setProgressData] = useState<ProgressData>({
    completedModules: 0,
    totalModules: 0,
    quizScores: [],
    incompleteModules: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:5001/api/dashboard/progress', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(errorText || 'Failed to fetch progress data');
      }

      const data = await response.json();
      console.log('Received dashboard data:', data);
      setProgressData(data);
    } catch (error) {
      console.error('Error fetching progress data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch progress data');
    } finally {
      setLoading(false);
    }
  };

  const pieChartData = {
    labels: ['Completed Exercises', 'Remaining Exercises'],
    datasets: [
      {
        data: [progressData.completedModules, progressData.totalModules - progressData.completedModules],
        backgroundColor: ['#4CAF50', '#FFA726'],
        borderColor: ['#388E3C', '#F57C00'],
        borderWidth: 1,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  const lineChartData = {
    labels: progressData.quizScores.map(score => score.date),
    datasets: [
      {
        label: 'Quiz Scores',
        data: progressData.quizScores.map(score => score.score),
        fill: false,
        borderColor: '#2196F3',
        tension: 0.1,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Score (%)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Personal Progress Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Exercise Progress Chart */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 400,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Exercise Progress
            </Typography>
            <Box sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center',
              flex: 1
            }}>
              {progressData.totalModules > 0 ? (
                <>
                  <Box sx={{ width: '100%', height: '300px', position: 'relative' }}>
                    <Pie data={pieChartData} options={pieChartOptions} />
                  </Box>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                    {progressData.completedModules} of {progressData.totalModules} exercises completed
                  </Typography>
                </>
              ) : (
                <Typography color="textSecondary">No exercises available</Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Quiz Scores Timeline */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 400,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Quiz Performance
            </Typography>
            <Box sx={{ 
              height: '100%',
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center',
              flex: 1
            }}>
              {progressData.quizScores.length > 0 ? (
                <>
                  <Box sx={{ width: '100%', height: '300px', position: 'relative' }}>
                    <Line data={lineChartData} options={lineChartOptions} />
                  </Box>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                    {progressData.quizScores.length} quizzes completed
                  </Typography>
                </>
              ) : (
                <Typography color="textSecondary">No quiz scores available</Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Incomplete Exercises */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Incomplete Exercises
            </Typography>
            <Grid container spacing={2}>
              {progressData.incompleteModules
                .filter(module => module.type === 'exercise' && !module.id.match(/^[0-9a-f]{24}$/))
                .map((exercise) => (
                  <Grid item xs={12} sm={6} md={4} key={exercise.id}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => navigate(`/training/${exercise.id}`)}
                      sx={{ textTransform: 'none' }}
                    >
                      {exercise.title}
                    </Button>
                  </Grid>
                ))}
              {progressData.incompleteModules.filter(
                module => module.type === 'exercise' && !module.id.match(/^[0-9a-f]{24}$/)
              ).length === 0 && (
                <Grid item xs={12}>
                  <Typography color="textSecondary" align="center">
                    All exercises completed! 🎉
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 