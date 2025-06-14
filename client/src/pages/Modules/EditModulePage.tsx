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
  Chip
} from '@mui/material';
import {
  Edit as EditIcon,
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import tutorialService from '../../services/tutorialService';
import { Exercise } from '../../types/training';
import { Tutorial } from '../../types/tutorial';
import DifficultyStars from '../../components/Common/DifficultyStars';

// Extend Exercise type to include tags
interface ModuleWithTags extends Exercise {
  tags?: string[];
}

const EditModulePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [modules, setModules] = useState<any[]>([]);
  const [filteredModules, setFilteredModules] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoading(true);
        setError(null);
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

  const handleEditModule = (moduleId: string, module: any) => {
    if (canEditModule(module)) {
      navigate(`/modules/edit/${moduleId}`);
    }
  };

  const handleBackToMenu = () => {
    navigate('/modules');
  };

  // Check if the current user can edit a specific module
  const canEditModule = (module: any): boolean => {
    // Admins can edit all modules
    if (user?.role === 'admin') return true;
    
    // If no module author or no user, cannot edit
    if (!module.author || !user) return false;
    
    // Check if user is the author
    const authorId = typeof module.author === 'object' ? module.author._id : module.author;
    return authorId === user.id;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'elementary': return 'info';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      case 'expert': return 'secondary';
      default: return 'default';
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
          Edit Modules
        </Typography>
      </Box>

      {/* Permission information */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          You can only edit modules that you have created or if you have admin privileges.
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
                      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                      }
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
                      
                      {/* Editable indicator */}
                      {canEditModule(module) && (
                        <Chip
                          label="You can edit this"
                          color="primary"
                          size="small"
                          variant="outlined"
                          sx={{ mt: 1 }}
                        />
                      )}
                      
                      {module.tags && module.tags.length > 0 && (
                        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {module.tags.map((tag: string, index: number) => (
                            <Chip
                              key={index}
                              label={tag}
                              size="small"
                              variant="outlined"
                              sx={{ borderRadius: '4px' }}
                            />
                          ))}
                        </Box>
                      )}
                    </CardContent>
                    <Divider />
                    <CardActions sx={{ p: 2 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        startIcon={<EditIcon />}
                        onClick={() => handleEditModule(module._id || module.id, module)}
                        disabled={!canEditModule(module)}
                      >
                        {canEditModule(module) ? 'Edit Module' : 'Only Creator Can Edit'}
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
    </Container>
  );
};

export default EditModulePage; 