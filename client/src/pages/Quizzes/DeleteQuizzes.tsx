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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Timer as TimerIcon,
  QuestionAnswer as QuestionIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import quizService from '../../services/quizService';
import { Quiz } from '../../types/quiz';

const DeleteQuizzes: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const handleDeleteQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedQuiz || !selectedQuiz.id) return;
    
    setIsDeleting(true);
    try {
      await quizService.deleteQuiz(selectedQuiz.id);
      setQuizzes(quizzes.filter(q => q.id !== selectedQuiz.id));
      setSuccessMessage(`Quiz "${selectedQuiz.title}" has been deleted successfully`);
      setConfirmOpen(false);
      setSelectedQuiz(null);
    } catch (err: any) {
      console.error('Error deleting quiz:', err);
      setError(err.message || 'Failed to delete quiz');
      setConfirmOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBack = () => {
    navigate('/quizzes/manage');
  };

  const handleCloseSnackbar = () => {
    setSuccessMessage(null);
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
          Delete Quizzes
        </Typography>
      </Box>
      
      <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
        Select a quiz to delete it permanently
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
            No quizzes available to delete
          </Typography>
          <Typography variant="body1" color="rgba(255, 255, 255, 0.7)" sx={{ mb: 3 }}>
            Create a quiz first before deleting
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
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteQuiz(quiz)}
                    sx={{
                      backgroundColor: '#d32f2f',
                      color: 'white',
                      textTransform: 'none',
                      fontWeight: 500,
                      py: 1,
                      '&:hover': { backgroundColor: '#b71c1c' },
                    }}
                  >
                    Delete Quiz
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => !isDeleting && setConfirmOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        PaperProps={{
          sx: {
            backgroundColor: '#1e1e2f',
            color: 'white',
            border: '1px solid rgba(240, 81, 51, 0.3)',
          }
        }}
      >
        <DialogTitle id="delete-dialog-title" sx={{ color: '#f05133' }}>
          <Box display="flex" alignItems="center">
            <WarningIcon sx={{ mr: 1 }} />
            Confirm Quiz Deletion
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Are you sure you want to delete the quiz <strong style={{ color: 'white' }}>{selectedQuiz?.title}</strong>? 
            This action cannot be undone and all associated quiz data will be permanently deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setConfirmOpen(false)} 
            disabled={isDeleting}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            disabled={isDeleting}
            variant="contained"
            startIcon={isDeleting ? <CircularProgress size={20} /> : <DeleteIcon />}
            sx={{
              backgroundColor: '#d32f2f',
              color: 'white',
              '&:hover': { backgroundColor: '#b71c1c' },
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete Quiz'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={successMessage}
      />
    </Container>
  );
};

export default DeleteQuizzes; 