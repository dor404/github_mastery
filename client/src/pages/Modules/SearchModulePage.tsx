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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Paper,
  Backdrop
} from '@mui/material';
import {
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  FilterAlt as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import tutorialService from '../../services/tutorialService';
import exerciseService from '../../services/exerciseService';
import { Exercise } from '../../types/training';
import { Tutorial } from '../../types/tutorial';
import DifficultyStars from '../../components/Common/DifficultyStars';

// Extend Exercise type to include tags
interface ModuleWithTags extends Exercise {
  tags?: string[];
}

const SearchModulePage: React.FC = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState<any[]>([]);
  const [filteredModules, setFilteredModules] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(['all']); // Default to 'all'
  const [tagCountMap, setTagCountMap] = useState<Record<string, number>>({});
  const [isSearching, setIsSearching] = useState(false);

  // Function to load all modules and extract available tags
  const loadAllModules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let data = await tutorialService.getAllPublished();
      
      // If no data is returned, add some test modules with tags for development/testing
      if (!data || data.length === 0) {
        console.log('No modules found, adding test data for development');
        
        // Cast the test data to any to avoid TypeScript errors
        data = [
          {
            _id: 'test1',
            title: 'JavaScript Basics',
            description: 'Learn the fundamentals of JavaScript',
            difficulty: 'beginner',
            tags: ['JavaScript', 'Web Development', 'Programming'],
            published: true,
            author: 'testuser' // Using string ID instead of object to avoid type issues
          },
          {
            _id: 'test2',
            title: 'Advanced CSS Layouts',
            description: 'Master CSS Grid and Flexbox',
            difficulty: 'intermediate',
            tags: ['CSS', 'Web Development', 'Layout'],
            published: true,
            author: 'testuser'
          },
          {
            _id: 'test3',
            title: 'React Hooks',
            description: 'Understanding React functional components and hooks',
            difficulty: 'intermediate',
            tags: ['JavaScript', 'React', 'Frontend'],
            published: true,
            author: 'testuser'
          },
          {
            _id: 'test4',
            title: 'Data Structures in Python',
            description: 'Learn common data structures using Python',
            difficulty: 'advanced',
            tags: ['Python', 'Data Structures', 'Algorithms'],
            published: true,
            author: 'testuser'
          },
          {
            _id: 'test5',
            title: 'Docker for Beginners',
            description: 'Getting started with Docker containers',
            difficulty: 'beginner',
            tags: ['Docker', 'DevOps', 'Containers'],
            published: true,
            author: 'testuser'
          }
        ] as any[];
      }
      
      setModules(data);
      setFilteredModules(data);
      
      // Extract unique tags from all modules and count occurrences
      const tagsSet = new Set<string>();
      const tagCounts: Record<string, number> = {};
      
      data.forEach((module: any) => {
        if (module.tags && Array.isArray(module.tags)) {
          module.tags.forEach((tag: string) => {
            tagsSet.add(tag);
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });
      
      setAvailableTags(Array.from(tagsSet));
      setTagCountMap(tagCounts);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching modules:', err);
      setError('Failed to load modules. Please try again later.');
      setLoading(false);
    }
  };

  // Initial load of all modules to populate the tags list
  useEffect(() => {
    loadAllModules();
  }, []);

  // Function to search modules with the current filters
  const searchModules = async () => {
    try {
      setIsSearching(true);
      console.log('Starting search with filters:');
      console.log('Search term:', searchTerm);
      console.log('Difficulty:', difficultyFilter);
      console.log('Selected tag:', selectedTags[0]); // Just use the first selected tag
      
      // Client-side filtering to ensure it works
      let filteredResults = [...modules];
      
      // Apply search term filter
      if (searchTerm.trim() !== '') {
        const searchTermLower = searchTerm.trim().toLowerCase();
        filteredResults = filteredResults.filter(module => 
          module.title?.toLowerCase().includes(searchTermLower) || 
          module.description?.toLowerCase().includes(searchTermLower)
        );
      }
      
      // Apply difficulty filter
      if (difficultyFilter !== 'all') {
        filteredResults = filteredResults.filter(module => 
          module.difficulty === difficultyFilter
        );
      }
      
      // Apply tag filter - use a simple single tag filter
      if (selectedTags.length > 0 && selectedTags[0] !== 'all') {
        filteredResults = filteredResults.filter(module => {
          // Skip modules without tags
          if (!module.tags || !Array.isArray(module.tags)) {
            return false;
          }
          
          // Check if the module has the selected tag
          return module.tags.includes(selectedTags[0]);
        });
      }
      
      console.log('Filtered results:', filteredResults.length, 'modules found');
      setFilteredModules(filteredResults);
    } catch (err) {
      console.error('Error searching modules:', err);
      setError('Failed to search modules. Please try again later.');
    } finally {
      setIsSearching(false);
    }
  };

  // Apply filters whenever filter criteria change
  useEffect(() => {
    // Debounce search to avoid too many requests
    const debounceTimeout = setTimeout(() => {
      searchModules();
    }, 300);
    
    return () => clearTimeout(debounceTimeout);
  }, [searchTerm, difficultyFilter, selectedTags]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleDifficultyChange = (e: SelectChangeEvent<string>) => {
    setDifficultyFilter(e.target.value);
  };

  const handleTagChange = (e: SelectChangeEvent<string>) => {
    setSelectedTags([e.target.value]);
  };

  const handleViewModule = (moduleId: string | undefined) => {
    if (moduleId) {
      navigate(`/modules/view/${moduleId}`);
    }
  };

  const handleBackToMenu = () => {
    navigate('/modules');
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setDifficultyFilter('all');
    setSelectedTags(['all']);
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
          Search Modules
        </Typography>
      </Box>

      {/* Filters Section */}
      <Card sx={{ mb: 4, borderRadius: '8px' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <FilterIcon sx={{ mr: 1 }} />
            Filter Modules
          </Typography>
          
          <Grid container spacing={3}>
            {/* Search Term */}
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
                sx={{ mb: 2 }}
              />
            </Grid>
            
            {/* Difficulty Filter */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="difficulty-filter-label">Difficulty Level</InputLabel>
                <Select
                  labelId="difficulty-filter-label"
                  id="difficulty-filter"
                  value={difficultyFilter}
                  label="Difficulty Level"
                  onChange={handleDifficultyChange}
                >
                  <MenuItem value="all">All Levels</MenuItem>
                  <MenuItem value="beginner">Beginner</MenuItem>
                  <MenuItem value="elementary">Elementary</MenuItem>
                  <MenuItem value="intermediate">Intermediate</MenuItem>
                  <MenuItem value="advanced">Advanced</MenuItem>
                  <MenuItem value="expert">Expert</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Tag Filter Dropdown */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="tags-filter-label">Module Tag</InputLabel>
                <Select
                  labelId="tags-filter-label"
                  id="tags-filter"
                  value={selectedTags[0]}
                  label="Module Tag"
                  onChange={handleTagChange}
                >
                  <MenuItem value="all">All Tags</MenuItem>
                  {availableTags.map((tag) => (
                    <MenuItem key={tag} value={tag}>
                      {tag} ({tagCountMap[tag] || 0})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          {/* Active Tag Filters */}
          {(selectedTags.length > 0 && selectedTags[0] !== 'all') && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Active Filters
              </Typography>
              <Paper
                variant="outlined"
                sx={{ p: 2, backgroundColor: 'rgba(0, 0, 0, 0.02)', borderRadius: '4px' }}
              >
                <Grid container spacing={2}>
                  {selectedTags[0] !== 'all' && (
                    <Grid item xs={12}>
                      <Typography variant="body2">
                        Tag: 
                        <Box component="span" sx={{ fontWeight: 'bold', ml: 1 }}>
                          {selectedTags[0]}
                        </Box>
                      </Typography>
                    </Grid>
                  )}
                  {difficultyFilter !== 'all' && (
                    <Grid item xs={12}>
                      <Typography variant="body2">
                        Difficulty: 
                        <Box component="span" sx={{ fontWeight: 'bold', ml: 1 }}>
                          {difficultyFilter.charAt(0).toUpperCase() + difficultyFilter.slice(1)}
                        </Box>
                      </Typography>
                    </Grid>
                  )}
                </Grid>
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ClearIcon />}
                    onClick={handleClearFilters}
                  >
                    Clear All Filters
                  </Button>
                </Box>
              </Paper>
            </Box>
          )}
          
        </CardContent>
      </Card>

      {/* Results Summary */}
      {!loading && !error && (
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 1.5, 
            mb: 3, 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            borderRadius: '8px',
            backgroundColor: filteredModules.length > 0 ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 0, 0, 0.05)'
          }}
        >
          <Typography variant="body1" color="text.secondary">
            <strong>{filteredModules.length}</strong> {filteredModules.length === 1 ? 'module' : 'modules'} found
            {selectedTags.length > 0 && selectedTags[0] !== 'all' && (
              <Typography component="span" variant="body2" color="text.secondary">
                {' '}with tag: <strong>{selectedTags[0]}</strong>
              </Typography>
            )}
          </Typography>
          
          {filteredModules.length === 0 && (
            <Button
              variant="outlined"
              onClick={handleClearFilters}
              size="small"
              startIcon={<ClearIcon />}
            >
              Clear Filters
            </Button>
          )}
        </Paper>
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {/* Loading Indicator */}
      {loading || isSearching ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Modules List */}
          <Grid container spacing={3}>
            {filteredModules.length > 0 ? (
              filteredModules.map((module, index) => (
                <Grid item xs={12} md={6} lg={4} key={module._id || `module-${index}`}>
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
                      cursor: 'pointer'
                    }}
                    onClick={() => handleViewModule(module._id)}
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
                      
                      {module.tags && module.tags.length > 0 && (
                        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {module.tags.map((tag: string, index: number) => (
                            <Chip
                              key={index}
                              label={tag}
                              size="small"
                              color={selectedTags.includes(tag) ? "primary" : "default"}
                              variant={selectedTags.includes(tag) ? "filled" : "outlined"}
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent card click
                                // Set this tag as the selected tag
                                setSelectedTags([tag]);
                                // This will trigger the search effect
                              }}
                              sx={{ 
                                borderRadius: '4px',
                                cursor: 'pointer',
                              }}
                            />
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" color="text.secondary">
                    No modules match your search criteria
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={handleClearFilters}
                    sx={{ mt: 2 }}
                  >
                    Clear All Filters
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>
        </>
      )}
    </Container>
  );
};

export default SearchModulePage; 