import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Divider,
  Grid,
  Card,
  CardContent,
  CardActions,
  Alert,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  Timer as TimerIcon,
  QuestionAnswer as QuestionIcon,
  Quiz as QuizIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import quizService from '../../services/quizService';
import { Quiz } from '../../types/quiz';

const EditQuizzes: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await quizService.getQuizzes();
        setQuizzes(data);
      } catch (err: any) {
        console.error('Error fetching quizzes:', err);
        setError(err.message || 'Failed to load quizzes');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  const handleEditQuiz = (quizId: string) => {
    navigate(`/quizzes/edit/${quizId}`);
  };

  const handleBack = () => {
    navigate('/quizzes/manage');
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
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mr: 2 }}
        >
          Back to Quiz Management
        </Button>
        <Typography variant="h3" component="h1" sx={{ color: '#f05133', fontWeight: 700 }}>
          Edit Quizzes
        </Typography>
      </Box>
      
      <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
        Select a quiz to edit its content, questions, or settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

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
            No quizzes available to edit
          </Typography>
          <Typography variant="body1" color="rgba(255, 255, 255, 0.7)" sx={{ mb: 3 }}>
            Create a quiz first before editing
          </Typography>
          <Button 
            variant="contained"
            onClick={() => navigate('/quizzes/create')}
            sx={{ 
              backgroundColor: '#f05133',
              color: 'white',
              '&:hover': { backgroundColor: '#d03b1f' },
            }}
          >
            Create New Quiz
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={4}>
          {quizzes.map((quiz) => (
            <Grid item xs={12} md={6} key={quiz.id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#161b22',
                borderRadius: '8px',
                border: '1px solid rgba(240, 81, 51, 0.3)',
              }}>
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
                  <Button 
                    variant="contained" 
                    fullWidth
                    startIcon={<EditIcon />}
                    onClick={() => handleEditQuiz(quiz.id || '')}
                    sx={{
                      backgroundColor: '#f05133',
                      color: 'white',
                      textTransform: 'none',
                      fontWeight: 500,
                      py: 1,
                      '&:hover': { backgroundColor: '#d03b1f' },
                    }}
                  >
                    Edit Quiz
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default EditQuizzes; 