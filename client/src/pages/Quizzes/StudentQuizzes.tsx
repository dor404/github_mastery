import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  Button,
  Divider,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Tooltip
} from '@mui/material';
import { 
  Timer as TimerIcon,
  QuestionAnswer as QuestionIcon,
  Quiz as QuizIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import quizService from '../../services/quizService';
import { Quiz, QuizResult } from '../../types/quiz';

const StudentQuizzes: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [completedQuizIds, setCompletedQuizIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.id) return;

      try {
        setLoading(true);
        setError(null);
        
        // Fetch quizzes
        const quizzesData = await quizService.getQuizzes();
        setQuizzes(quizzesData);
        
        // Fetch user's completed quizzes
        const userResults = await quizService.getQuizResults(user.id);
        const completedIds = userResults.map(result => result.quizId);
        setCompletedQuizIds(completedIds);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load quizzes');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleStartQuiz = (quizId: string) => {
    navigate(`/quizzes/${quizId}`);
  };

  const handleViewResults = () => {
    navigate('/quizzes/results');
  };

  const isQuizCompleted = (quizId?: string): boolean => {
    if (!quizId) return false;
    return completedQuizIds.includes(quizId);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading quizzes...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={4}>
        <QuizIcon sx={{ fontSize: 40, color: '#f05133', mr: 2 }} />
        <Typography variant="h3" component="h1" sx={{ color: '#f05133', fontWeight: 700 }}>
          Available Quizzes
        </Typography>
      </Box>
      
      <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
        Test your Git knowledge with our interactive quizzes
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {/* Quiz Results Button */}
      <Box display="flex" justifyContent="flex-end" mb={4}>
        <Button
          variant="outlined"
          onClick={handleViewResults}
          startIcon={<SchoolIcon />}
          sx={{
            borderColor: 'rgba(240, 81, 51, 0.5)',
            color: '#f05133',
            '&:hover': {
              borderColor: '#f05133',
              backgroundColor: 'rgba(240, 81, 51, 0.05)',
            },
          }}
        >
          View My Results
        </Button>
      </Box>

      {/* Quizzes List */}
      {quizzes.length === 0 ? (
        <Paper 
          elevation={3} 
          sx={{ 
            backgroundColor: '#161b22', 
            borderRadius: '8px', 
            p: 4,
            textAlign: 'center',
            border: '1px solid rgba(240, 81, 51, 0.3)',
          }}
        >
          <Typography variant="h6" color="white" gutterBottom>
            No quizzes available yet
          </Typography>
          <Typography variant="body1" color="rgba(255, 255, 255, 0.7)">
            Check back later for new quizzes to test your knowledge
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={4}>
          {quizzes.map((quiz) => {
            const completed = isQuizCompleted(quiz.id);
            
            return (
              <Grid item xs={12} md={6} lg={4} key={quiz.id}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: '#161b22',
                  borderRadius: '8px',
                  border: '1px solid rgba(240, 81, 51, 0.3)',
                  position: 'relative'
                }}>
                  {completed && (
                    <Chip
                      icon={<CheckCircleIcon />}
                      label="Completed"
                      color="success"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                      }}
                    />
                  )}
                  
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Typography variant="h5" component="h2" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
                      {quiz.title}
                    </Typography>
                    
                    <Typography variant="body1" color="rgba(255, 255, 255, 0.7)" paragraph>
                      {quiz.description}
                    </Typography>
                    
                    <Box display="flex" flexWrap="wrap" gap={1} mt={2}>
                      <Chip 
                        icon={<QuestionIcon />} 
                        label={`${quiz.questions.length} Questions`} 
                        size="small"
                        sx={{ backgroundColor: 'rgba(240, 81, 51, 0.1)', color: '#f05133' }}
                      />
                      <Chip 
                        icon={<TimerIcon />} 
                        label={`${quiz.timeLimit} Minutes`} 
                        size="small"
                        sx={{ backgroundColor: 'rgba(240, 81, 51, 0.1)', color: '#f05133' }}
                      />
                    </Box>
                  </CardContent>
                  
                  <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                  
                  <CardActions sx={{ p: 2 }}>
                    {completed ? (
                      <Tooltip title="You've already completed this quiz">
                        <span style={{ width: '100%' }}>
                          <Button 
                            variant="contained" 
                            fullWidth
                            disabled
                            sx={{
                              backgroundColor: 'rgba(240, 81, 51, 0.3)',
                              color: 'rgba(255, 255, 255, 0.5)',
                              textTransform: 'none',
                              fontWeight: 500,
                              py: 1,
                            }}
                          >
                            Quiz Completed
                          </Button>
                        </span>
                      </Tooltip>
                    ) : (
                      <Button 
                        variant="contained" 
                        fullWidth
                        onClick={() => handleStartQuiz(quiz.id || '')}
                        sx={{
                          backgroundColor: '#f05133',
                          color: 'white',
                          textTransform: 'none',
                          fontWeight: 500,
                          py: 1,
                          '&:hover': { backgroundColor: '#d03b1f' },
                        }}
                      >
                        Start Quiz
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
};

export default StudentQuizzes; 