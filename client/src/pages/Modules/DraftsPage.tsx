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
  ArrowBack as ArrowBackIcon,
  Drafts as DraftIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import tutorialService from '../../services/tutorialService';
import { Tutorial } from '../../types/tutorial';
import DifficultyStars from '../../components/Common/DifficultyStars';

const DraftsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<Tutorial[]>([]);
  const [filteredDrafts, setFilteredDrafts] = useState<Tutorial[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await tutorialService.getDrafts();
        setDrafts(data);
        setFilteredDrafts(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching drafts:', err);
        setError('Failed to load draft modules. Please try again later.');
        setLoading(false);
      }
    };

    fetchDrafts();
  }, []);

  // Filter drafts based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredDrafts(drafts);
    } else {
      const filtered = drafts.filter(draft => 
        draft.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        draft.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDrafts(filtered);
    }
  }, [searchTerm, drafts]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleEditDraft = (draftId: string, draft: Tutorial) => {
    if (canEditDraft(draft)) {
      navigate(`/modules/edit/${draftId}`);
    }
  };

  const handleBackToMenu = () => {
    navigate('/modules');
  };

  // Check if the current user can edit a specific draft
  const canEditDraft = (draft: Tutorial): boolean => {
    // Admins can edit all drafts
    if (user?.role === 'admin') return true;
    
    // If no draft author or no user, cannot edit
    if (!draft.author || !user) return false;
    
    // Check if user is the author
    const authorId = typeof draft.author === 'object' ? draft.author._id : draft.author;
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

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          Back to Module Menu
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <DraftIcon sx={{ color: '#f05133', fontSize: 32, mr: 1 }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Draft Modules
          </Typography>
        </Box>
      </Box>

      {/* Description */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" color="text.secondary">
          Manage your unpublished module drafts. Continue working on modules before publishing them for students.
        </Typography>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search drafts by title or description..."
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
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              {filteredDrafts.length} {filteredDrafts.length === 1 ? 'draft' : 'drafts'} found
            </Typography>
            {filteredDrafts.length === 0 && !error && (
              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                {drafts.length === 0 ? 'No drafts created yet.' : 'No drafts match your search.'}
              </Typography>
            )}
          </Box>

          {/* Drafts List */}
          <Grid container spacing={3}>
            {filteredDrafts.length > 0 ? (
              filteredDrafts.map((draft) => (
                <Grid item xs={12} md={6} lg={4} key={draft._id}>
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
                      },
                      border: '2px solid #f0f0f0',
                      borderLeftColor: '#f05133',
                      borderLeftWidth: '4px'
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="h5" component="h2" gutterBottom>
                          {draft.title}
                        </Typography>
                        <Chip 
                          label="DRAFT" 
                          size="small" 
                          sx={{ 
                            backgroundColor: '#f05133', 
                            color: 'white',
                            fontWeight: 600
                          }} 
                        />
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <DifficultyStars difficulty={draft.difficulty} size="small" />
                        <Chip 
                          label={draft.difficulty} 
                          size="small" 
                          color={getDifficultyColor(draft.difficulty) as any}
                          sx={{ ml: 1 }}
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {draft.description}
                      </Typography>
                      
                      {/* Tags */}
                      {draft.tags && draft.tags.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          {draft.tags.slice(0, 3).map((tag, index) => (
                            <Chip 
                              key={index} 
                              label={tag} 
                              size="small" 
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                          {draft.tags.length > 3 && (
                            <Chip 
                              label={`+${draft.tags.length - 3} more`} 
                              size="small" 
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          )}
                        </Box>
                      )}
                      
                      {/* Author and dates */}
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          Created by: {typeof draft.author === 'object' ? draft.author.username : 'Unknown'}
                        </Typography>
                        {draft.updatedAt && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <ScheduleIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              Last updated: {formatDate(draft.updatedAt)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                    
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        variant="contained"
                        startIcon={<EditIcon />}
                        fullWidth
                        onClick={() => handleEditDraft(draft._id!, draft)}
                        disabled={!canEditDraft(draft)}
                        sx={{
                          backgroundColor: '#f05133',
                          '&:hover': {
                            backgroundColor: '#d03b1f',
                          }
                        }}
                      >
                        Continue Editing
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))
            ) : !loading && (
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <DraftIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {drafts.length === 0 ? 'No Draft Modules Yet' : 'No Drafts Match Your Search'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {drafts.length === 0 
                      ? 'Start creating a module and save it as a draft to see it here.'
                      : 'Try adjusting your search terms to find the draft you\'re looking for.'
                    }
                  </Typography>
                  {drafts.length === 0 && (
                    <Button
                      variant="contained"
                      onClick={() => navigate('/modules/create')}
                      sx={{
                        backgroundColor: '#f05133',
                        '&:hover': {
                          backgroundColor: '#d03b1f',
                        }
                      }}
                    >
                      Create New Module
                    </Button>
                  )}
                </Box>
              </Grid>
            )}
          </Grid>
        </>
      )}
    </Container>
  );
};

export default DraftsPage; 