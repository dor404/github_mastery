import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  LightbulbOutlined as HintIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import progressService from '../../services/progressService';
import { trainingExercises } from '../../data/trainingExercises';
import { Exercise, Task, TaskStep, ModuleProgress, Module } from '../../types/training';
import exerciseService from '../../services/exerciseService';

const ExerciseViewer: React.FC = () => {
  const { moduleId, exerciseId } = useParams<{ moduleId?: string; exerciseId?: string }>();
  const navigate = useNavigate();
  const [module, setModule] = useState<Module | null>(null);
  
  // For debugging - log the parameters from the URL
  useEffect(() => {
    // console.log('URL Parameters:', { moduleId, exerciseId });
  }, [moduleId, exerciseId]);
  
  // Use the correct parameter (either moduleId or exerciseId)
  const paramId = exerciseId || moduleId;

  const [activeStep, setActiveStep] = useState(0);
  const [showHints, setShowHints] = useState<boolean[]>([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [stepAnswers, setStepAnswers] = useState<string[]>([]);
  const [currentExerciseStep, setCurrentExerciseStep] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [stepFeedback, setStepFeedback] = useState<Array<{ type: 'success' | 'error'; message: string } | null>>([]);
  const [loading, setLoading] = useState(true);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [moduleProgressData, setModuleProgressData] = useState<ModuleProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exerciseStepProgress, setExerciseStepProgress] = useState<Record<string, number[]>>({});

  // Initialize and load module data and progress
  useEffect(() => {
    if (!paramId) return;
    
    const fetchExerciseData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get exercise data from static source
        const staticExercise = trainingExercises.find(m => m.id === paramId);
        
        // Also try to get from API to merge dynamic content
        try {
          // Prioritize API data if available
          const apiExercise = await exerciseService.getExercise(paramId);
          
          if (apiExercise) {
            console.log('Found exercise in database:', apiExercise.id);
            setModule(apiExercise);
            await fetchModuleProgress(apiExercise);
          } else if (staticExercise) {
            console.log('Using static exercise:', staticExercise.id);
            setModule(staticExercise);
            await fetchModuleProgress(staticExercise);
          } else {
            throw new Error('Exercise not found');
          }
        } catch (apiError) {
          // Fall back to static data if API fails
          if (staticExercise) {
            console.log('API error, using static exercise:', staticExercise.id);
            setModule(staticExercise);
            await fetchModuleProgress(staticExercise);
          } else {
            throw new Error('Exercise not found');
          }
        }
      } catch (error) {
        console.error('Error loading exercise:', error);
        setError('Failed to load the exercise. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchExerciseData();
    
    // Setup exercise refresh when tab regains focus
    const handleFocus = () => {
      fetchExerciseData();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [paramId]);

  // Reset state when moduleId changes
  useEffect(() => {
    setActiveStep(0);
    setUserAnswer('');
    setStepAnswers([]);
    setCurrentExerciseStep(0);
    setFeedback(null);
    setStepFeedback([]);
    setError(null);
    
    // Fetch module and progress if moduleId is available
    if (paramId) {
      fetchModuleAndProgress();
    } else {
      setLoading(false);
    }
  }, [paramId]);

  // Remove periodic refresh to only do it on focus
  useEffect(() => {
    if (!paramId) return;
    
    // Refresh progress when returning to the tab/window
    const handleFocus = () => {
      forceRefreshProgress();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      // Before unmounting, force a final update if module is complete
      if (moduleProgressData && moduleProgressData.progress === 100 && !moduleProgressData.completed) {
        progressService.updateModuleProgress(paramId, {
          completed: true,
          progress: 100
        }).catch(error => {
          // Silently handle error
        });
      }
      
      window.removeEventListener('focus', handleFocus);
    };
  }, [paramId, moduleProgressData]);

  // Force refresh progress data from the server
  const forceRefreshProgress = async () => {
    if (!paramId || !module) return;
    
    try {
      // Check if we have authentication
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // Fetch latest progress data
      const refreshedProgress = await progressService.getModuleProgress(paramId);
      
      // Only update if we have tasks and they don't match our current data
      if (refreshedProgress && refreshedProgress.tasks) {
        const currentTasksJSON = JSON.stringify(moduleProgressData?.tasks || []);
        const newTasksJSON = JSON.stringify(refreshedProgress.tasks);
        
        if (currentTasksJSON !== newTasksJSON) {
          setModuleProgressData(refreshedProgress);
          
          // Also update completedExercises set
          const completedExerciseIds = new Set<string>();
          refreshedProgress.tasks.forEach((task: { taskId: string; completed: boolean }) => {
            if (task.completed) {
              completedExerciseIds.add(task.taskId);
            }
          });
          
          setCompletedExercises(completedExerciseIds);
        }
      }
    } catch (error) {
      // Silently handle errors to avoid disrupting the UI
    }
  };

  // Fetch module data and progress
  const fetchModuleAndProgress = async () => {
    try {
      setLoading(true);
      
      let moduleData: Module | null = null;
      
      // First try to get the exercise from the API
      try {
        moduleData = await exerciseService.getExercise(paramId || '');
      } catch (apiError) {
        // If API fails, try to find it in static data
        moduleData = trainingExercises.find(exercise => exercise.id === paramId) || null;
      }
      
      if (!moduleData) {
        throw new Error('Module not found in database or static data');
      }
      
      setModule(moduleData);
      
      try {
        // Now fetch the exercise progress
        await fetchModuleProgress(moduleData);
      } catch (progressError) {
        // Continue with static data even if progress can't be fetched
      }
    } catch (error: any) {
      setError(error?.message || 'Failed to load module data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch module progress data
  const fetchModuleProgress = async (moduleData: Module) => {
    try {
      let progressData: ModuleProgress;
      
      try {
        progressData = await progressService.getModuleProgress(paramId || '');
        
        // Check if this is an empty record with no tasks
        if (!progressData.tasks || progressData.tasks.length === 0) {
          // Empty record
        } else {
          // We have a valid progress record with tasks, initialize state from it
          setModuleProgressData(progressData);
          
          // Initialize completedExercises set from the existing progress data
          const completedExerciseIds = new Set<string>();
          if (progressData && progressData.tasks) {
            progressData.tasks.forEach((exercise: { taskId: string; completed: boolean }) => {
              if (exercise.completed) {
                completedExerciseIds.add(exercise.taskId);
              }
            });
          }
          
          setCompletedExercises(completedExerciseIds);
          
          // Resume progress - find the right exercise and step to resume from
          resumeUserProgress(moduleData, progressData, completedExerciseIds);
          
          // Exit early since we have a valid progress record
          return;
        }
      } catch (fetchError: any) {
        // Create a default progress object as fallback
        progressData = {
          exerciseId: paramId || '',
          userId: '',
          completed: false,
          progress: 0,
          tasks: [],
          lastAccessed: new Date(),
          startedAt: new Date()
        };
      }
      
      // If we reached here, we either need to create a new progress record or update an existing empty one
      if ((!progressData.tasks || progressData.tasks.length === 0) && moduleData.tasks) {
        // Create a tasks array with an entry for each exercise in the module
        const initialTaskProgress = moduleData.tasks.map(exercise => ({
          taskId: exercise.id,
          completed: false,
          completedSteps: [] as number[]
        }));
        
        // Update our local progress data
        let updatedProgressData = {
          ...progressData,
          tasks: initialTaskProgress
        } as ModuleProgress;
        
        try {
          // Create minimal progress record
          const minimalRecord = await progressService.updateModuleProgress(paramId || '', {
            exerciseId: paramId,
            progress: 0,
            completed: false,
          });
          
          // Add all tasks in one API call if possible
          try {
            for (const task of initialTaskProgress) {
              await progressService.updateExerciseProgress(
                paramId || '',
                task.taskId,
                {
                  completed: false,
                  completedSteps: []
                }
              );
            }
          } catch (taskError) {
            // Proceed even if task creation has issues
          }
          
          // Get final state
          try {
            const refreshedProgress = await progressService.getModuleProgress(paramId || '');
            if (refreshedProgress && refreshedProgress.tasks && refreshedProgress.tasks.length > 0) {
              updatedProgressData = refreshedProgress;
            }
          } catch (refreshError) {
            // Continue with local data if refresh fails
          }
        } catch (error) {
          // Continue with local data if API calls fail
        }
        
        setModuleProgressData(updatedProgressData);
        
        // Initialize completedExercises set from the updated progress data
        const completedExerciseIds = new Set<string>();
        if (updatedProgressData && updatedProgressData.tasks) {
          updatedProgressData.tasks.forEach((exercise: { taskId: string; completed: boolean }) => {
            if (exercise.completed) {
              completedExerciseIds.add(exercise.taskId);
            }
          });
        }
        
        setCompletedExercises(completedExerciseIds);
        
        // Resume progress - find the right exercise and step to resume from
        resumeUserProgress(moduleData, updatedProgressData, completedExerciseIds);
      } else {
        // Initialize completedExercises set from the existing progress data
        const completedExerciseIds = new Set<string>();
        if (progressData && progressData.tasks) {
          progressData.tasks.forEach((exercise: { taskId: string; completed: boolean }) => {
            if (exercise.completed) {
              completedExerciseIds.add(exercise.taskId);
            }
          });
        }
        
        setModuleProgressData(progressData);
        setCompletedExercises(completedExerciseIds);
        
        // Resume progress - find the right exercise and step to resume from
        resumeUserProgress(moduleData, progressData, completedExerciseIds);
      }
    } catch (error: any) {
      // Set empty progress as fallback
      setCompletedExercises(new Set());
      
      // Add user-visible error
      setError(`Failed to load progress data: ${error.message}`);
    }
  };

  // Helper function to determine where to resume the user's progress
  const resumeUserProgress = (moduleData: Module, progressData: ModuleProgress, completedExerciseIds: Set<string>) => {
    console.log('Resuming user progress', { moduleData, progressData, completedExerciseIds });
    
    if (!moduleData || !progressData) return;
    
    // If there's no progress at all, start from the beginning
    if (progressData.progress === 0 && (!progressData.tasks || progressData.tasks.length === 0)) {
      console.log('No progress found, starting from the beginning');
      setActiveStep(0);
      return;
    }
    
    // If the module is already completed, show content first but allow navigation
    if (progressData.completed || progressData.progress === 100) {
      console.log('Module already completed');
      setActiveStep(0);
      return;
    }
    
    // Check if we're in the middle of an exercise
    // First, find any incomplete exercise
    const incompleteTaskIndex = moduleData.tasks.findIndex(
      task => !completedExerciseIds.has(task.id)
    );
    
    if (incompleteTaskIndex >= 0) {
      console.log(`Found incomplete task at index ${incompleteTaskIndex}`);
      const incompleteTask = moduleData.tasks[incompleteTaskIndex];
      
      // Get progress for this specific task
      const taskProgress = progressData.tasks?.find(
        progress => progress.taskId === incompleteTask.id
      );
      
      // Set the active step to this exercise
      setActiveStep(incompleteTaskIndex + 1); // +1 because first step is module content
      
      // If this task has step progress, resume from the last incomplete step
      if (taskProgress?.completedSteps && taskProgress.completedSteps.length > 0 && incompleteTask.steps) {
        const stepCount = incompleteTask.steps.length;
        
        // Find the maximum step index that's been completed
        const maxCompletedStep = Math.max(...taskProgress.completedSteps);
        
        // Set to the next step that needs to be completed
        const nextStepIndex = Math.min(maxCompletedStep + 1, stepCount - 1);
        console.log(`Resuming at step ${nextStepIndex} of task ${incompleteTask.id}`);
        
        setCurrentExerciseStep(nextStepIndex);
      }
    } else {
      // All tasks are completed, go to the content view
      console.log('All tasks are complete, showing content view');
      setActiveStep(0);
    }
  };

  // Update exercise progress in the backend
  const updateExerciseProgress = async (exerciseId: string, completed: boolean, completedSteps?: number[]) => {
    try {
      // Check for authentication
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No authentication token available for progress update');
        setError('Authentication required. Please log in to save your progress.');
        throw new Error('No authentication token found');
      }
      
      // Log that we're updating progress
      console.log(`Saving progress for task ${exerciseId}, completed: ${completed}, steps:`, completedSteps);
      
      // First, check if the task progress exists by trying to fetch it
      try {
        await progressService.getTaskProgress(paramId || '', exerciseId);
        console.log('Task progress exists, will update it');
      } catch (checkError) {
        console.log('Task progress does not exist yet, will create it:', checkError);
      }
      
      // Ensure completedSteps is an array
      const safeCompletedSteps = Array.isArray(completedSteps) ? completedSteps : [];
      
      // Debug what we're sending to the API
      console.log('Sending to API:', {
        exerciseId: paramId,
        taskId: exerciseId,
        payload: { completed, completedSteps: safeCompletedSteps }
      });
      
      // Try to update progress through API
      try {
        const updatedProgress = await progressService.updateExerciseProgress(
          paramId || '', 
          exerciseId, 
          { 
            completed, 
            completedSteps: safeCompletedSteps 
          }
        );
        
        console.log('Progress updated successfully:', updatedProgress);
        
        // Update module progress data with latest from server
        setModuleProgressData(updatedProgress);
        
        // Update local state if successful
        if (completed) {
          setCompletedExercises(prev => new Set([...Array.from(prev), exerciseId]));
        } else if (safeCompletedSteps.length > 0) {
          // Update local step completion state
          const existingSteps = exerciseStepProgress[exerciseId] || [];
          const newSteps = Array.from(new Set([...existingSteps, ...safeCompletedSteps]));
          setExerciseStepProgress(prev => ({
            ...prev,
            [exerciseId]: newSteps
          }));
        }
        
        // Clear any existing error messages since the operation succeeded
        setError(null);
        
        return updatedProgress;
      } catch (apiError: any) {
        console.error('API error updating progress:', apiError);
        console.error('Request data:', {
          url: `${paramId}/${exerciseId}`,
          data: { completed, completedSteps: safeCompletedSteps }
        });
        
        // Use our helper to handle the error
        handleNetworkError(apiError);
        throw apiError;
      }
    } catch (error: any) {
      console.error('Error updating progress:', error);
      
      // Don't override auth errors with generic message
      if (error.message && !error.message.includes('authentication')) {
        handleNetworkError(error);
      }
      
      throw error;
    }
  };

  // Helper function to handle and display network errors
  const handleNetworkError = (error: any) => {
    console.error('Network error:', error);
    
    // Extract useful information from the error
    let errorMessage = 'Failed to save your progress. Please try again later.';
    let details = '';
    
    if (error.response) {
      // The server responded with an error status
      const status = error.response.status;
      const serverMessage = error.response.data?.message || '';
      const serverError = error.response.data?.error || '';
      
      console.log('Server error response:', {
        status,
        message: serverMessage,
        error: serverError
      });
      
      if (status === 401) {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (status === 404) {
        errorMessage = 'Exercise not found. Please try refreshing the page.';
      } else if (status === 400) {
        errorMessage = 'Invalid data submitted. Please try again.';
        details = serverMessage || serverError;
      } else if (status === 409) {
        // This is a conflict error, which might be recoverable
        errorMessage = 'Progress data conflict. Your progress will be synchronized.';
        details = 'Please continue normally.';
        
        // For 409 errors, we can reset the error after a short delay
        // since our logic should handle the recovery
        setTimeout(() => setError(null), 3000);
      } else if (status >= 500) {
        errorMessage = 'Server error. The system is currently experiencing issues.';
        details = 'Please try again in a few moments.';
      }
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = 'Network connection issue. Please check your internet connection.';
    } else {
      // Something else happened while setting up the request
      errorMessage = 'An unexpected error occurred. Please refresh and try again.';
      details = error.message || '';
    }
    
    // Set the error message
    setError(details ? `${errorMessage} ${details}` : errorMessage);
    
    // Return the error message for possible further handling
    return errorMessage;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress data-testid="loading-progress" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h4">Error</Typography>
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/training')} 
          sx={{ mt: 2 }}
          startIcon={<ArrowBackIcon />}
        >
          Back to Modules
        </Button>
      </Box>
    );
  }

  if (!module) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h4">Module not found</Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/training')} 
          sx={{ mt: 2 }}
          startIcon={<ArrowBackIcon />}
        >
          Back to Modules
        </Button>
      </Box>
    );
  }

  const handleBack = () => {
    if (activeStep === 0) {
      navigate('/training');
    } else {
      setActiveStep((prev) => prev - 1);
      setUserAnswer('');
      setStepAnswers([]);
      setCurrentExerciseStep(0);
      setFeedback(null);
      setStepFeedback([]);
    }
  };

  const handleNext = () => {
    if (module && activeStep < module.tasks.length) {
      setActiveStep((prev) => prev + 1);
      setUserAnswer('');
      setCurrentExerciseStep(0);
      setFeedback(null);
      setStepFeedback([]);
    }
  };

  const toggleHint = (index: number) => {
    setShowHints((prev) => {
      const newShowHints = [...prev];
      newShowHints[index] = !newShowHints[index];
      return newShowHints;
    });
  };

  const validateAnswer = (task: Task) => {
    if (!task || !task.id) {
      console.error("Invalid task data:", task);
      setFeedback({
        type: 'error',
        message: 'Error validating answer. Please try again.',
      });
      return false;
    }

    if (userAnswer.trim().toLowerCase() === task.solution.trim().toLowerCase()) {
      // Check for token before attempting to update progress
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No authentication token available for progress update - showing success UI only');
        // Still show success feedback but warn user about login
        setFeedback({
          type: 'success',
          message: "Correct! You got it right! Note: Progress won't be saved until you log in."
        });
        return true;
      }

      // console.log(`Correct answer for task ${task.id}`);
      
      // Update progress - first update local state for immediate feedback
      setCompletedExercises(prev => new Set([...Array.from(prev), task.id]));
      
      // Prepare updated progress data
      let updatedTasks = [];
      if (moduleProgressData && moduleProgressData.tasks) {
        // Update existing task if it exists
        updatedTasks = moduleProgressData.tasks.map(existingTask => 
          existingTask.taskId === task.id 
            ? { ...existingTask, completed: true }
            : existingTask
        );
        
        // If task doesn't exist in progress data, add it
        if (!moduleProgressData.tasks.some(t => t.taskId === task.id)) {
          updatedTasks.push({
            taskId: task.id,
            completed: true,
            completedSteps: []
          });
        }
      } else {
        // If no tasks exist yet, create the first one
        updatedTasks = [{
          taskId: task.id,
          completed: true,
          completedSteps: []
        }];
      }
      
      // Calculate new progress percentage using the actual task count from the module
      const totalTasks = module?.tasks.length || 0;
      const completedTasksCount = updatedTasks.filter(t => t.completed).length;
      const newProgress = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;
      const isFullyCompleted = completedTasksCount === totalTasks;
      
      // Update module progress data locally for immediate feedback
      if (moduleProgressData) {
        setModuleProgressData({
          ...moduleProgressData,
          tasks: updatedTasks,
          progress: newProgress,
          completed: isFullyCompleted
        });
      }
      
      // Try to update progress through API with robust error handling
      try {
        // First, try updating the task progress
        progressService.updateExerciseProgress(
          paramId || '', 
          task.id, 
          { 
            completed: true,
            completedSteps: [] // Ensure we send an empty array rather than undefined
          }
        ).then(updatedProgress => {
          console.log('Successfully updated task progress:', updatedProgress);
          
          // Check if this was the last task to complete the module
          if (isFullyCompleted) {
            // Also update the overall module progress to ensure it's marked as completed
            progressService.updateModuleProgress(paramId || '', {
              completed: true,
              progress: 100
            }).then(finalProgress => {
              console.log('Successfully completed module:', finalProgress);
              setModuleProgressData(finalProgress);
            }).catch(err => {
              console.error('Error marking module as complete:', err);
              
              // Still try to update local state for better UX
              if (moduleProgressData) {
                setModuleProgressData({
                  ...moduleProgressData,
                  completed: true,
                  progress: 100
                });
              }
            });
          } else {
            // Just update the module progress data
            setModuleProgressData(updatedProgress);
          }
        }).catch(error => {
          console.error('Error updating task progress:', error);
          
          // Try a simpler update as fallback
          progressService.updateModuleProgress(paramId || '', {
            progress: newProgress
          }).catch(err => {
            console.error('Error in fallback progress update:', err);
          });
          
          // Even if API call fails, keep UI state updated to avoid frustrating the user
        });
      } catch (error) {
        console.error('Error in validateAnswer:', error);
      }
      
      // Set feedback state
      setFeedback({
        type: 'success',
        message: 'Correct! You got it right!',
      });
      
      return true;
    } else {
      setFeedback({
        type: 'error',
        message: 'That\'s not quite right. Try again!',
      });
      return false;
    }
  };

  const validateStepAnswer = (step: TaskStep, answer: string, stepIndex: number, exerciseId: string) => {
    // Check if the step has a validationCommand
    if (!step) {
      setStepFeedback(prev => {
        const newFeedback = [...prev];
        newFeedback[stepIndex] = {
          type: 'error',
          message: 'Invalid step'
        };
        return newFeedback;
      });
      return;
    }
    
    // Extremely simplified validation 
    const matchesExpected = step.solution && typeof step.solution === 'string' && 
      (step.solution.trim().toLowerCase() === answer.trim().toLowerCase() ||
       answer.trim().toLowerCase().includes(step.solution.trim().toLowerCase()));
    
    setStepFeedback(prev => {
      const newFeedback = [...prev];
      if (matchesExpected) {
        newFeedback[stepIndex] = {
          type: 'success',
          message: 'Correct! Great job.'
        };
      } else {
        newFeedback[stepIndex] = {
          type: 'error',
          message: 'That\'s not correct. Please try again or check the hint.'
        };
      }
      return newFeedback;
    });
    
    // Early return if not success
    if (!matchesExpected) return;
    
    // Update the progress in the backend
    if (module?.tasks) {
      const currentTask = module.tasks.find(task => task.id === exerciseId);
      
      if (currentTask?.steps) {
        // Check current task progress - simplified approach
        let completedSteps: number[] = [];
        
        if (moduleProgressData?.tasks) {
          const existingTaskProgress = moduleProgressData.tasks.find(
            task => task.taskId === exerciseId
          );
          
          if (existingTaskProgress && existingTaskProgress.completedSteps) {
            completedSteps = [...existingTaskProgress.completedSteps];
          }
        }
        
        // Add this step if not already included
        if (!completedSteps.includes(stepIndex)) {
          completedSteps.push(stepIndex);
        }
        
        // If all steps are completed, mark exercise as completed
        const isFullyCompleted = currentTask.steps && Array.isArray(currentTask.steps) ? 
          completedSteps.length === currentTask.steps.length : false;
        
        // Update local state first for immediate feedback
        if (moduleProgressData && moduleProgressData.tasks) {
          const updatedTasks = moduleProgressData.tasks.map(task => 
            task.taskId === exerciseId 
              ? { ...task, completed: isFullyCompleted, completedSteps }
              : task
          );
          
          // Calculate new progress percentage
          const totalTasks = module.tasks.length;
          const completedTasksCount = updatedTasks.filter(t => t.completed).length;
          const newProgress = Math.round((completedTasksCount / totalTasks) * 100);
          
          // Update local state
          setModuleProgressData({
            ...moduleProgressData,
            tasks: updatedTasks,
            progress: newProgress,
            completed: newProgress === 100
          });
        }
        
        // Now update the backend
        try {
          // Mark as completed if all steps are done
          updateExerciseProgress(exerciseId, isFullyCompleted, completedSteps);
        } catch (error) {
          console.error('Error updating progress after step completion:', error);
        }
      }
    }
  };

  // Handle next step button click
  const handleStepNext = async () => {
    try {
      if (!module || !module.tasks || activeStep < 1 || activeStep > module.tasks.length) {
        return;
      }
      
      const currentTask = module.tasks[activeStep - 1];
      
      if (!currentTask || !currentTask.steps || !Array.isArray(currentTask.steps)) {
        return;
      }
      
      // We've now verified that steps is an array, so we can safely use it
      const steps = currentTask.steps;
      
      // Check for authentication token before attempting to save progress
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in to save your progress.');
        return;
      }
      
      // Save the current step as completed if it hasn't been saved yet
      const currentStepIndex = currentExerciseStep;
      
      // Determine if this step needs to be saved (in case it wasn't already)
      const existingSteps = exerciseStepProgress[currentTask.id] || [];
      if (!existingSteps.includes(currentStepIndex)) {
        console.log(`Saving step ${currentStepIndex} completion for task ${currentTask.id} before advancing`);
        
        // Add to our completedSteps
        let newCompletedSteps = [...existingSteps, currentStepIndex];
        
        // Check if this is the last step
        const isLastStep = currentStepIndex === steps.length - 1;
        
        // Try with multiple approaches if needed
        let progressSaved = false;
        let saveError: any = null;
        
        try {
          // First attempt - use our standard approach
          await updateExerciseProgress(
            currentTask.id,
            isLastStep, // Only mark as complete if it's the last step
            newCompletedSteps
          );
          progressSaved = true;
        } catch (err: any) {
          saveError = err;
          console.error('First progress save attempt failed:', err);
          
          // Only attempt recovery for 409 errors
          if (err.response?.status === 409) {
            try {
              // Second attempt - try the backend compatibility route directly
              console.log('Attempting fallback progress update approach');
              const response = await progressService.updateModuleProgress(paramId || '', {
                completed: isLastStep,
                progress: isLastStep ? 100 : undefined
              });
              
              // If the module update succeeds, try updating the specific task
              try {
                await progressService.updateExerciseProgress(
                  paramId || '',
                  currentTask.id,
                  {
                    completed: isLastStep,
                    completedSteps: newCompletedSteps
                  }
                );
                progressSaved = true;
              } catch (taskError) {
                console.error('Task update failed after module update:', taskError);
              }
            } catch (moduleError) {
              console.error('Module update approach also failed:', moduleError);
            }
          }
        }
        
        // If all attempts failed, show an error
        if (!progressSaved && saveError) {
          handleNetworkError(saveError);
          
          // For 409 errors specifically, we can still proceed since they're just conflicts
          if (saveError.response?.status !== 409) {
            return; // Don't proceed for other errors
          }
        }
      }
      
      // If we reached here, either the progress was saved or it's a conflict we can ignore
      // Move to the next step
      setCurrentExerciseStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
      
      // Clear answer and feedback for the next step
      setStepAnswers(prev => {
        const newAnswers = [...prev];
        newAnswers[currentExerciseStep + 1] = '';
        return newAnswers;
      });
      setStepFeedback(prev => {
        const newFeedback = [...prev];
        newFeedback[currentExerciseStep + 1] = null;
        return newFeedback;
      });
    } catch (error) {
      console.error('Error during step transition:', error);
      handleNetworkError(error);
    }
  };

  const navigateToHome = () => {
    navigate('/training');
  };

  const navigateToNextModule = async () => {
    try {
      // First mark current module as completed
      if (module && paramId) {
        // Get the currently active task
        if (activeStep > 0 && activeStep <= module.tasks.length) {
          const currentTask = module.tasks[activeStep - 1];
          if (currentTask) {
            // Mark the current task as completed if not already
            if (!completedExercises.has(currentTask.id)) {
              await updateExerciseProgress(currentTask.id, true);
            }
          }
        }
        
        // Mark the whole module as completed
        console.log('Marking module as complete', paramId);
        try {
          await progressService.updateModuleProgress(paramId, {
            completed: true,
            progress: 100,
          });
        } catch (e) {
          console.error('Error marking module as complete:', e);
        }
      }
      
      // Now navigate away
      navigate('/training');
    } catch (error) {
      console.error('Error completing module:', error);
      setError('Failed to save your progress. Try again later.');
    }
  };

  // Helper function to find and navigate to the next module
  const findAndNavigateToNextModule = () => {
    // Find the next module in the sequence from both sources
    // First get all exercises from both sources
    exerciseService.getAllExercises()
      .then(apiExercises => {
        // Combine API and static exercises
        const exerciseMap = new Map<string, Module>();
        
        // Add static exercises first
        trainingExercises.forEach(ex => {
          exerciseMap.set(ex.id, ex);
        });
        
        // Then override with API exercises
        apiExercises.forEach(ex => {
          exerciseMap.set(ex.id, ex);
        });
        
        // Convert to array and sort by difficulty
        const allExercises = Array.from(exerciseMap.values());
        const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
        allExercises.sort((a, b) => {
          return (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 99) - 
                (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 99);
        });
        
        // Find current exercise index
        const currentIndex = allExercises.findIndex(m => m.id === module!.id);
        if (currentIndex !== -1 && currentIndex < allExercises.length - 1) {
          const nextModule = allExercises[currentIndex + 1];
          navigate(`/training/${nextModule.id}`);
        } else {
          navigate('/training');
        }
      })
      .catch(error => {
        // Fallback to static data only if API fails
        const staticIndex = trainingExercises.findIndex(m => m.id === module!.id);
        if (staticIndex !== -1 && staticIndex < trainingExercises.length - 1) {
          const nextModule = trainingExercises[staticIndex + 1];
          navigate(`/training/${nextModule.id}`);
        } else {
          navigate('/training');
        }
      });
  };

  const getModuleProgress = (): number => {
    if (!module || !moduleProgressData) return 0;
    
    // Double-check that we're looking at the right module
    if (moduleProgressData.exerciseId !== (paramId || '')) {
      console.warn('Progress data mismatch - expected:', paramId, 'got:', moduleProgressData.exerciseId);
    }
    
    // If it's explicitly marked as completed, always return 100%
    if (moduleProgressData.completed) {
      return 100;
    }
    
    // Count total steps across all tasks and completed steps
    let totalSteps = 0;
    let completedSteps = 0;
    
    module.tasks.forEach(task => {
      if (task.steps && task.steps.length > 0) {
        // Task has steps
        totalSteps += task.steps.length;
        
        // Find corresponding task in progress data
        const taskProgress = moduleProgressData.tasks.find(t => t.taskId === task.id);
        if (taskProgress) {
          if (taskProgress.completed) {
            // If task is marked completed, count all steps as completed
            completedSteps += task.steps.length;
          } else if (taskProgress.completedSteps && taskProgress.completedSteps.length > 0) {
            // Count individual completed steps
            completedSteps += taskProgress.completedSteps.length;
          }
        }
      } else {
        // Task doesn't have steps, count as a single step
        totalSteps += 1;
        
        // Check if task is completed
        const taskProgress = moduleProgressData.tasks.find(t => t.taskId === task.id);
        if (taskProgress && taskProgress.completed) {
          completedSteps += 1;
        }
      }
    });
    
    // Calculate progress percentage
    if (totalSteps > 0) {
      return Math.round((completedSteps / totalSteps) * 100);
    }
    
    // Fallback to stored progress value
    return moduleProgressData.progress || 0;
  };

  const getProgressText = (): string => {
    const progress = getModuleProgress();
    
    if (moduleProgressData && module) {
      if (progress === 100 || moduleProgressData.completed) {
        return `Completed (100%)`;
      }
      
      // Count total steps across all tasks
      let totalSteps = 0;
      let completedSteps = 0;
      
      // Iterate through each task in the module to count steps
      module.tasks.forEach(task => {
        if (task.steps && task.steps.length > 0) {
          totalSteps += task.steps.length;
          
          // Find matching task in progress data
          const taskProgress = moduleProgressData.tasks.find(t => t.taskId === task.id);
          if (taskProgress && taskProgress.completedSteps) {
            // Count completed steps
            completedSteps += taskProgress.completedSteps.length;
          }
        } else {
          // For tasks without steps, count them as one step
          totalSteps += 1;
          
          // Check if this task is completed
          const taskProgress = moduleProgressData.tasks.find(t => t.taskId === task.id);
          if (taskProgress && taskProgress.completed) {
            completedSteps += 1;
          }
        }
      });
      
      // If no steps found, fallback to task count
      if (totalSteps === 0) {
        const completedTasks = moduleProgressData.tasks.filter(task => task.completed).length;
        const totalTasks = module.tasks.length;
        return `In progress: ${completedTasks}/${totalTasks} tasks (${progress}%)`;
      }
      
      // Return progress based on steps
      return `In progress: ${completedSteps}/${totalSteps} tasks (${progress}%)`;
    }
    
    return `In progress (${progress}%)`;
  };

  // Force reset the progress data for this module - useful when progress isn't showing correctly
  const resetProgressData = async () => {
    if (!module || !paramId) return;
    
    try {
      // First, get the raw progress from the server
      // console.log('Forcibly resetting progress data for module:', paramId);
      
      const progressData = await progressService.getModuleProgress(paramId);
      
      // If all tasks are completed, force it to 100%
      if (progressData.tasks.every(task => task.completed) && progressData.tasks.length === module.tasks.length) {
        // console.log('All tasks complete, setting to 100%');
        await progressService.updateModuleProgress(paramId, {
          completed: true,
          progress: 100
        });
      } else {
        // Otherwise, recalculate the progress percentage
        const totalTasks = module.tasks.length;
        const completedTasks = progressData.tasks.filter(task => task.completed).length;
        const calculatedProgress = Math.round((completedTasks / totalTasks) * 100);
        
        // console.log('Recalculating progress:', calculatedProgress);
        await progressService.updateModuleProgress(paramId, {
          progress: calculatedProgress,
          completed: calculatedProgress === 100
        });
      }
    } catch (error) {
      console.error('Error resetting progress data:', error);
    }
  };

  const renderStepByStepExercise = (task: Task) => {
    if (!task.steps || task.steps.length === 0) return null;
    
    const currentStep = task.steps[currentExerciseStep];
    
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
          Step {currentExerciseStep + 1} of {task.steps.length}:
        </Typography>
        
        <Typography variant="h6" gutterBottom>
          {currentStep.instruction}
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            value={stepAnswers[currentExerciseStep] || ''}
            onChange={(e) => {
              const newAnswers = [...stepAnswers];
              newAnswers[currentExerciseStep] = e.target.value;
              setStepAnswers(newAnswers);
            }}
            placeholder="Enter your Git command here..."
            variant="outlined"
            InputProps={{
              sx: {
                backgroundColor: '#010409', // Darker terminal background
                color: '#e6edf3', // Light terminal text
                fontFamily: '"Roboto Mono", "Consolas", monospace',
                '&::placeholder': {
                  color: '#8b949e',
                },
                '&:focus': {
                  borderColor: '#58a6ff',
                },
                '&::before': {
                  content: '"$ "',
                  color: '#f05133',
                  fontWeight: 'bold',
                  marginRight: '0.5rem',
                },
                padding: '12px',
              },
            }}
          />
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Button
              variant="contained"
              onClick={() => validateStepAnswer(currentStep, stepAnswers[currentExerciseStep] || '', currentExerciseStep, task.id)}
              sx={{
                bgcolor: '#F05133', // Git orange
                '&:hover': {
                  bgcolor: '#d03b1f',
                },
              }}
            >
              Check Answer
            </Button>
            
            <Box>
              {currentExerciseStep < task.steps.length - 1 && stepFeedback[currentExerciseStep]?.type === 'success' && (
                <Button
                  variant="contained"
                  onClick={handleStepNext}
                  sx={{
                    bgcolor: '#2ea44f',
                    color: '#ffffff',
                    '&:hover': {
                      bgcolor: '#2c974b',
                    },
                  }}
                >
                  Next Step
                </Button>
              )}
              
              {stepFeedback[currentExerciseStep]?.type === 'success' && currentExerciseStep === task.steps.length - 1 && (
                activeStep < module.tasks.length ? (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleNext}
                    sx={{
                      bgcolor: '#2ea44f',
                      '&:hover': {
                        bgcolor: '#2c974b',
                      },
                    }}
                  >
                    Next Exercise
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={navigateToNextModule}
                    sx={{
                      bgcolor: '#2ea44f',
                      '&:hover': {
                        bgcolor: '#2c974b',
                      },
                    }}
                  >
                    Complete Module & Continue
                  </Button>
                )
              )}
            </Box>
          </Box>
          
          <Box sx={{ mt: 3, mb: 2 }}>
            {task.hints && task.hints.map((hint, index) => (
              <Box key={index} sx={{ mb: 1 }}>
                <Button
                  startIcon={<HintIcon />}
                  onClick={() => toggleHint(index)}
                  variant="outlined"
                  size="small"
                  color="secondary"
                >
                  Hint {index + 1}
                </Button>
                {showHints[index] && (
                  <Typography variant="body2" sx={{ 
                    ml: 4, 
                    mt: 1, 
                    p: 1.5, 
                    borderLeft: '3px solid #f05133',
                    bgcolor: 'rgba(240, 81, 51, 0.1)',
                    borderRadius: '0 4px 4px 0'
                  }}>
                    {hint}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
          
          {stepFeedback[currentExerciseStep] && (
            <Alert
              severity={stepFeedback[currentExerciseStep]?.type || 'info'}
              sx={{ mt: 2 }}
              action={
                stepFeedback[currentExerciseStep]?.type === 'success' && (
                  <CheckIcon color="success" />
                )
              }
            >
              {stepFeedback[currentExerciseStep]?.message}
            </Alert>
          )}
          
          {/* Show hint if error feedback exists */}
          {stepFeedback[currentExerciseStep]?.type === 'error' && (
            <Box sx={{ 
              mt: 2, 
              p: 2, 
              bgcolor: '#0d1117', 
              color: '#e6edf3',
              borderRadius: 1,
              border: '1px solid #30363d' 
            }}>
              <Typography variant="subtitle2" color="#58a6ff">
                Hint: Try using the exact command <code style={{ 
                  backgroundColor: '#161b22', 
                  padding: '0.2em 0.4em',
                  borderRadius: '3px' 
                }}>{currentStep.solution}</code>
              </Typography>
            </Box>
          )}
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle2" color="text.secondary">
          {getProgressText()}
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={getModuleProgress()} 
          sx={{ mt: 1 }}
        />
      </Box>
    );
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">{module.title}</Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <div className="MuiBox-root css-i3pbo">
          <Typography variant="subtitle1">
            {getProgressText()}
          </Typography>
          <LinearProgress
            data-testid="module-progress"
            variant="determinate"
            value={getModuleProgress()}
            className="MuiLinearProgress-root MuiLinearProgress-colorPrimary MuiLinearProgress-determinate css-dye3ve-MuiLinearProgress-root"
          />
        </div>
      </Box>

      <Stepper 
        activeStep={activeStep} 
        sx={{ 
          mb: 4,
          '& .MuiStepLabel-root .Mui-active': {
            color: '#f05133', // Git logo color for active step
          },
          '& .MuiStepLabel-root .Mui-completed': {
            color: '#2ea44f', // GitHub green for completed steps
          },
        }}
      >
        <Step key="content">
          <StepLabel>Content</StepLabel>
        </Step>
        {module.tasks.map((exercise, index) => (
          <Step key={exercise.id}>
            <StepLabel>{completedExercises.has(exercise.id) && <CheckIcon />} Exercise {index + 1}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper 
        sx={{ 
          p: 4, 
          mb: 4, 
          border: '1px solid #30363d',
          boxShadow: '0 3px 6px rgba(149,157,165,0.15)',
          '& pre': {
            backgroundColor: '#0d1117',
            color: '#e6edf3',
            padding: 2,
            borderRadius: 1,
            fontFamily: '"Roboto Mono", "Consolas", monospace',
            overflow: 'auto',
          },
          '& code': {
            backgroundColor: '#0d1117',
            color: '#e6edf3',
            padding: '0.2em 0.4em',
            borderRadius: '3px',
            fontFamily: '"Roboto Mono", "Consolas", monospace',
          }
        }}
      >
        {activeStep === 0 ? (
          <Box>
            <ReactMarkdown>{module.content}</ReactMarkdown>
          </Box>
        ) : (
          <Box>
            {module.tasks[activeStep - 1] ? (
              <>
                <Typography variant="h5" gutterBottom>
                  {module.tasks[activeStep - 1].question}
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  {module.tasks[activeStep - 1].description}
                </Typography>

                <Divider sx={{ my: 3 }} />

                {module.tasks[activeStep - 1] && module.tasks[activeStep - 1].isStepByStep ? (
                  renderStepByStepExercise(module.tasks[activeStep - 1])
                ) : (
                  <>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Your Answer:
                      </Typography>
                      <TextField
                        fullWidth
                        label="Your Answer"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        variant="outlined"
                        margin="normal"
                        inputProps={{
                          'data-testid': 'exercise-answer-input'
                        }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mt: 2, mb: 2 }}>
                      <Button
                        variant="contained"
                        onClick={() => validateAnswer(module.tasks[activeStep - 1])}
                        sx={{
                          bgcolor: '#F05133', // Git orange
                          '&:hover': {
                            bgcolor: '#d03b1f',
                          },
                        }}
                      >
                        Check Answer
                      </Button>
                      
                      <Box>
                        {feedback?.type === 'success' && (
                          <>
                            {activeStep < module.tasks.length ? (
                              <Button
                                variant="contained"
                                color="success"
                                onClick={handleNext}
                                sx={{
                                  bgcolor: '#2ea44f',
                                  '&:hover': {
                                    bgcolor: '#2c974b',
                                  },
                                }}
                              >
                                Next Exercise
                              </Button>
                            ) : (
                              <Button
                                variant="contained"
                                color="success"
                                onClick={navigateToNextModule}
                                sx={{
                                  bgcolor: '#2ea44f',
                                  '&:hover': {
                                    bgcolor: '#2c974b',
                                  },
                                }}
                              >
                                Complete Module & Continue
                              </Button>
                            )}
                          </>
                        )}
                      </Box>
                    </Box>

                    {/* Hints section moved here for regular exercises */}
                    <Box sx={{ mt: 2, mb: 2 }}>
                      {module.tasks[activeStep - 1]?.hints && 
                      Array.isArray(module.tasks[activeStep - 1].hints) && 
                      module.tasks[activeStep - 1].hints.map((hint, index) => (
                        <Box key={index} sx={{ mb: 1 }}>
                          <Button
                            startIcon={<HintIcon />}
                            onClick={() => toggleHint(index)}
                            variant="outlined"
                            size="small"
                            color="secondary"
                          >
                            Hint {index + 1}
                          </Button>
                          {showHints[index] && (
                            <Typography variant="body2" sx={{ 
                              ml: 4, 
                              mt: 1, 
                              p: 1.5, 
                              borderLeft: '3px solid #f05133',
                              bgcolor: 'rgba(240, 81, 51, 0.1)',
                              borderRadius: '0 4px 4px 0'
                            }}>
                              {hint}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Box>

                    {feedback && (
                      <Alert
                        severity={feedback.type}
                        sx={{ mt: 2 }}
                        action={
                          feedback.type === 'success' && <CheckIcon color="success" />
                        }
                      >
                        {feedback.message}
                      </Alert>
                    )}

                    {feedback?.type === 'success' && (
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="outlined"
                          onClick={navigateToHome}
                          sx={{
                            borderColor: '#30363d',
                            color: '#c9d1d9',
                            '&:hover': {
                              borderColor: '#8b949e',
                              bgcolor: 'rgba(110, 118, 129, 0.1)',
                            },
                          }}
                        >
                          Back to Home
                        </Button>
                      </Box>
                    )}
                  </>
                )}
              </>
            ) : (
              <Typography>Exercise not found</Typography>
            )}
          </Box>
        )}
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
        <Button onClick={handleBack} startIcon={<ArrowBackIcon />}>
          {activeStep === 0 ? 'Back to Modules' : 'Previous'}
        </Button>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography 
            variant="subtitle1"
            data-testid="module-progress-text"
          >
            {getProgressText()}
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={getModuleProgress()} 
            sx={{ mt: 1, width: '200px' }}
          />
        </Box>
        {activeStep === 0 && (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={activeStep === module.tasks.length}
          >
            Start Exercises
          </Button>
        )}
      </Box>
    </Box>
  );
};
export default ExerciseViewer;