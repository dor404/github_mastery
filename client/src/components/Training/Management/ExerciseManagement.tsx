import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import exerciseService from '../../../services/exerciseService';
import { Exercise } from '../../../types/training';
import { trainingExercises } from '../../../data/trainingExercises';
import DifficultyStars from '../../../components/Common/DifficultyStars';

// Extended Exercise type with source tracking
interface ExtendedExercise extends Exercise {
  isStatic?: boolean;
  isFromDB?: boolean;
}

const ExerciseManagement: React.FC = () => {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<ExtendedExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<string | null>(null);
  const [staticDataDialogOpen, setStaticDataDialogOpen] = useState<boolean>(false);
  const [selectedExercise, setSelectedExercise] = useState<ExtendedExercise | null>(null);

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      
      // Get static exercises 
      const staticExercises = [...trainingExercises] as ExtendedExercise[];
      
      // Get database exercises
      let dbExercises: ExtendedExercise[] = [];
      try {
        dbExercises = (await exerciseService.getAllExercises()) as ExtendedExercise[];
      } catch (err) {
        console.error('Error fetching database exercises:', err);
        // Continue with just static exercises if API fails
      }
      
      // Create a map of exercise IDs to detect duplicates
      const exerciseMap = new Map<string, ExtendedExercise>();
      
      // Add static exercises first
      staticExercises.forEach(exercise => {
        exerciseMap.set(exercise.id, { ...exercise, isStatic: true });
      });
      
      // Add database exercises, potentially overriding static ones
      dbExercises.forEach(exercise => {
        const existing = exerciseMap.get(exercise.id);
        if (existing) {
          // If we already have this from static data, mark it as both
          exerciseMap.set(exercise.id, { ...exercise, isStatic: true, isFromDB: true });
        } else {
          // Otherwise just mark it as from DB
          exerciseMap.set(exercise.id, { ...exercise, isFromDB: true });
        }
      });
      
      // Convert map to array for display
      setExercises(Array.from(exerciseMap.values()));
      setError(null);
    } catch (err) {
      console.error('Error fetching exercises:', err);
      setError('Failed to load exercises. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExercise = () => {
    navigate('/exercises/create');
  };

  const handleEditExercise = (exerciseId: string) => {
    navigate(`/exercises/edit/${exerciseId}`);
  };

  const handleManageTasks = (exerciseId: string) => {
    navigate(`/exercises/edit/${exerciseId}`, { state: { openExercisesTab: true } });
  };

  const handleDeleteClick = (exerciseId: string) => {
    setExerciseToDelete(exerciseId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (exerciseToDelete) {
      try {
        await exerciseService.deleteExercise(exerciseToDelete);
        
        // Remove from the exercises list
        setExercises(exercises.filter(exercise => exercise.id !== exerciseToDelete));
        
        setDeleteConfirmOpen(false);
        setExerciseToDelete(null);
      } catch (err) {
        console.error('Error deleting exercise:', err);
        setError('Failed to delete exercise. Please try again later.');
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setExerciseToDelete(null);
  };
  
  const handleViewStaticData = (exercise: ExtendedExercise) => {
    setSelectedExercise(exercise);
    setStaticDataDialogOpen(true);
  };

  const getExerciseSource = (exercise: ExtendedExercise) => {
    if (exercise.isStatic && exercise.isFromDB) {
      return "Both";
    } else if (exercise.isStatic) {
      return "Static";
    } else if (exercise.isFromDB) {
      return "Database";
    }
    return "Unknown";
  };
  
  const getSourceColor = (source: string) => {
    switch (source) {
      case "Static":
        return "primary";
      case "Database":
        return "success";
      case "Both":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Exercise Management
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateExercise}
          >
            Create New Exercise
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table aria-label="exercises table">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Difficulty</TableCell>
                <TableCell>Tasks</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {exercises.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body1" sx={{ py: 2 }}>
                      No exercises found. Click 'Create New Exercise' to add one.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                exercises.map((exercise) => (
                  <TableRow key={exercise.id}>
                    <TableCell>{exercise.title}</TableCell>
                    <TableCell>{exercise.description}</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>
                      <DifficultyStars difficulty={exercise.difficulty} size="large" />
                    </TableCell>
                    <TableCell>{exercise.tasks.length}</TableCell>
                    <TableCell>
                      <Chip
                        label={getExerciseSource(exercise)}
                        color={getSourceColor(getExerciseSource(exercise)) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit Exercise">
                        <IconButton onClick={() => handleEditExercise(exercise.id)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Manage Tasks">
                        <IconButton onClick={() => handleManageTasks(exercise.id)}>
                          <AssignmentIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Static Data">
                        <IconButton onClick={() => handleViewStaticData(exercise)}>
                          <CodeIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Exercise">
                        <IconButton color="error" onClick={() => handleDeleteClick(exercise.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this exercise? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Static Data View Dialog */}
      <Dialog
        open={staticDataDialogOpen}
        onClose={() => setStaticDataDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="h6">Static Data for {selectedExercise?.title}</Typography>
            {selectedExercise && (
              <DifficultyStars difficulty={selectedExercise.difficulty} />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 2 }}>
            Copy this data to your trainingExercises.ts file to make it available as static data
          </Typography>
          <Paper 
            sx={{ 
              p: 2, 
              maxHeight: '60vh', 
              overflow: 'auto',
              fontFamily: 'monospace',
              whiteSpace: 'pre',
              backgroundColor: '#f5f5f5'
            }}
          >
            {selectedExercise && JSON.stringify(selectedExercise, null, 2)}
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStaticDataDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExerciseManagement; 