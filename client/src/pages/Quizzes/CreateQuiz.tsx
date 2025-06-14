import React, { useState } from 'react';
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
import { useNavigate } from 'react-router-dom';
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

const CreateQuiz: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Validate the current step
  const validateCurrentStep = (): boolean => {
    if (activeStep === 0) {
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
      if (quizData.questions.length === 0) {
        setError('Please add at least one question');
        return false;
      }
      
      // Check if all questions have text and at least one correct option
      for (const question of quizData.questions) {
        if (!question.text.trim()) {
          setError('All questions must have text');
          return false;
        }
        
        // Check if options are properly filled
        if (question.options.length < 2) {
          setError('Each question must have at least 2 options');
          return false;
        }
        
        if (!question.options.some(o => o.isCorrect)) {
          setError('Each question must have at least one correct answer');
          return false;
        }
        
        if (question.options.some(o => !o.text.trim())) {
          setError('All options must have text');
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

  // Handle next step
  const handleNext = () => {
    if (validateCurrentStep()) {
      setActiveStep(prevStep => prevStep + 1);
      setError(null);
    }
  };

  // Handle back step
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
    setError(null);
  };

  // Handle quiz creation submission
  const handleSubmit = async () => {
    if (!user) {
      setError('You must be logged in to create a quiz');
      return;
    }

    // Final validation before submission
    if (!validateCurrentStep()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Add creator info to the quiz data
      const quizToSubmit: Quiz = {
        ...quizData,
        createdBy: user.id,
      };
      
      // Submit to service
      await quizService.createQuiz(quizToSubmit);
      
      // Show success message
      setSuccessMessage(`Quiz "${quizData.title}" has been created successfully!`);
      setShowSuccess(true);
      
      // Navigate back to quiz management after a short delay
      setTimeout(() => {
        navigate('/quizzes/manage');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Steps for the stepper
  const steps = ['Quiz Details', 'Questions', 'Review & Submit'];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={4}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/quizzes/manage')}
          sx={{ mr: 2 }}
        >
          Back to Quizzes
        </Button>
        <Typography variant="h4" component="h1" sx={{ color: '#f05133', fontWeight: 700 }}>
          Create New Quiz
        </Typography>
      </Box>

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Quiz Details Step */}
      {activeStep === 0 && (
        <Paper
          elevation={3}
          sx={{
            p: 4,
            backgroundColor: '#161b22',
            borderRadius: '8px',
            border: '1px solid rgba(240, 81, 51, 0.3)',
          }}
        >
          <Typography variant="h5" sx={{ color: 'white', mb: 3 }}>
            Quiz Information
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Quiz Title"
                value={quizData.title}
                onChange={(e) => handleQuizDetailsChange('title', e.target.value)}
                variant="outlined"
                error={!!titleError}
                helperText={titleError}
                sx={{
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
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Quiz Description"
                value={quizData.description}
                onChange={(e) => handleQuizDetailsChange('description', e.target.value)}
                variant="outlined"
                multiline
                rows={4}
                error={!!descriptionError}
                helperText={descriptionError}
                sx={{
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
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="time-limit-label" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Time Limit (minutes)
                </InputLabel>
                <Select
                  labelId="time-limit-label"
                  value={quizData.timeLimit}
                  onChange={(e) => handleQuizDetailsChange('timeLimit', e.target.value)}
                  label="Time Limit (minutes)"
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                  }}
                >
                  <MenuItem value={10}>10 minutes</MenuItem>
                  <MenuItem value={15}>15 minutes</MenuItem>
                  <MenuItem value={20}>20 minutes</MenuItem>
                  <MenuItem value={30}>30 minutes</MenuItem>
                  <MenuItem value={45}>45 minutes</MenuItem>
                  <MenuItem value={60}>60 minutes</MenuItem>
                  <MenuItem value={90}>90 minutes</MenuItem>
                  <MenuItem value={120}>120 minutes</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Questions Step */}
      {activeStep === 1 && (
        <Paper
          elevation={3}
          sx={{
            p: 4,
            backgroundColor: '#161b22',
            borderRadius: '8px',
            border: '1px solid rgba(240, 81, 51, 0.3)',
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" sx={{ color: 'white' }}>
              Quiz Questions
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={addQuestion}
              sx={{
                backgroundColor: '#f05133',
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
            <Box textAlign="center" py={5}>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                No questions added yet. Click "Add Question" to start creating your quiz.
              </Typography>
            </Box>
          ) : (
            <Box>
              {quizData.questions.map((question, questionIndex) => (
                <Card
                  key={question.id}
                  sx={{
                    mb: 4,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" sx={{ color: 'white' }}>
                        Question {questionIndex + 1}
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
                        <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                          <InputLabel id={`question-type-label-${question.id}`} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Question Type
                          </InputLabel>
                          <Select
                            labelId={`question-type-label-${question.id}`}
                            value={question.type}
                            onChange={(e) => updateQuestionType(question.id, e.target.value as QuestionType)}
                            label="Question Type"
                            sx={{
                              color: 'white',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255, 255, 255, 0.3)',
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255, 255, 255, 0.5)',
                              },
                            }}
                          >
                            <MenuItem value="single">Single Choice</MenuItem>
                            <MenuItem value="multiple">Multiple Choice</MenuItem>
                          </Select>
                        </FormControl>
                        <IconButton 
                          onClick={() => removeQuestion(question.id)}
                          sx={{ color: '#f05133' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    <TextField
                      fullWidth
                      label="Question Text"
                      value={question.text}
                      onChange={(e) => updateQuestionText(question.id, e.target.value)}
                      variant="outlined"
                      sx={{
                        mb: 3,
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

                    <Typography variant="subtitle1" sx={{ color: 'white', mb: 2 }}>
                      Options:
                    </Typography>

                    {question.options.map((option, optionIndex) => (
                      <Box key={option.id} display="flex" alignItems="center" mb={2}>
                        {question.type === 'single' ? (
                          <Radio
                            checked={option.isCorrect}
                            onChange={() => toggleOptionCorrect(question.id, option.id)}
                            sx={{ color: 'rgba(255, 255, 255, 0.7)', '&.Mui-checked': { color: '#f05133' } }}
                          />
                        ) : (
                          <Checkbox
                            checked={option.isCorrect}
                            onChange={() => toggleOptionCorrect(question.id, option.id)}
                            sx={{ color: 'rgba(255, 255, 255, 0.7)', '&.Mui-checked': { color: '#f05133' } }}
                          />
                        )}
                        <TextField
                          fullWidth
                          label={`Option ${optionIndex + 1}`}
                          value={option.text}
                          onChange={(e) => updateOptionText(question.id, option.id, e.target.value)}
                          variant="outlined"
                          size="small"
                          sx={{
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
                        {question.options.length > 2 && (
                          <IconButton 
                            onClick={() => removeOption(question.id, option.id)}
                            sx={{ color: '#f05133', ml: 1 }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Box>
                    ))}

                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => addOption(question.id)}
                      sx={{
                        mt: 1,
                        borderColor: 'rgba(240, 81, 51, 0.5)',
                        color: '#f05133',
                        '&:hover': {
                          borderColor: '#f05133',
                          backgroundColor: 'rgba(240, 81, 51, 0.05)',
                        },
                      }}
                    >
                      Add Option
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Paper>
      )}

      {/* Review Step */}
      {activeStep === 2 && (
        <Paper
          elevation={3}
          sx={{
            p: 4,
            backgroundColor: '#161b22',
            borderRadius: '8px',
            border: '1px solid rgba(240, 81, 51, 0.3)',
          }}
        >
          <Typography variant="h5" sx={{ color: 'white', mb: 3 }}>
            Review Your Quiz
          </Typography>

          <Box mb={4}>
            <Typography variant="h6" sx={{ color: '#f05133', mb: 1 }}>
              Quiz Details
            </Typography>
            <Typography variant="body1" sx={{ color: 'white', mb: 1 }}>
              <strong>Title:</strong> {quizData.title}
            </Typography>
            <Typography variant="body1" sx={{ color: 'white', mb: 1 }}>
              <strong>Description:</strong> {quizData.description}
            </Typography>
            <Typography variant="body1" sx={{ color: 'white', mb: 1 }}>
              <strong>Time Limit:</strong> {quizData.timeLimit} minutes
            </Typography>
            <Typography variant="body1" sx={{ color: 'white', mb: 1 }}>
              <strong>Number of Questions:</strong> {quizData.questions.length}
            </Typography>
            <Typography variant="body1" sx={{ color: 'white', mb: 1 }}>
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

          <Typography variant="h6" sx={{ color: '#f05133', mb: 2 }}>
            Questions Preview
          </Typography>

          {quizData.questions.map((question, questionIndex) => (
            <Box key={question.id} mb={3}>
              <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {questionIndex + 1}. {question.text}
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
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                ({question.type === 'single' ? 'Single choice' : 'Multiple choice'})
              </Typography>
              <Box ml={2}>
                {question.options.map((option, optionIndex) => (
                  <Box key={option.id} display="flex" alignItems="center" mb={0.5}>
                    <Typography
                      variant="body1"
                      sx={{
                        color: option.isCorrect ? '#4caf50' : 'white',
                        fontWeight: option.isCorrect ? 'bold' : 'normal',
                      }}
                    >
                      {String.fromCharCode(65 + optionIndex)}. {option.text}
                      {option.isCorrect && ' ✓'}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Paper>
      )}

      {/* Action Buttons */}
      <Box display="flex" justifyContent="space-between" mt={3}>
        <Button
          variant="outlined"
          onClick={activeStep === 0 ? () => navigate('/quizzes/manage') : handleBack}
          sx={{
            borderColor: 'rgba(240, 81, 51, 0.5)',
            color: '#f05133',
            '&:hover': {
              borderColor: '#f05133',
              backgroundColor: 'rgba(240, 81, 51, 0.05)',
            },
          }}
          disabled={isSubmitting}
        >
          {activeStep === 0 ? 'Cancel' : 'Back'}
        </Button>
        <Button
          variant="contained"
          onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
          startIcon={activeStep === steps.length - 1 ? <SaveIcon /> : null}
          sx={{
            backgroundColor: '#f05133',
            '&:hover': { backgroundColor: '#d03b1f' },
          }}
          disabled={isSubmitting}
        >
          {isSubmitting 
            ? 'Creating Quiz...' 
            : activeStep === steps.length - 1 
              ? 'Create Quiz' 
              : 'Next'
          }
        </Button>
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

export default CreateQuiz; 