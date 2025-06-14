import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Container,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  SelectChangeEvent,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterAlt as FilterIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CompletedIcon,
  Timer as InProgressIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Tutorial } from '../../types/tutorial';
import tutorialService from '../../services/tutorialService';
import { useAuth } from '../../context/AuthContext';
import DifficultyStars, { difficultyToStars, starsToDifficulty } from '../Common/DifficultyStars';

// Add a new type for tutorial progress
interface TutorialProgress {
  tutorialId: string;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed';
  lastAccessedAt?: Date;
  currentPage?: number;
}

const TutorialList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State management
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [filteredTutorials, setFilteredTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tutorialProgress, setTutorialProgress] = useState<Record<string, TutorialProgress>>({});
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [difficultyStarRating, setDifficultyStarRating] = useState<number>(0);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Get user-specific progress storage key
  const getProgressStorageKey = () => {
    return `tutorialProgress_${user?.id || 'guest'}`;
  };

  // Fetch tutorials
  useEffect(() => {
    const fetchTutorials = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch published tutorials
        const fetchedTutorials = await tutorialService.getAllPublished();
        setTutorials(fetchedTutorials);
        setFilteredTutorials(fetchedTutorials);
        
        // Extract unique tags from tutorials
        const tagsSet = new Set<string>();
        fetchedTutorials.forEach(tutorial => {
          if (tutorial.tags && Array.isArray(tutorial.tags)) {
            tutorial.tags.forEach(tag => tagsSet.add(tag));
          }
        });
        
        // Add essential Git and GitHub related tags
        const gitTags = [
          'Git', 'GitHub', 'Version Control', 'Branching', 'Merging', 
          'Pull Request', 'Commit', 'Clone', 'Repository', 'Workflow',
          'Git Flow', 'Fork', 'Issues', 'Actions', 'Pages'
        ];
        
        gitTags.forEach(tag => tagsSet.add(tag));
        setAvailableTags(Array.from(tagsSet).sort());
        
        // Load user-specific progress from localStorage
        try {
          const storageKey = getProgressStorageKey();
          const savedProgress = localStorage.getItem(storageKey);
          if (savedProgress) {
            setTutorialProgress(JSON.parse(savedProgress));
          }
        } catch (e) {
          console.error('Error loading progress data:', e);
          // If there's an error, just use empty progress
          setTutorialProgress({});
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching tutorials:', err);
        setError('Failed to load tutorials. Please try again later.');
        setLoading(false);
      }
    };

    fetchTutorials();
  }, [user?.id]); // Re-fetch when user changes

  // Apply filters when changed
  useEffect(() => {
    let filtered = [...tutorials];
    
    // Filter by search term
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(tutorial => 
        tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        tutorial.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by difficulty
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(tutorial => tutorial.difficulty === difficultyFilter);
    }
    
    // Filter by tags
    if (tagFilter.length > 0) {
      filtered = filtered.filter(tutorial => 
        tutorial.tags && Array.isArray(tutorial.tags) && 
        tagFilter.some(tag => tutorial.tags.includes(tag))
      );
    }
    
    setFilteredTutorials(filtered);
  }, [searchTerm, difficultyFilter, tagFilter, tutorials]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle difficulty filter change
  const handleDifficultyChange = (e: SelectChangeEvent<string>) => {
    setDifficultyFilter(e.target.value);
  };

  // Handle difficulty star change
  const handleDifficultyStarChange = (value: number) => {
    if (value === difficultyStarRating) {
      // If clicking the already selected star level, reset to "all"
      setDifficultyFilter('all');
      setDifficultyStarRating(0);
    } else {
      // Otherwise set the filter to the corresponding difficulty level
      const difficultyLevel = starsToDifficulty(value);
      setDifficultyFilter(difficultyLevel);
      setDifficultyStarRating(value);
    }
  };

  // Handle tag filter change
  const handleTagChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setTagFilter(typeof value === 'string' ? [value] : value);
  };

  // Handle tutorial selection
  const handleViewTutorial = (tutorialId: string) => {
    // Mark as in progress if not already completed
    if (tutorialProgress[tutorialId]?.status !== 'completed') {
      const updatedProgress: Record<string, TutorialProgress> = {
        ...tutorialProgress,
        [tutorialId]: {
          tutorialId,
          progress: 50,
          status: 'in_progress',
          lastAccessedAt: new Date(),
          // Preserve the current page if it exists
          currentPage: tutorialProgress[tutorialId]?.currentPage || 0
        }
      };
      
      setTutorialProgress(updatedProgress);
      
      // Save to localStorage with user-specific key
      try {
        const storageKey = getProgressStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(updatedProgress));
      } catch (e) {
        console.error('Error saving progress data:', e);
      }
    }
    
    navigate(`/tutorials/view/${tutorialId}`);
  };

  // Get difficulty color helper
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

  // Get tutorial status chip
  const getTutorialStatusChip = (tutorialId: string) => {
    const status = tutorialProgress[tutorialId]?.status || 'not_started';
    
    switch (status) {
      case 'completed':
        return <Chip icon={<CompletedIcon />} label="Completed" color="success" size="small" />;
      case 'in_progress':
        return <Chip icon={<InProgressIcon />} label="In Progress" color="primary" size="small" />;
      default:
        return <Chip label="Not Started" variant="outlined" size="small" />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box textAlign="center" mb={6}>
        <Typography variant="h3" component="h1" sx={{ color: '#f05133', fontWeight: 700, mb: 2 }}>
          Learning Modules
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '800px', mx: 'auto', mb: 3 }}>
          Browse through our collection of tutorials to learn Git and version control
        </Typography>
      </Box>

      {/* Filter section */}
      <Card sx={{ mb: 4, borderRadius: '8px' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <FilterIcon sx={{ mr: 1 }} />
            Filter Tutorials
          </Typography>
          
          <Grid container spacing={3}>
            {/* Search field */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search by title or description..."
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            {/* Difficulty filter */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <Typography variant="subtitle1" gutterBottom>
                  Difficulty Level
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <DifficultyStars 
                      difficulty={difficultyStarRating} 
                      readOnly={false}
                      onChange={handleDifficultyStarChange}
                      size="large"
                    />
                    <Typography variant="body2" color="text.secondary">
                      {difficultyFilter === 'all' 
                        ? 'All Levels' 
                        : difficultyFilter.charAt(0).toUpperCase() + difficultyFilter.slice(1)}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Click stars to filter by difficulty or click again to show all
                  </Typography>
                </Box>
              </FormControl>
            </Grid>
            
            {/* Tag filter */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="tag-filter-label">Filter by Tags</InputLabel>
                <Select
                  labelId="tag-filter-label"
                  id="tag-filter"
                  multiple
                  value={tagFilter}
                  label="Filter by Tags"
                  onChange={handleTagChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 250
                      }
                    }
                  }}
                >
                  {availableTags.map((tag) => (
                    <MenuItem key={tag} value={tag}>
                      {tag}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Loading state */}
      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {/* Error state */}
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {/* Empty state */}
      {!loading && filteredTutorials.length === 0 && (
        <Alert severity="info" sx={{ mb: 4 }}>
          No tutorials found. Try adjusting your filters or check back later for new content.
        </Alert>
      )}

      {/* Tutorial grid */}
      <Grid container spacing={4}>
        {filteredTutorials.map((tutorial) => (
          <Grid item xs={12} md={6} lg={4} key={tutorial._id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                }
              }}
              onClick={() => handleViewTutorial(tutorial._id as string)}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h5" component="h2" gutterBottom>
                    {tutorial.title}
                  </Typography>
                  {getTutorialStatusChip(tutorial._id as string)}
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <DifficultyStars difficulty={tutorial.difficulty} size="small" />
                </Box>
                
                <Typography variant="body1" paragraph>
                  {tutorial.description}
                </Typography>
                
                {tutorial.tags && tutorial.tags.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                    {tutorial.tags.map((tag, index) => (
                      <Chip key={index} label={tag} size="small" variant="outlined" />
                    ))}
                  </Box>
                )}
              </CardContent>
              
              <Divider />
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default TutorialList; 