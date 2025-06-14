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
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import tutorialService from '../../services/tutorialService';
import { Exercise } from '../../types/training';
import { Tutorial } from '../../types/tutorial';
import DifficultyStars from '../../components/Common/DifficultyStars';

// Extend Exercise type to include tags if needed
interface ModuleWithTags extends Exercise {
  tags?: string[];
}

const DeleteModulePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [modules, setModules] = useState<any[]>([]);
  const [filteredModules, setFilteredModules] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoading(true);
        setError(null);
        // Use tutorialService instead of exerciseService
        const data = await tutorialService.getAllPublished();
        setModules(data);
        setFilteredModules(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching modules:', err);
        setError('Failed to load modules. Please try again later.');
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  // Filter modules based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredModules(modules);
    } else {
      const filtered = modules.filter(module => 
        module.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        module.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredModules(filtered);
    }
  }, [searchTerm, modules]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleBackToMenu = () => {
    navigate('/modules');
  };

  const handleOpenDeleteDialog = (module: any) => {
    setModuleToDelete(module);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setModuleToDelete(null);
  };

  const handleDeleteModule = async () => {
    if (!moduleToDelete) return;
    
    try {
      setDeleteLoading(true);
      setError(null); // Clear any previous errors
      
      // Use tutorialService's delete method
      await tutorialService.delete(moduleToDelete._id || moduleToDelete.id);
      
      // Remove deleted module from state
      const updatedModules = modules.filter(m => (m._id || m.id) !== (moduleToDelete._id || moduleToDelete.id));
      setModules(updatedModules);
      setFilteredModules(updatedModules);
      
      setSuccessMessage(`Module "${moduleToDelete.title}" has been successfully deleted.`);
      setDeleteLoading(false);
      handleCloseDeleteDialog();
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err: any) {
      console.error('Error deleting module:', err);
      
      // Set more specific error message based on the error response
      if (err.response) {
        const status = err.response.status;
        if (status === 403) {
          setError('You are not authorized to delete this module. Only lecturers and admins can delete modules.');
        } else if (status === 404) {
          setError('Module not found. It may have been already deleted.');
        } else {
          setError(`Failed to delete module: ${err.response.data?.message || 'Server error'}`);
        }
      } else if (err.request) {
        setError('Failed to delete module: No response from server. Please check your internet connection.');
      } else {
        setError(`Failed to delete module: ${err.message || 'Unknown error'}`);
      }
      
      setDeleteLoading(false);
      handleCloseDeleteDialog();
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'warning';
      case 'advanced':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToMenu}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Delete Modules
        </Typography>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search modules by title or description..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
            }
          }}
        />
      </Box>

      {/* Success Message */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 4 }}>
          {successMessage}
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {/* Loading Indicator */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Results Count */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" color="text.secondary">
              {filteredModules.length} {filteredModules.length === 1 ? 'module' : 'modules'} found
            </Typography>
          </Box>

          {/* Modules List */}
          <Grid container spacing={3}>
            {filteredModules.length > 0 ? (
              filteredModules.map((module) => (
                <Grid item xs={12} md={6} key={module._id || module.id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="h5" component="h2" gutterBottom>
                          {module.title}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <DifficultyStars difficulty={module.difficulty} size="small" />
                      </Box>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {module.description}
                      </Typography>
                      
                      {/* Author information */}
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
                        Created by: {typeof module.author === 'object' ? module.author.username : 'Unknown'}
                      </Typography>
                    </CardContent>
                    <Divider />
                    <CardActions sx={{ p: 2 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleOpenDeleteDialog(module)}
                      >
                        Delete Module
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" color="text.secondary">
                    No modules found matching "{searchTerm}"
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="error" />
          Confirm Module Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete the module "{moduleToDelete?.title}"? This action cannot be undone and will permanently remove the module and all associated data.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteModule}
            color="error"
            variant="contained"
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
          >
            {deleteLoading ? 'Deleting...' : 'Delete Module'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DeleteModulePage; 