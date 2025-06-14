import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Checkbox,
  Divider,
  Alert,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
  Timer as TimerIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import quizService from '../../services/quizService';
import { Quiz, QuizQuestion, QuizSubmission, QuizResult } from '../../types/quiz';

const QuizViewer: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // States
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: string]: string[] }>({});
  const [quizSubmission, setQuizSubmission] = useState<QuizSubmission | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [hasAlreadyTakenQuiz, setHasAlreadyTakenQuiz] = useState(false);
  
  // Calculate progress percentage
  const progressPercentage = quiz 
    ? Math.round(((currentQuestionIndex + 1) / quiz.questions.length) * 100)
    : 0;

  // Load quiz data
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId || !user || !user.id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch the quiz
        const quizData = await quizService.getQuiz(quizId);
        setQuiz(quizData);

        // Check if user has already taken this quiz
        const userResults = await quizService.getQuizResults(user.id);
        const hasCompleted = userResults.some(result => result.quizId === quizId);
        
        if (hasCompleted) {
          setHasAlreadyTakenQuiz(true);
          return;
        }
        
        // Start a quiz attempt
        const submission = await quizService.startQuizAttempt(quizId, user.id);
        setQuizSubmission(submission);
        
        // Initialize time remaining
        setTimeRemaining(quizData.timeLimit * 60); // convert minutes to seconds
      } catch (err: any) {
        console.error('Error loading quiz:', err);
        setError(err.message || 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuiz();
  }, [quizId, user]);
  
  // Timer countdown
  useEffect(() => {
    if (!quiz || loading || timeRemaining <= 0 || hasAlreadyTakenQuiz) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [quiz, loading, timeRemaining, hasAlreadyTakenQuiz]);
  
  // Format time remaining as MM:SS
  const formatTimeRemaining = (): string => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Handle answer selection
  const handleAnswerChange = (questionId: string, optionId: string, checked: boolean) => {
    setAnswers(prevAnswers => {
      const currentQuestionAnswers = prevAnswers[questionId] || [];
      
      // Get the current question to determine if it's single or multiple choice
      const currentQuestion = quiz?.questions.find(q => q.id === questionId);
      
      if (currentQuestion?.type === 'single') {
        // For single choice, replace the answer
        return {
          ...prevAnswers,
          [questionId]: [optionId]
        };
      } else {
        // For multiple choice, add or remove the option
        if (checked) {
          return {
            ...prevAnswers,
            [questionId]: [...currentQuestionAnswers, optionId]
          };
        } else {
          return {
            ...prevAnswers,
            [questionId]: currentQuestionAnswers.filter(id => id !== optionId)
          };
        }
      }
    });
  };
  
  // Navigate to next question
  const handleNextQuestion = () => {
    if (!quiz) return;
    
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  // Navigate to previous question
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  // Submit the quiz
  const handleSubmitQuiz = async () => {
    if (!quiz || !quizSubmission || !user || !user.id) return;
    
    try {
      setIsSubmitting(true);
      
      // Convert answers to the submission format
      const formattedAnswers = Object.keys(answers).map(questionId => ({
        questionId,
        selectedOptions: answers[questionId] || []
      }));
      
      // Update submission with answers
      const updatedSubmission: QuizSubmission = {
        ...quizSubmission,
        answers: formattedAnswers
      };
      
      // Submit the quiz
      const result = await quizService.submitQuiz(quiz, updatedSubmission);
      setQuizResult(result);
      setShowResultsDialog(true);
    } catch (err: any) {
      console.error('Error submitting quiz:', err);
      setError(err.message || 'Failed to submit quiz');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Navigate to quiz list after viewing results
  const handleViewResults = () => {
    navigate('/quizzes/results');
  };
  
  // Current question
  const currentQuestion = quiz?.questions[currentQuestionIndex];
  
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading quiz...
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
  
  if (!quiz) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">
          Quiz not found.
        </Alert>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/quizzes')}
          sx={{ mt: 2 }}
        >
          Back to Quizzes
        </Button>
      </Container>
    );
  }

  if (hasAlreadyTakenQuiz) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
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
          <Typography variant="h4" component="h1" sx={{ color: '#f05133', fontWeight: 700, mb: 2 }}>
            Quiz Already Completed
          </Typography>
          <Typography variant="body1" color="rgba(255, 255, 255, 0.7)" sx={{ mb: 4 }}>
            You have already taken this quiz. Each quiz can only be taken once.
          </Typography>
          <Box display="flex" justifyContent="center" gap={2}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/quizzes')}
              sx={{
                borderColor: 'rgba(240, 81, 51, 0.5)',
                color: '#f05133',
                '&:hover': {
                  borderColor: '#f05133',
                  backgroundColor: 'rgba(240, 81, 51, 0.05)',
                },
              }}
            >
              Back to Quizzes
            </Button>
            <Button
              variant="contained"
              startIcon={<SchoolIcon />}
              onClick={() => navigate('/quizzes/results')}
              sx={{
                backgroundColor: '#f05133',
                color: 'white',
                '&:hover': { backgroundColor: '#d03b1f' },
              }}
            >
              View My Results
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Quiz Header */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" sx={{ color: '#f05133', fontWeight: 700, mb: 1 }}>
          {quiz.title}
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          {quiz.description}
        </Typography>
        
        {/* Timer and Progress */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Chip 
            icon={<TimerIcon />} 
            label={formatTimeRemaining()} 
            color={timeRemaining < 60 ? 'error' : 'default'}
            sx={{ fontWeight: 'bold' }}
          />
          <Typography variant="body2">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </Typography>
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={progressPercentage} 
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Box>
      
      {/* Current Question */}
      {currentQuestion && (
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
            <Typography variant="h5" sx={{ color: 'white', mb: 3 }}>
              {currentQuestionIndex + 1}. {currentQuestion.text}
            </Typography>
            
            <FormControl component="fieldset" sx={{ width: '100%' }}>
              <FormLabel sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                {currentQuestion.type === 'single' 
                  ? 'Select one answer:' 
                  : 'Select all that apply:'}
              </FormLabel>
              
              {currentQuestion.type === 'single' ? (
                <RadioGroup
                  value={answers[currentQuestion.id]?.[0] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value, true)}
                >
                  {currentQuestion.options.map((option) => (
                    <FormControlLabel
                      key={option.id}
                      value={option.id}
                      control={
                        <Radio sx={{ 
                          color: 'rgba(255, 255, 255, 0.7)', 
                          '&.Mui-checked': { color: '#f05133' } 
                        }} />
                      }
                      label={option.text}
                      sx={{ color: 'white', my: 1 }}
                    />
                  ))}
                </RadioGroup>
              ) : (
                <Box>
                  {currentQuestion.options.map((option) => (
                    <FormControlLabel
                      key={option.id}
                      control={
                        <Checkbox
                          checked={answers[currentQuestion.id]?.includes(option.id) || false}
                          onChange={(e) => handleAnswerChange(
                            currentQuestion.id, 
                            option.id, 
                            e.target.checked
                          )}
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.7)', 
                            '&.Mui-checked': { color: '#f05133' } 
                          }}
                        />
                      }
                      label={option.text}
                      sx={{ color: 'white', my: 1, display: 'block' }}
                    />
                  ))}
                </Box>
              )}
            </FormControl>
          </CardContent>
        </Card>
      )}
      
      {/* Navigation Buttons */}
      <Box display="flex" justifyContent="space-between">
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handlePrevQuestion}
          disabled={currentQuestionIndex === 0 || isSubmitting}
          sx={{
            borderColor: 'rgba(240, 81, 51, 0.5)',
            color: '#f05133',
            '&:hover': {
              borderColor: '#f05133',
              backgroundColor: 'rgba(240, 81, 51, 0.05)',
            },
          }}
        >
          Previous
        </Button>
        
        {currentQuestionIndex < quiz.questions.length - 1 ? (
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            onClick={handleNextQuestion}
            disabled={isSubmitting}
            sx={{
              backgroundColor: '#f05133',
              '&:hover': { backgroundColor: '#d03b1f' },
            }}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            endIcon={<CheckIcon />}
            onClick={handleSubmitQuiz}
            disabled={isSubmitting}
            sx={{
              backgroundColor: '#f05133',
              '&:hover': { backgroundColor: '#d03b1f' },
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
          </Button>
        )}
      </Box>
      
      {/* Results Dialog */}
      <Dialog
        open={showResultsDialog}
        onClose={() => {}}
        aria-labelledby="quiz-results-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="quiz-results-dialog-title">
          Quiz Completed!
        </DialogTitle>
        <DialogContent>
          {quizResult && (
            <>
              <DialogContentText>
                You've completed the quiz <strong>{quiz.title}</strong>.
              </DialogContentText>
              
              <Box 
                display="flex" 
                flexDirection="column" 
                alignItems="center" 
                my={3}
                p={3}
                bgcolor="rgba(240, 81, 51, 0.1)"
                borderRadius={2}
              >
                <Typography variant="h6" gutterBottom>
                  Your Score:
                </Typography>
                <Typography variant="h3" color="primary" fontWeight="bold">
                  {quizResult.score}%
                </Typography>
              </Box>
              
              <DialogContentText>
                You can view detailed results and retake the quiz from the results page.
              </DialogContentText>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            variant="contained"
            onClick={handleViewResults}
            sx={{
              backgroundColor: '#f05133',
              '&:hover': { backgroundColor: '#d03b1f' },
            }}
          >
            View Results
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default QuizViewer; 