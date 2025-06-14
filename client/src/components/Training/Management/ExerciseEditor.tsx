import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Divider,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Alert,
  Grid,
  Chip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import exerciseService from '../../../services/exerciseService';
import { Exercise, Task, TaskStep } from '../../../types/training';
import DifficultyStars, { starsToDifficulty, difficultyToStars } from '../../../components/Common/DifficultyStars';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`editor-tabpanel-${index}`}
      aria-labelledby={`editor-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `editor-tab-${index}`,
    'aria-controls': `editor-tabpanel-${index}`,
  };
};

interface TaskEditorProps {
  isNewExercise?: boolean;
  isTaskMode?: boolean;
  isNewTask?: boolean;
}

const TaskEditor: React.FC<TaskEditorProps> = ({
  isNewExercise = false,
  isTaskMode = false,
  isNewTask = false,
}) => {
  const { exerciseId, taskId } = useParams<{ exerciseId: string; taskId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const openExercisesTab = location.state?.openExercisesTab || false;

  // General state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(openExercisesTab ? 1 : 0);

  // Exercise state
  const [exercise, setExercise] = useState<Exercise>({
    id: '',
    title: '',
    description: '',
    content: '',
    tasks: [],
    difficulty: 'beginner',
    estimatedTime: '30 minutes',
    prerequisites: [],
  });

  // Task state (for task editing mode)
  const [task, setTask] = useState<Task>({
    id: '',
    question: '',
    description: '',
    hints: [''],
    solution: '',
    isStepByStep: false,
    steps: [],
  });

  // Dialogs
  const [deleteTaskDialog, setDeleteTaskDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (isTaskMode && exerciseId) {
          // Fetch the exercise
          const exerciseData = await exerciseService.getExercise(exerciseId);
          setExercise(exerciseData);
          
          // If editing an existing task, find it in the exercise
          if (!isNewTask && taskId) {
            const foundTask = exerciseData.tasks.find(ex => ex.id === taskId);
            if (foundTask) {
              setTask(foundTask);
            } else {
              setError('Task not found');
              navigate(`/exercises/edit/${exerciseId}`);
            }
          }
        } else if (!isNewExercise && exerciseId) {
          // Fetch the exercise for editing
          const exerciseData = await exerciseService.getExercise(exerciseId);
          setExercise(exerciseData);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [exerciseId, taskId, isNewExercise, isTaskMode, isNewTask, navigate]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Exercise functions
  const handleExerciseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setExercise({
      ...exercise,
      [name]: value,
    });
  };

  const handleDifficultyChange = (value: number) => {
    setExercise({
      ...exercise,
      difficulty: starsToDifficulty(value)
    });
  };

  const saveExercise = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Generate an ID from the title if this is a new exercise and no ID exists
      if (isNewExercise && !exercise.id) {
        const generatedId = exercise.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        exercise.id = generatedId;
      }
      
      let savedExercise: Exercise;
      if (isNewExercise) {
        savedExercise = await exerciseService.createExercise(exercise);
        setSuccess('Exercise created successfully!');
      } else {
        savedExercise = await exerciseService.updateExercise(exercise.id, exercise);
        setSuccess('Exercise updated successfully!');
      }
      
      // Log the exercise data for copying to the static file
      console.log('Exercise data for static file:');
      console.log(JSON.stringify(savedExercise, null, 2));
      
      // Display a dialog with static data information
      setSuccess(`Exercise ${isNewExercise ? 'created' : 'updated'} successfully! Check the console (F12) for data to copy to your static file.`);
      
      setExercise(savedExercise);
      
      // Reset the form state
      setError(null);
      
      // Redirect if this was a new exercise
      if (isNewExercise) {
        setTimeout(() => {
          navigate(`/exercises/edit/${savedExercise.id}`);
        }, 2500);
      }
    } catch (err: any) {
      console.error('Error saving exercise:', err);
      setError(err.response?.data?.message || 'Failed to save exercise. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Task functions
  const handleTaskChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTask({
      ...task,
      [name]: value,
    });
  };

  const handleHintChange = (index: number, value: string) => {
    const newHints = [...task.hints];
    newHints[index] = value;
    setTask({
      ...task,
      hints: newHints,
    });
  };

  const addHint = () => {
    setTask({
      ...task,
      hints: [...task.hints, ''],
    });
  };

  const removeHint = (index: number) => {
    setTask({
      ...task,
      hints: task.hints.filter((_, i) => i !== index),
    });
  };

  const handleStepByStepToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isStepByStep = e.target.checked;
    setTask({
      ...task,
      isStepByStep,
      steps: isStepByStep && (!task.steps || task.steps.length === 0) 
        ? [{ instruction: '', solution: '', validationCommand: '' }] 
        : task.steps,
    });
  };

  const handleStepChange = (index: number, field: keyof TaskStep, value: string) => {
    if (!task.steps) return;
    
    const newSteps = [...task.steps];
    newSteps[index] = {
      ...newSteps[index],
      [field]: value,
    };
    
    setTask({
      ...task,
      steps: newSteps,
    });
  };

  const addStep = () => {
    setTask({
      ...task,
      steps: [
        ...(task.steps || []),
        { instruction: '', solution: '', validationCommand: '' },
      ],
    });
  };

  const removeStep = (index: number) => {
    if (!task.steps) return;
    
    setTask({
      ...task,
      steps: task.steps.filter((_, i) => i !== index),
    });
  };

  const saveTask = async () => {
    try {
      setSaving(true);
      setError(null);
      
      if (!exerciseId) {
        setError('Exercise ID is required');
        setSaving(false);
        return;
      }
      
      // Show detailed debug information about the task data
      console.log('Debug - Task data about to be sent:', JSON.stringify(task, null, 2));
      console.log('Debug - Exercise ID:', exerciseId);
      
      // Validate task has all required fields
      if (!task.question || task.question.trim() === '') {
        setError('Question is required');
        setSaving(false);
        return;
      }
      
      if (!task.description || task.description.trim() === '') {
        setError('Description is required');
        setSaving(false);
        return;
      }
      
      if (!task.solution || task.solution.trim() === '') {
        setError('Solution is required');
        setSaving(false);
        return;
      }
      
      if (!task.hints || !Array.isArray(task.hints) || task.hints.length === 0) {
        // Ensure at least one hint
        task.hints = [''];
      }
      
      // If step-by-step is enabled, validate steps
      if (task.isStepByStep && task.steps) {
        // Check if any step is missing required fields
        const invalidStepIndex = task.steps.findIndex(
          step => !step.instruction || !step.solution
        );
        
        if (invalidStepIndex >= 0) {
          setError(`Step ${invalidStepIndex + 1} is missing required fields (instruction or solution)`);
          setSaving(false);
          return;
        }
      }
      
      // Create a clean copy of the task data to avoid any unexpected properties
      const taskDataToSend = {
        question: task.question,
        description: task.description,
        solution: task.solution,
        hints: task.hints,
        isStepByStep: task.isStepByStep
      } as Partial<Task>;
      
      // Only include steps if it's a step-by-step task
      if (task.isStepByStep && task.steps && task.steps.length > 0) {
        // Clean steps data
        taskDataToSend.steps = task.steps.map(step => ({
          instruction: step.instruction,
          solution: step.solution,
          validationCommand: step.validationCommand || ''
        }));
      }
      
      if (task.validationCommand) {
        taskDataToSend.validationCommand = task.validationCommand;
      }
      
      console.log('Debug - Cleaned task data to send:', JSON.stringify(taskDataToSend, null, 2));
      
      let savedTask: Task | undefined;
      try {
        if (isNewTask) {
          // Create new task with cleaned data
          savedTask = await exerciseService.addTask(exerciseId, taskDataToSend);
          setSuccess('Task created successfully!');
        } else if (taskId) {
          // Update existing task
          savedTask = await exerciseService.updateTask(exerciseId, taskId, taskDataToSend);
          setSuccess('Task updated successfully!');
        }
      } catch (apiError: any) {
        console.error('API Error details:', {
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          data: apiError.response?.data,
          url: apiError.config?.url,
          method: apiError.config?.method,
          headers: apiError.config?.headers,
          payload: apiError.config?.data
        });
        throw apiError; // Re-throw to be caught by the outer catch
      }
      
      // Add the task to the exercise if it's a new task
      if (savedTask && isNewTask) {
        setExercise({
          ...exercise,
          tasks: [...exercise.tasks, savedTask]
        });
      }
      
      // Log the updated exercise for copying to the static file
      const updatedExercise = await exerciseService.getExercise(exerciseId);
      console.log('Updated exercise data for static file:');
      console.log(JSON.stringify(updatedExercise, null, 2));
      
      // Display a dialog with static data information
      setSuccess(`Task ${isNewTask ? 'created' : 'updated'} successfully! Check the console (F12) for data to copy to your static file.`);
      
      // Navigate back to the exercise editor after a successful save
      setTimeout(() => {
        if (exerciseId) {
          navigate(`/exercises/edit/${exerciseId}`, { state: { openExercisesTab: true } });
        }
      }, 2500);
    } catch (err: any) {
      console.error('Error saving task:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to save task. Please try again.';
      setError(`Error: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  // Task List Management
  const handleAddTask = () => {
    navigate(`/exercises/${exerciseId}/tasks/create`);
  };

  const handleEditTask = (taskId: string) => {
    navigate(`/exercises/${exerciseId}/tasks/edit/${taskId}`);
  };

  const handleDeleteTaskClick = (taskId: string) => {
    setTaskToDelete(taskId);
    setDeleteTaskDialog(true);
  };

  const handleDeleteTaskConfirm = async () => {
    if (!exerciseId || !taskToDelete) return;
    
    try {
      await exerciseService.deleteTask(exerciseId, taskToDelete);
      
      // Update the exercise with the task removed
      setExercise({
        ...exercise,
        tasks: exercise.tasks.filter(ex => ex.id !== taskToDelete),
      });
      
      setDeleteTaskDialog(false);
      setTaskToDelete(null);
      setSuccess('Task deleted successfully!');
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task. Please try again.');
    }
  };

  const handleBackClick = () => {
    if (isTaskMode) {
      navigate(`/exercises/edit/${exerciseId}`, { state: { openExercisesTab: true } });
    } else {
      navigate('/exercises/manage');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Task editing form
  if (isTaskMode) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBackClick}
            sx={{ mr: 2 }}
          >
            Back to Exercise
          </Button>
          <Typography variant="h4" component="h1">
            {isNewTask ? 'Create Task' : 'Edit Task'}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Task Details
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Question"
                name="question"
                value={task.question}
                onChange={handleTaskChange}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={task.description}
                onChange={handleTaskChange}
                required
                multiline
                rows={3}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Solution"
                name="solution"
                value={task.solution}
                onChange={handleTaskChange}
                required
                multiline
                rows={2}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Validation Command (optional)"
                name="validationCommand"
                value={task.validationCommand || ''}
                onChange={handleTaskChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Hints
              </Typography>
              
              {task.hints.map((hint, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TextField
                    fullWidth
                    label={`Hint ${index + 1}`}
                    value={hint}
                    onChange={(e) => handleHintChange(index, e.target.value)}
                    multiline
                  />
                  <IconButton
                    color="error"
                    onClick={() => removeHint(index)}
                    disabled={task.hints.length <= 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              
              <Button
                startIcon={<AddIcon />}
                onClick={addHint}
                variant="outlined"
                size="small"
                sx={{ mt: 1 }}
              >
                Add Hint
              </Button>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={task.isStepByStep || false}
                    onChange={handleStepByStepToggle}
                  />
                }
                label="Step-by-Step Task"
              />
            </Grid>
          </Grid>
        </Paper>

        {task.isStepByStep && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Task Steps
            </Typography>
            
            {(task.steps || []).map((step, index) => (
              <Box key={index} sx={{ mb: 4, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Step {index + 1}
                  <IconButton
                    color="error"
                    onClick={() => removeStep(index)}
                    disabled={(task.steps || []).length <= 1}
                    size="small"
                    sx={{ ml: 1 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Instruction"
                      value={step.instruction}
                      onChange={(e) => handleStepChange(index, 'instruction', e.target.value)}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Solution"
                      value={step.solution}
                      onChange={(e) => handleStepChange(index, 'solution', e.target.value)}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Validation Command (optional)"
                      value={step.validationCommand || ''}
                      onChange={(e) => handleStepChange(index, 'validationCommand', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Box>
            ))}
            
            <Button
              startIcon={<AddIcon />}
              onClick={addStep}
              variant="outlined"
              sx={{ mt: 2 }}
            >
              Add Step
            </Button>
          </Paper>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={handleBackClick}
            sx={{ mr: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={saveTask}
            disabled={saving}
          >
            {saving ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                Saving...
              </>
            ) : (
              'Save Task'
            )}
          </Button>
        </Box>
      </Box>
    );
  }

  // Exercise editing form
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBackClick}
          sx={{ mr: 2 }}
        >
          Back to List
        </Button>
        <Typography variant="h4" component="h1">
          {isNewExercise ? 'Create Exercise' : 'Edit Exercise'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="exercise editor tabs">
            <Tab label="Exercise Details" {...a11yProps(0)} />
            {!isNewExercise && <Tab label="Tasks" {...a11yProps(1)} />}
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Exercise Title"
                name="title"
                value={exercise.title}
                onChange={handleExerciseChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Estimated Time"
                name="estimatedTime"
                value={exercise.estimatedTime}
                onChange={handleExerciseChange}
                required
                placeholder="e.g. 30 minutes"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Exercise Description"
                name="description"
                value={exercise.description}
                onChange={handleExerciseChange}
                required
                multiline
                rows={2}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={difficultyToStars(exercise.difficulty)}
                  onChange={(e) => handleDifficultyChange(e.target.value as unknown as number)}
                  label="Difficulty"
                >
                  <MenuItem value={1}>Beginner</MenuItem>
                  <MenuItem value={2}>Elementary</MenuItem>
                  <MenuItem value={3}>Intermediate</MenuItem>
                  <MenuItem value={4}>Advanced</MenuItem>
                  <MenuItem value={5}>Expert</MenuItem>
                </Select>
              </FormControl>
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ mr: 1 }}>Preview:</Typography>
                <DifficultyStars difficulty={exercise.difficulty} />
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Exercise Content (Markdown supported)"
                name="content"
                value={exercise.content}
                onChange={handleExerciseChange}
                required
                multiline
                rows={10}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={handleBackClick}
              sx={{ mr: 2 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={saveExercise}
              disabled={saving}
            >
              {saving ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  Saving...
                </>
              ) : (
                isNewExercise ? 'Create Exercise' : 'Update Exercise'
              )}
            </Button>
          </Box>
        </TabPanel>

        {!isNewExercise && (
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Tasks ({exercise.tasks.length})
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddTask}
              >
                Add Task
              </Button>
            </Box>

            {exercise.tasks.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body1" color="textSecondary">
                  No tasks added yet. Click the button above to add your first task.
                </Typography>
              </Box>
            ) : (
              <List>
                {exercise.tasks.map((ex) => (
                  <React.Fragment key={ex.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={ex.question}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="textPrimary">
                              {ex.description.substring(0, 100)}
                              {ex.description.length > 100 ? '...' : ''}
                            </Typography>
                            <br />
                            {ex.isStepByStep && (
                              <Chip 
                                label={`${ex.steps?.length || 0} steps`} 
                                size="small" 
                                color="primary" 
                                sx={{ mt: 1 }} 
                              />
                            )}
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Edit Task">
                          <IconButton edge="end" onClick={() => handleEditTask(ex.id)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Task">
                          <IconButton edge="end" color="error" onClick={() => handleDeleteTaskClick(ex.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            )}
          </TabPanel>
        )}
      </Paper>

      {/* Delete Task Confirmation Dialog */}
      <Dialog
        open={deleteTaskDialog}
        onClose={() => setDeleteTaskDialog(false)}
        aria-labelledby="delete-task-dialog-title"
      >
        <DialogTitle id="delete-task-dialog-title">Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this task? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTaskDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteTaskConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaskEditor; 