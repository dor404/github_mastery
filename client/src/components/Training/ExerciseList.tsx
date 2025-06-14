import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  ButtonGroup,
  useMediaQuery,
  useTheme,
  Tooltip,
  Fade
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Exercise, ExerciseProgress } from '../../types/training';
import progressService from '../../services/progressService';
import { trainingExercises } from '../../data/trainingExercises';
import exerciseService from '../../services/exerciseService';
import DifficultyStars from '../Common/DifficultyStars';

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner':
      return 'success';
    case 'elementary':
      return 'info';
    case 'intermediate':
      return 'warning';
    case 'advanced':
      return 'error';
    case 'expert':
      return 'secondary';
    default:
      return 'default';
  }
};

const ExerciseList: React.FC = () => {
  const navigate = useNavigate();
  const [exerciseProgress, setExerciseProgress] = useState<Record<string, ExerciseProgress>>({});
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch progress data function
  const fetchData = async (forceRefresh = false) => {
    try {
      // Only show loading indicator on first load
      setLoading(prevLoading => {
        return prevLoading && Object.keys(exerciseProgress).length === 0;
      });
      
      setError(null);
      
      // Get all exercises from both sources
      let combinedExercises: Exercise[] = [];
      
      // First get static exercises
      combinedExercises = [...trainingExercises];
      
      // Then try to get database exercises and merge them
      try {
        const apiExercises = await exerciseService.getAllExercises();
        
        // Create a map to remove duplicates (preferring API versions)
        const exerciseMap = new Map<string, Exercise>();
        
        // Add static exercises first
        combinedExercises.forEach(ex => {
          exerciseMap.set(ex.id, ex);
        });
        
        // Then add/override with database exercises
        apiExercises.forEach(ex => {
          exerciseMap.set(ex.id, ex);
        });
        
        // Convert back to array
        combinedExercises = Array.from(exerciseMap.values());
      } catch (apiError) {
        console.error('Error fetching exercises from API:', apiError);
        // Continue with just static exercises
      }
      
      // Sort exercises by difficulty level
      combinedExercises.sort((a, b) => {
        const difficultyOrder = { 
          beginner: 1, 
          elementary: 2, 
          intermediate: 3, 
          advanced: 4, 
          expert: 5 
        };
        return (difficultyOrder[a.difficulty] || 99) - (difficultyOrder[b.difficulty] || 99);
      });
      
      setExercises(combinedExercises);
      
      // Only set loading to false if we're done fetching the initial exercises 
      setLoading(false);
      
      // Fetch progress data separately to avoid blocking UI
      try {
        // Check for token before attempting to fetch
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No authentication token available, using empty progress data');
          setExerciseProgress({});
          return;
        }
        
        // If force refresh, invalidate caches first
        if (forceRefresh) {
          try {
            progressService.invalidateAllCaches();
          } catch (e) {
            console.warn('Cache invalidation failed:', e);
          }
        }
        
        // Fetch all progress data
        let progressData;
        try {
          progressData = await progressService.getAllProgress();
        } catch (initialError: any) {
          // Check if this is an authentication error
          if (initialError.response?.status === 401) {
            console.warn('Authentication error in progress fetch, using empty data');
            setExerciseProgress({});
            return;
          }
          
          console.error('Error with initial progress fetch, retrying:', initialError);
          // Add a short delay before retry
          await new Promise(resolve => setTimeout(resolve, 500));
          // Retry once more
          progressData = await progressService.getAllProgress();
        }
        
        // Convert array to record indexed by exerciseId for easy lookup
        const progressMap: Record<string, ExerciseProgress> = {};
        
        if (progressData && progressData.length > 0) {
          // Process all progress records
          const processPromises = progressData.map(async (progress) => {
            if (!progress) return; // Skip null/undefined entries
            
            // Ensure we have the exerciseId
            if (!progress.exerciseId) {
              console.warn('Progress record missing exerciseId:', progress);
              return;
            }
            
            // Ensure tasks array exists
            if (!progress.tasks) progress.tasks = [];
            
            // Ensure completed exercises with 100% progress
            if (progress.completed && progress.progress !== 100) {
              progress.progress = 100;
            }
            
            // Fix completion status for exercises with high progress
            if (progress.progress >= 95 && !progress.completed) {
              console.log(`Fixing completion status for ${progress.exerciseId}`);
              try {
                await progressService.updateModuleProgress(progress.exerciseId, {
                  completed: true,
                  progress: 100
                });
                progress.completed = true;
                progress.progress = 100;
              } catch (e) {
                console.error('Error fixing completion status:', e);
              }
            }
            
            // Recalculate task progress based on completed steps for more accuracy
            if (progress.tasks.length > 0) {
              const totalTasks = progress.tasks.length;
              const completedTasks = progress.tasks.filter(task => task.completed).length;
              
              if (completedTasks > 0) {
                const calculatedProgress = Math.round((completedTasks / totalTasks) * 100);
                
                // If calculated progress is higher or progress is 0, use the calculated value
                if (calculatedProgress > progress.progress || progress.progress === 0) {
                  progress.progress = calculatedProgress;
                }
                
                // If all tasks are complete, mark as completed
                if (completedTasks === totalTasks) {
                  progress.completed = true;
                  progress.progress = 100;
                }
              }
              
              // Check for any progress in steps
              if (completedTasks === 0) {
                let hasStepProgress = false;
                progress.tasks.forEach(task => {
                  if (task.completedSteps && task.completedSteps.length > 0) {
                    hasStepProgress = true;
                  }
                });
                
                // If there's any step progress, ensure at least 1%
                if (hasStepProgress && progress.progress === 0) {
                  progress.progress = 1;
                }
              }
            }
            
            // Check if completion needs verification
            if (forceRefresh && (progress.progress > 90 || progress.completed)) {
              try {
                console.log(`Verifying completion status for ${progress.exerciseId}`);
                const freshData = await progressService.getModuleProgress(progress.exerciseId);
                
                // Update with the latest data
                if (freshData) {
                  if (freshData.completed || freshData.progress >= 100) {
                    // Make sure it's properly completed
                    progress.completed = true;
                    progress.progress = 100;
                  } else if (progress.completed) {
                    // The local data says it's completed but server doesn't, fix server
                    await progressService.updateModuleProgress(progress.exerciseId, {
                      completed: true,
                      progress: 100
                    });
                  }
                }
              } catch (e) {
                console.error('Error verifying completion:', e);
              }
            }
            
            // Store in our map
            progressMap[progress.exerciseId] = progress;
          });
          
          // Wait for all processing to complete
          await Promise.all(processPromises);
          
          // Update state with processed data
          setExerciseProgress(progressMap);
        } else {
          console.warn('No progress data received from server');
          // Even if the server returned an empty array, ensure we have an empty map
          setExerciseProgress({});
        }
      } catch (progressError) {
        console.error('Error fetching progress data:', progressError);
        // Don't overwrite existing progress data if refresh fails
        // But ensure we have at least an empty map if this is the first load
        if (Object.keys(exerciseProgress).length === 0) {
          setExerciseProgress({});
        }
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
      setError('Failed to load exercises. Please try again.');
      setLoading(false);
    }
  };

  // Fetch data when component mounts or when user navigates back to the list
  useEffect(() => {
    // First invalidate all caches to ensure fresh data
    try {
      progressService.invalidateAllCaches();
    } catch (e) {
      console.warn('Cache invalidation not available:', e);
    }
    
    // Now fetch with a force refresh flag
    fetchData(true);
    
    // Add a delayed second fetch to catch any race conditions
    const delayedFetch = setTimeout(() => {
      fetchData(true);
    }, 1000);
    
    return () => clearTimeout(delayedFetch);
  }, [navigate]);

  // Add focus event listener to refresh data when tab gains focus
  useEffect(() => {
    const handleFocus = () => {
      // Force refresh when returning to the tab
      try {
        progressService.invalidateAllCaches();
      } catch (e) {
        console.warn('Cache invalidation on focus failed:', e);
      }
      fetchData(true);
    };

    // Add periodic refresh to ensure progress is updated
    const refreshInterval = setInterval(() => {
      fetchData(false); // Regular refresh
    }, 10000); // Refresh every 10 seconds

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(refreshInterval);
    };
  }, []);

  // Get progress value for an exercise - with improved accuracy 
  const getExerciseProgressValue = (exerciseId: string): number => {
    const progress = exerciseProgress[exerciseId];
    
    // If there's no progress record, return 0
    if (!progress) {
      return 0;
    }
    
    // Find the current exercise to get the actual task count
    const currentExercise = exercises.find(ex => ex.id === exerciseId);
    if (!currentExercise) {
      return progress.progress || 0;
    }
    
    // Early return if no tasks in exercise
    if (!currentExercise.tasks || currentExercise.tasks.length === 0) {
      return 0;
    }
    
    // Count total steps across all tasks
    let totalSteps = 0;
    let completedSteps = 0;
    
    // Calculate progress based on steps completed
    currentExercise.tasks.forEach(task => {
      if (task.steps && task.steps.length > 0) {
        // Task has steps
        totalSteps += task.steps.length;
        
        // Find corresponding task in progress data
        const taskProgress = progress.tasks?.find(t => t.taskId === task.id);
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
        const taskProgress = progress.tasks?.find(t => t.taskId === task.id);
        if (taskProgress && taskProgress.completed) {
          completedSteps += 1;
        }
      }
    });
    
    // Calculate progress percentage
    if (totalSteps > 0) {
      return Math.round((completedSteps / totalSteps) * 100);
    }
    
    // If no steps, fallback to task-based calculation
    if (progress.tasks) {
      const totalTasks = currentExercise.tasks.length;
      const completedTasks = progress.tasks.filter(task => task.completed).length;
      return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    }
    
    // Fall back to the stored progress value only if we can't calculate
    return progress.progress || 0;
  };

  // Get progress text for an exercise
  const getExerciseProgressText = (exerciseId: string): string => {
    const progressRecord = exerciseProgress[exerciseId];
    const progress = getExerciseProgressValue(exerciseId);
    
    if (!progressRecord) {
      return 'Not started (0%)';
    }
    
    // Find the current exercise to get the actual task count
    const currentExercise = exercises.find(ex => ex.id === exerciseId);
    if (!currentExercise || !currentExercise.tasks) {
      return 'Not started (0%)';
    }
    
    // Count total steps across all tasks
    let totalSteps = 0;
    let completedSteps = 0;
    
    // Calculate steps completed
    currentExercise.tasks.forEach(task => {
      if (task.steps && task.steps.length > 0) {
        // Task has steps
        totalSteps += task.steps.length;
        
        // Find corresponding task in progress data
        const taskProgress = progressRecord.tasks?.find(t => t.taskId === task.id);
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
        const taskProgress = progressRecord.tasks?.find(t => t.taskId === task.id);
        if (taskProgress && taskProgress.completed) {
          completedSteps += 1;
        }
      }
    });
    
    // Only show as completed if all steps are truly completed
    if (totalSteps > 0 && completedSteps === totalSteps) {
      return 'Completed (100%)';
    }
    
    // If there are no steps, fall back to task count
    if (totalSteps === 0) {
      // Calculate completed tasks vs total tasks
      const totalTasks = currentExercise.tasks.length;
      let completedTasks = 0;
      if (progressRecord.tasks) {
        completedTasks = progressRecord.tasks.filter(task => task.completed).length;
      }
      
      // Only show as completed if all tasks are truly completed
      if (completedTasks === totalTasks && totalTasks > 0) {
        return 'Completed (100%)';
      }
      
      return `In progress: ${completedTasks}/${totalTasks} tasks (${progress}%)`;
    }
    
    // Return progress based on steps
    return `In progress: ${completedSteps}/${totalSteps} tasks (${progress}%)`;
  };

  // Get button text based on progress
  const getButtonText = (exerciseId: string): string => {
    const progress = getExerciseProgressValue(exerciseId);
    
    if (progress === 0) {
      return 'Start Exercise';
    } else if (isExerciseFullyCompleted(exerciseId)) {
      return 'Review Exercise';
    } else {
      return 'Continue Exercise';
    }
  };

  // Determine if exercise is locked (prerequisites not completed)
  const isExerciseLocked = (exercise: Exercise): boolean => {
    // Allow all exercises to be started regardless of prerequisites
    return false;
    
    // Original code (commented out):
    /*
    if (!exercise.prerequisites || exercise.prerequisites.length === 0) {
      return false;
    }

    return exercise.prerequisites.some(prereqId => {
      const prereqProgress = exerciseProgress[prereqId];
      return !prereqProgress || !prereqProgress.completed;
    });
    */
  };

  // Determine if exercise is fully completed
  const isExerciseFullyCompleted = (exerciseId: string): boolean => {
    const progress = exerciseProgress[exerciseId];
    if (!progress || !progress.tasks) return false;
    
    // Find the current exercise to get the actual task count
    const currentExercise = exercises.find(ex => ex.id === exerciseId);
    if (!currentExercise || !currentExercise.tasks) return false;
    
    // Count total steps across all tasks
    let totalSteps = 0;
    let completedSteps = 0;
    
    // Calculate steps completed
    currentExercise.tasks.forEach(task => {
      if (task.steps && task.steps.length > 0) {
        // Task has steps
        totalSteps += task.steps.length;
        
        // Find corresponding task in progress data
        const taskProgress = progress.tasks.find(t => t.taskId === task.id);
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
        const taskProgress = progress.tasks.find(t => t.taskId === task.id);
        if (taskProgress && taskProgress.completed) {
          completedSteps += 1;
        }
      }
    });
    
    // Only consider fully completed if all steps are completed
    if (totalSteps > 0) {
      return completedSteps === totalSteps;
    }
    
    // Fallback: if no steps defined, check if all tasks are completed
    const totalTasks = currentExercise.tasks.length;
    const completedTasks = progress.tasks.filter(task => task.completed).length;
    return totalTasks > 0 && completedTasks === totalTasks;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          onClick={(e) => {
            e.preventDefault();
            fetchData(true);
          }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Git Training Exercises
      </Typography>
      {exercises.length === 0 ? (
        <Alert severity="info">
          No exercises available. Please check back later.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {exercises.map((exercise) => (
            <Grid item xs={12} md={6} lg={4} key={exercise.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  position: 'relative',
                  '&:hover': {
                    boxShadow: 6,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s'
                  },
                  // Add a colored border based on progress
                  borderTop: '4px solid',
                  borderColor: () => {
                    const progress = getExerciseProgressValue(exercise.id);
                    if (isExerciseFullyCompleted(exercise.id)) return '#2ea44f'; // Green for complete
                    if (progress > 0) return '#f05133';    // Orange/red for in progress
                    return '#9e9e9e';                      // Gray for not started
                  }
                }}
              >
                {/* Progress indicator chip in top right */}
                {getExerciseProgressValue(exercise.id) > 0 && (
                  <Chip
                    label={isExerciseFullyCompleted(exercise.id) ? "Completed" : "In Progress"}
                    color={isExerciseFullyCompleted(exercise.id) ? "success" : "warning"}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      fontWeight: 'bold',
                      zIndex: 1
                    }}
                  />
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" component="div" gutterBottom>
                    {exercise.title}
                  </Typography>
                  <DifficultyStars difficulty={exercise.difficulty} />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {exercise.description}
                  </Typography>
                  <Typography variant="caption" display="block" gutterBottom>
                    Estimated time: {exercise.estimatedTime}
                  </Typography>
                  {exercise.prerequisites && exercise.prerequisites.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" display="block" gutterBottom>
                        Prerequisites:
                      </Typography>
                      {exercise.prerequisites.map((prereq) => (
                        <Chip
                          key={prereq}
                          label={
                            exercises.find((m) => m.id === prereq)?.title ||
                            prereq
                          }
                          size="small"
                          variant="outlined"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))}
                    </Box>
                  )}
                  
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" fontWeight="bold" color="text.secondary">
                        Progress:
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getExerciseProgressText(exercise.id)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={getExerciseProgressValue(exercise.id)}
                      sx={{ 
                        mb: 1, 
                        height: 8, 
                        borderRadius: 2,
                        backgroundColor: 'rgba(0, 0, 0, 0.05)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 2,
                          backgroundColor: () => {
                            // Check if exercise is fully completed (all tasks done)
                            if (isExerciseFullyCompleted(exercise.id)) {
                              return '#2ea44f'; // Green for complete
                            }
                            
                            // Otherwise use in-progress color even if progress calculation is 100%
                            const progressValue = getExerciseProgressValue(exercise.id);
                            return progressValue > 0 ? '#f05133' : '#9e9e9e';
                          }
                        }
                      }}
                    />
                  </Box>
                </CardContent>
                <Box sx={{ p: 2, pt: 0 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => navigate(`/training/${exercise.id}`)}
                    disabled={isExerciseLocked(exercise)}
                    sx={{
                      bgcolor: () => {
                        if (isExerciseLocked(exercise)) return '#e0e0e0';
                        const progress = getExerciseProgressValue(exercise.id);
                        if (isExerciseFullyCompleted(exercise.id)) return '#2ea44f'; // Green for complete
                        if (progress > 0) return '#f05133';    // Git logo color for in progress
                        return '#1976d2';                     // Default blue for not started
                      },
                      '&:hover': {
                        bgcolor: () => {
                          if (isExerciseLocked(exercise)) return '#e0e0e0';
                          const progress = getExerciseProgressValue(exercise.id);
                          if (isExerciseFullyCompleted(exercise.id)) return '#2c974b'; // Darker green for complete
                          if (progress > 0) return '#d03b1f';    // Darker orange/red for in progress
                          return '#1565c0';                     // Darker blue for not started
                        }
                      }
                    }}
                  >
                    {getButtonText(exercise.id)}
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default ExerciseList; 