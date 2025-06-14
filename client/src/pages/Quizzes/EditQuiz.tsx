import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  IconButton,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
  Grid,
  Card,
  CardContent,
  Divider,
  MenuItem,
  Select,
  InputLabel,
  Stepper,
  Step,
  StepLabel,
  FormHelperText,
  Alert,
  CircularProgress,
  FormLabel,
  Chip,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Check as CheckIcon,
  AutoFixHigh as AutoFixHighIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { Quiz, QuizQuestion, QuestionType } from '../../types/quiz';
import quizService from '../../services/quizService';
import { useAuth } from '../../context/AuthContext';
import { 
  calculateTotalPoints, 
  validateQuizPoints, 
  validateQuestionPoints, 
  suggestPointDistribution,
  autoDistributePoints,
  REQUIRED_TOTAL_POINTS 
} from '../../utils/quizValidation';

const EditQuiz: React.FC = () => {
  const navigate = useNavigate();
  const { quizId } = useParams<{ quizId: string }>();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Quiz data state
  const [quizData, setQuizData] = useState<Quiz>({
    title: '',
    description: '',
    questions: [],
    timeLimit: 30, // default 30 minutes
  });

  // Form validation
  const [titleError, setTitleError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');

  // Load quiz data on component mount
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const quiz = await quizService.getQuiz(quizId);
        setQuizData(quiz);
        setInitialDataLoaded(true);
      } catch (err: any) {
        console.error('Error loading quiz:', err);
        setError(err.message || 'Failed to load quiz data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuiz();
  }, [quizId]);

  // Handle quiz details changes
  const handleQuizDetailsChange = (field: keyof Quiz, value: string | number) => {
    setQuizData({
      ...quizData,
      [field]: value,
    });

    // Clear validation errors
    if (field === 'title') setTitleError('');
    if (field === 'description') setDescriptionError('');
  };

  // Add a new question
  const addQuestion = () => {
    const suggestedPoints = suggestPointDistribution(quizData.questions.length + 1);
    const newQuestion: QuizQuestion = {
      id: Date.now().toString(),
      text: '',
      options: [
        { id: Date.now() + '-1', text: '', isCorrect: false },
        { id: Date.now() + '-2', text: '', isCorrect: false },
        { id: Date.now() + '-3', text: '', isCorrect: false },
        { id: Date.now() + '-4', text: '', isCorrect: false },
      ],
      type: 'single',
      points: suggestedPoints,
    };

    setQuizData({
      ...quizData,
      questions: [...quizData.questions, newQuestion],
    });
  };

  // Remove a question
  const removeQuestion = (questionId: string) => {
    setQuizData({
      ...quizData,
      questions: quizData.questions.filter(q => q.id !== questionId),
    });
  };

  // Update question text
  const updateQuestionText = (questionId: string, text: string) => {
    setQuizData({
      ...quizData,
      questions: quizData.questions.map(q => 
        q.id === questionId ? { ...q, text } : q
      ),
    });
  };

  // Update question type
  const updateQuestionType = (questionId: string, type: QuestionType) => {
    setQuizData({
      ...quizData,
      questions: quizData.questions.map(q => {
        if (q.id === questionId) {
          // If changing from multiple to single, ensure only one option is selected
          if (type === 'single') {
            const correctOptions = q.options.filter(o => o.isCorrect);
            if (correctOptions.length > 1) {
              const updatedOptions = q.options.map((o, idx) => {
                return { ...o, isCorrect: idx === 0 ? true : false };
              });
              return { ...q, type, options: updatedOptions };
            }
          }
          return { ...q, type };
        }
        return q;
      }),
    });
  };

  // Add an option to a question
  const addOption = (questionId: string) => {
    setQuizData({
      ...quizData,
      questions: quizData.questions.map(q => {
        if (q.id === questionId) {
          return {
            ...q,
            options: [...q.options, { id: Date.now().toString(), text: '', isCorrect: false }],
          };
        }
        return q;
      }),
    });
  };

  // Remove an option from a question
  const removeOption = (questionId: string, optionId: string) => {
    setQuizData({
      ...quizData,
      questions: quizData.questions.map(q => {
        if (q.id === questionId) {
          return {
            ...q,
            options: q.options.filter(o => o.id !== optionId),
          };
        }
        return q;
      }),
    });
  };

  // Update option text
  const updateOptionText = (questionId: string, optionId: string, text: string) => {
    setQuizData({
      ...quizData,
      questions: quizData.questions.map(q => {
        if (q.id === questionId) {
          return {
            ...q,
            options: q.options.map(o => 
              o.id === optionId ? { ...o, text } : o
            ),
          };
        }
        return q;
      }),
    });
  };

  // Toggle option as correct/incorrect
  const toggleOptionCorrect = (questionId: string, optionId: string) => {
    setQuizData({
      ...quizData,
      questions: quizData.questions.map(q => {
        if (q.id === questionId) {
          if (q.type === 'single') {
            // For single choice, unselect all other options
            return {
              ...q,
              options: q.options.map(o => 
                ({ ...o, isCorrect: o.id === optionId })
              ),
            };
          } else {
            // For multiple choice, toggle the selected option
            return {
              ...q,
              options: q.options.map(o => 
                o.id === optionId ? { ...o, isCorrect: !o.isCorrect } : o
              ),
            };
          }
        }
        return q;
      }),
    });
  };

  // Update question points
  const updateQuestionPoints = (questionId: string, points: number) => {
    setQuizData({
      ...quizData,
      questions: quizData.questions.map(q => 
        q.id === questionId ? { ...q, points } : q
      ),
    });
  };

  // Auto-distribute points evenly
  const handleAutoDistributePoints = () => {
    setQuizData({
      ...quizData,
      questions: autoDistributePoints(quizData.questions),
    });
  };

  // Validate the current step before proceeding
  const validateCurrentStep = (): boolean => {
    if (activeStep === 0) {
      // Validate quiz details
      let isValid = true;
      
      if (!quizData.title.trim()) {
        setTitleError('Quiz title is required');
        isValid = false;
      }
      
      if (!quizData.description.trim()) {
        setDescriptionError('Quiz description is required');
        isValid = false;
      }
      
      return isValid;
    } else if (activeStep === 1) {
      // Validate questions
      if (quizData.questions.length === 0) {
        setError('Add at least one question');
        return false;
      }
      
      for (const question of quizData.questions) {
        if (!question.text.trim()) {
          setError('All questions must have text');
          return false;
        }
        
        if (question.options.length < 2) {
          setError('All questions must have at least two options');
          return false;
        }
        
        for (const option of question.options) {
          if (!option.text.trim()) {
            setError('All options must have text');
            return false;
          }
        }
        
        const hasCorrectOption = question.options.some(o => o.isCorrect);
        if (!hasCorrectOption) {
          setError('All questions must have at least one correct option');
          return false;
        }

        // Validate question points
        const pointsValidation = validateQuestionPoints(question.points);
        if (!pointsValidation.isValid) {
          setError(`Question "${question.text}": ${pointsValidation.message}`);
          return false;
        }
      }
      
      return true;
    } else if (activeStep === 2) {
      // Validate total points must equal 100
      const pointsValidation = validateQuizPoints(quizData.questions);
      if (!pointsValidation.isValid) {
        setError(pointsValidation.message);
        return false;
      }
      
      return true;
    }
    
    return true;
  };

  // Move to the next step
  const handleNext = () => {
    if (validateCurrentStep()) {
      setActiveStep(prevStep => prevStep + 1);
      setError(null);
    }
  };

  // Move to the previous step
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
    setError(null);
  };

  // Submit the updated quiz
  const handleSubmit = async () => {
    if (!quizId) return;

    // Final validation before submission
    if (!validateCurrentStep()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      await quizService.updateQuiz(quizId, quizData);
      
      // Show success message
      setSuccessMessage(`Quiz "${quizData.title}" has been updated successfully!`);
      setShowSuccess(true);
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigate('/quizzes/edit');
      }, 2000);
    } catch (err: any) {
      console.error('Error updating quiz:', err);
      setError(err.message || 'Failed to update quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading quiz data...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/quizzes/edit')}
            sx={{ mr: 2 }}
          >
            Back to Edit Quizzes
          </Button>
          <Typography variant="h4" component="h1" sx={{ color: '#f05133', fontWeight: 700 }}>
            Edit Quiz
          </Typography>
        </Box>
        <Typography variant="subtitle1" color="text.secondary">
          Make changes to your quiz content, questions, and settings
        </Typography>
      </Box>
      
      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        <Step>
          <StepLabel>Quiz Details</StepLabel>
        </Step>
        <Step>
          <StepLabel>Questions</StepLabel>
        </Step>
        <Step>
          <StepLabel>Review</StepLabel>
        </Step>
      </Stepper>
      
      {/* Step Content */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          mb: 4, 
          backgroundColor: '#161b22',
          borderRadius: '8px',
          border: '1px solid rgba(240, 81, 51, 0.3)',
        }}
      >
        {/* Step 1: Quiz Details */}
        {activeStep === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h5" sx={{ color: 'white', mb: 3 }}>
                Quiz Information
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Quiz Title"
                value={quizData.title}
                onChange={(e) => handleQuizDetailsChange('title', e.target.value)}
                error={!!titleError}
                helperText={titleError}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                sx={{ 
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.23)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: '#f05133' }
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                  '& .MuiInputBase-input': { color: 'white' }
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Quiz Description"
                value={quizData.description}
                onChange={(e) => handleQuizDetailsChange('description', e.target.value)}
                error={!!descriptionError}
                helperText={descriptionError}
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                sx={{ 
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.23)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: '#f05133' }
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                  '& .MuiInputBase-input': { color: 'white' }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Time Limit (minutes)"
                type="number"
                value={quizData.timeLimit}
                onChange={(e) => handleQuizDetailsChange('timeLimit', parseInt(e.target.value))}
                fullWidth
                variant="outlined"
                InputProps={{ inputProps: { min: 1, max: 180 } }}
                InputLabelProps={{ shrink: true }}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.23)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: '#f05133' }
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                  '& .MuiInputBase-input': { color: 'white' }
                }}
              />
            </Grid>
          </Grid>
        )}
        
        {/* Step 2: Questions */}
        {activeStep === 1 && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ color: 'white' }}>
                Quiz Questions
              </Typography>
              
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={addQuestion}
                sx={{
                  backgroundColor: '#f05133',
                  color: 'white',
                  '&:hover': { backgroundColor: '#d03b1f' },
                }}
              >
                Add Question
              </Button>
            </Box>

            {/* Points Tracking */}
            <Box mb={4} p={3} sx={{ backgroundColor: 'rgba(240, 81, 51, 0.1)', borderRadius: '8px', border: '1px solid rgba(240, 81, 51, 0.3)' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ color: 'white' }}>
                  Points Distribution
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AutoFixHighIcon />}
                  onClick={handleAutoDistributePoints}
                  disabled={quizData.questions.length === 0}
                  sx={{
                    borderColor: 'rgba(240, 81, 51, 0.5)',
                    color: '#f05133',
                    '&:hover': {
                      borderColor: '#f05133',
                      backgroundColor: 'rgba(240, 81, 51, 0.05)',
                    },
                  }}
                >
                  Auto-Distribute Points
                </Button>
              </Box>
              
              <Box display="flex" alignItems="center" gap={2}>
                <Chip
                  label={`Total: ${calculateTotalPoints(quizData.questions)}/${REQUIRED_TOTAL_POINTS}`}
                  color={calculateTotalPoints(quizData.questions) === REQUIRED_TOTAL_POINTS ? 'success' : 'warning'}
                  sx={{ 
                    fontSize: '1rem',
                    height: '32px',
                    color: 'white',
                    '& .MuiChip-label': { fontWeight: 'bold' }
                  }}
                />
                
                {quizData.questions.length > 0 && (
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {validateQuizPoints(quizData.questions).message}
                  </Typography>
                )}
              </Box>
            </Box>
            
            {quizData.questions.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="rgba(255, 255, 255, 0.7)" sx={{ mb: 2 }}>
                  No questions added yet. Add questions to your quiz.
                </Typography>
              </Box>
            ) : (
              quizData.questions.map((question, qIndex) => (
                <Paper 
                  key={question.id} 
                  elevation={2} 
                  sx={{ 
                    p: 3, 
                    mb: 3, 
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: 'white' }}>
                      Question {qIndex + 1}
                    </Typography>
                    
                    <Box display="flex" alignItems="center" gap={2}>
                      <TextField
                        label="Points"
                        type="number"
                        value={question.points || 1}
                        onChange={(e) => updateQuestionPoints(question.id, parseInt(e.target.value) || 1)}
                        variant="outlined"
                        size="small"
                        inputProps={{ min: 1, max: REQUIRED_TOTAL_POINTS }}
                        sx={{
                          width: '100px',
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.3)',
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.5)',
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: 'rgba(255, 255, 255, 0.7)',
                          },
                          '& .MuiInputBase-input': {
                            color: 'white',
                          },
                        }}
                      />
                      <IconButton
                        onClick={() => removeQuestion(question.id)}
                        size="small"
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <TextField
                    label="Question Text"
                    value={question.text}
                    onChange={(e) => updateQuestionText(question.id, e.target.value)}
                    fullWidth
                    variant="outlined"
                    sx={{ 
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.23)' },
                        '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                        '&.Mui-focused fieldset': { borderColor: '#f05133' }
                      },
                      '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                      '& .MuiInputBase-input': { color: 'white' }
                    }}
                  />
                  
                  <FormControl component="fieldset" sx={{ mb: 3 }}>
                    <FormLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Question Type</FormLabel>
                    <RadioGroup
                      row
                      value={question.type}
                      onChange={(e) => updateQuestionType(
                        question.id, 
                        e.target.value as QuestionType
                      )}
                    >
                      <FormControlLabel 
                        value="single" 
                        control={
                          <Radio 
                            sx={{ 
                              color: 'rgba(255, 255, 255, 0.7)',
                              '&.Mui-checked': { color: '#f05133' }
                            }} 
                          />
                        } 
                        label="Single Choice" 
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      />
                      <FormControlLabel 
                        value="multiple" 
                        control={
                          <Radio 
                            sx={{ 
                              color: 'rgba(255, 255, 255, 0.7)',
                              '&.Mui-checked': { color: '#f05133' }
                            }} 
                          />
                        } 
                        label="Multiple Choice" 
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      />
                    </RadioGroup>
                  </FormControl>
                  
                  <Typography variant="subtitle1" sx={{ color: 'white', mb: 2 }}>
                    Options:
                  </Typography>
                  
                  {question.options.map((option, oIndex) => (
                    <Box
                      key={option.id}
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 2,
                        gap: 2
                      }}
                    >
                      {question.type === 'single' ? (
                        <Radio
                          checked={option.isCorrect}
                          onChange={() => toggleOptionCorrect(question.id, option.id)}
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.7)',
                            '&.Mui-checked': { color: '#4caf50' }
                          }}
                        />
                      ) : (
                        <Checkbox
                          checked={option.isCorrect}
                          onChange={() => toggleOptionCorrect(question.id, option.id)}
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.7)',
                            '&.Mui-checked': { color: '#4caf50' }
                          }}
                        />
                      )}
                      
                      <TextField
                        label={`Option ${oIndex + 1}`}
                        value={option.text}
                        onChange={(e) => updateOptionText(
                          question.id,
                          option.id,
                          e.target.value
                        )}
                        fullWidth
                        variant="outlined"
                        size="small"
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.23)' },
                            '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                            '&.Mui-focused fieldset': { borderColor: '#f05133' }
                          },
                          '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                          '& .MuiInputBase-input': { color: 'white' }
                        }}
                      />
                      
                      {question.options.length > 2 && (
                        <IconButton
                          onClick={() => removeOption(question.id, option.id)}
                          size="small"
                          sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                  ))}
                  
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => addOption(question.id)}
                    sx={{
                      color: '#f05133',
                      '&:hover': { backgroundColor: 'rgba(240, 81, 51, 0.1)' }
                    }}
                  >
                    Add Option
                  </Button>
                </Paper>
              ))
            )}
          </>
        )}
        
        {/* Step 3: Review */}
        {activeStep === 2 && (
          <>
            <Typography variant="h5" sx={{ color: 'white', mb: 3 }}>
              Review Quiz
            </Typography>
            
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                Quiz Details:
              </Typography>
              <Typography variant="body1" color="rgba(255, 255, 255, 0.7)" sx={{ mb: 0.5 }}>
                <strong>Title:</strong> {quizData.title}
              </Typography>
              <Typography variant="body1" color="rgba(255, 255, 255, 0.7)" sx={{ mb: 0.5 }}>
                <strong>Description:</strong> {quizData.description}
              </Typography>
              <Typography variant="body1" color="rgba(255, 255, 255, 0.7)" sx={{ mb: 0.5 }}>
                <strong>Time Limit:</strong> {quizData.timeLimit} minutes
              </Typography>
              <Typography variant="body1" color="rgba(255, 255, 255, 0.7)" sx={{ mb: 0.5 }}>
                <strong>Questions:</strong> {quizData.questions.length}
              </Typography>
              <Typography variant="body1" color="rgba(255, 255, 255, 0.7)" sx={{ mb: 0.5 }}>
                <strong>Total Points:</strong> {calculateTotalPoints(quizData.questions)}/100
              </Typography>
              
              {/* Points Validation Status */}
              <Box mt={2}>
                <Chip
                  label={validateQuizPoints(quizData.questions).message}
                  color={validateQuizPoints(quizData.questions).isValid ? 'success' : 'error'}
                  sx={{ 
                    color: 'white',
                    '& .MuiChip-label': { fontWeight: 'bold' }
                  }}
                />
              </Box>
            </Box>
            
            <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', mb: 3 }} />
            
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              Questions:
            </Typography>
            
            {quizData.questions.map((question, qIndex) => (
              <Box key={question.id} sx={{ mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                  <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600 }}>
                    {qIndex + 1}. {question.text}
                  </Typography>
                  <Chip
                    label={`${question.points} pt${question.points !== 1 ? 's' : ''}`}
                    size="small"
                    sx={{ 
                      backgroundColor: 'rgba(240, 81, 51, 0.2)',
                      color: '#f05133',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
                <Typography variant="body2" color="rgba(255, 255, 255, 0.7)" sx={{ mb: 1 }}>
                  Type: {question.type === 'single' ? 'Single Choice' : 'Multiple Choice'}
                </Typography>
                
                <Box sx={{ pl: 3 }}>
                  {question.options.map((option, oIndex) => (
                    <Box 
                      key={option.id}
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 0.5, 
                        color: option.isCorrect ? '#4caf50' : 'rgba(255, 255, 255, 0.7)'
                      }}
                    >
                      <Typography variant="body2">
                        {String.fromCharCode(65 + oIndex)}. {option.text}
                        {option.isCorrect && ' ✓'}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
          </>
        )}
      </Paper>
      
      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          onClick={activeStep === 0 ? () => navigate('/quizzes/edit') : handleBack}
          startIcon={<ArrowBackIcon />}
          sx={{
            borderColor: 'rgba(240, 81, 51, 0.5)',
            color: '#f05133',
            '&:hover': {
              borderColor: '#f05133',
              backgroundColor: 'rgba(240, 81, 51, 0.05)',
            },
          }}
        >
          {activeStep === 0 ? 'Cancel' : 'Back'}
        </Button>
        
        {activeStep < 2 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={<ArrowBackIcon sx={{ transform: 'rotate(180deg)' }} />}
            sx={{
              backgroundColor: '#f05133',
              color: 'white',
              '&:hover': { backgroundColor: '#d03b1f' },
            }}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isSubmitting}
            startIcon={<SaveIcon />}
            sx={{
              backgroundColor: '#f05133',
              color: 'white',
              '&:hover': { backgroundColor: '#d03b1f' },
            }}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </Box>

      {/* Success Notification */}
      <Snackbar 
        open={showSuccess} 
        autoHideDuration={6000} 
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowSuccess(false)} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EditQuiz; 