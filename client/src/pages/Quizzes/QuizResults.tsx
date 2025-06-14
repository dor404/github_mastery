import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Divider,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Replay as ReplayIcon,
  Assignment as AssignmentIcon,
  EmojiEvents as EmojiEventsIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import quizService from '../../services/quizService';
import { QuizResult } from '../../types/quiz';

const QuizResults: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // States
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load quiz results
  useEffect(() => {
    const fetchResults = async () => {
      if (!user || !user.id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch results for the current user
        const quizResults = await quizService.getQuizResults(user.id);
        setResults(quizResults);
      } catch (err: any) {
        console.error('Error loading quiz results:', err);
        setError(err.message || 'Failed to load quiz results');
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
  }, [user]);
  
  // Get performance message based on score
  const getPerformanceMessage = (score: number): { message: string; color: string } => {
    if (score >= 90) {
      return { message: 'Excellent', color: '#4caf50' };
    } else if (score >= 80) {
      return { message: 'Very Good', color: '#8bc34a' };
    } else if (score >= 70) {
      return { message: 'Good', color: '#cddc39' };
    } else if (score >= 60) {
      return { message: 'Satisfactory', color: '#ffeb3b' };
    } else if (score >= 50) {
      return { message: 'Needs Improvement', color: '#ff9800' };
    } else {
      return { message: 'Study More', color: '#f44336' };
    }
  };
  
  // Format date
  const formatDate = (dateString: Date): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading quiz results...
        </Typography>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/quizzes')}
        >
          Back to Quizzes
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={4}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/quizzes')}
          sx={{ mr: 2 }}
        >
          Back to Quizzes
        </Button>
        <Typography variant="h4" component="h1" sx={{ color: '#f05133', fontWeight: 700 }}>
          Your Quiz Results
        </Typography>
      </Box>
      
      {/* Summary Card */}
      <Card 
        elevation={3}
        sx={{
          mb: 4,
          backgroundColor: '#161b22',
          borderRadius: '8px',
          border: '1px solid rgba(240, 81, 51, 0.3)',
        }}
      >
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <EmojiEventsIcon sx={{ color: '#f05133', fontSize: 32, mr: 2 }} />
            <Typography variant="h5" sx={{ color: 'white' }}>
              Performance Summary
            </Typography>
          </Box>
          
          <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', mb: 3 }} />
          
          <Box display="flex" justifyContent="space-around" mb={2}>
            <Box textAlign="center">
              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Quizzes Taken
              </Typography>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold' }}>
                {results.length}
              </Typography>
            </Box>
            
            <Box textAlign="center">
              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Average Score
              </Typography>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold' }}>
                {results.length > 0 
                  ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
                  : 0}%
              </Typography>
            </Box>
            
            <Box textAlign="center">
              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Best Score
              </Typography>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold' }}>
                {results.length > 0 
                  ? Math.max(...results.map(r => r.score))
                  : 0}%
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
      
      {/* Results Table */}
      <Paper
        elevation={3}
        sx={{
          backgroundColor: '#161b22',
          borderRadius: '8px',
          border: '1px solid rgba(240, 81, 51, 0.3)',
          overflow: 'hidden',
        }}
      >
        <Box p={3}>
          <Box display="flex" alignItems="center" mb={2}>
            <TimelineIcon sx={{ color: '#f05133', fontSize: 32, mr: 2 }} />
            <Typography variant="h5" sx={{ color: 'white' }}>
              Detailed Results
            </Typography>
          </Box>
          
          <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', mb: 3 }} />
          
          {results.length === 0 ? (
            <Box textAlign="center" py={5}>
              <AssignmentIcon sx={{ fontSize: 60, color: 'rgba(255, 255, 255, 0.3)', mb: 2 }} />
              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                You haven't taken any quizzes yet
              </Typography>
              <Button 
                variant="contained"
                onClick={() => navigate('/quizzes')}
                sx={{ mt: 3, backgroundColor: '#f05133', '&:hover': { backgroundColor: '#d03b1f' } }}
              >
                Browse Quizzes
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 'bold' }}>Quiz</TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 'bold' }}>Date</TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 'bold' }}>Score</TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 'bold' }}>Performance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.map((result) => {
                    const performance = getPerformanceMessage(result.score);
                    return (
                      <TableRow key={result.id}>
                        <TableCell sx={{ color: 'white' }}>Quiz {result.quizId}</TableCell>
                        <TableCell sx={{ color: 'white' }}>{formatDate(result.submittedAt)}</TableCell>
                        <TableCell>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              fontWeight: 'bold',
                              color: result.score >= 70 ? '#4caf50' : result.score >= 50 ? '#ff9800' : '#f44336'
                            }}
                          >
                            {result.score}%
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={performance.message}
                            sx={{ 
                              backgroundColor: `${performance.color}20`,
                              color: performance.color,
                              fontWeight: 'bold'
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default QuizResults; 