import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  SelectChangeEvent,
  CircularProgress,
  AlertTitle,
  Backdrop,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Save as SaveIcon,
  Preview as PreviewIcon,
  ArrowBack as ArrowBackIcon,
  Help as HelpIcon,
  ArticleOutlined as ArticleIcon,
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatListBulleted as ListIcon,
  Code as CodeIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { TutorialFormData, Tutorial } from '../../types/tutorial';
import tutorialService from '../../services/tutorialService';
import { useAuth } from '../../context/AuthContext';
import DifficultyStars, { difficultyToStars, starsToDifficulty } from '../Common/DifficultyStars';

const CreateModule: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { moduleId } = useParams();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<TutorialFormData>({
    title: '',
    content: '',
    description: '',
    difficulty: 'beginner',
    tags: [],
    exercises: [],
    prerequisites: [],
    pages: [],
    published: false,
  });

  // Additional state for star rating
  const [difficultyStarRating, setDifficultyStarRating] = useState<number>(1);

  // Current active page index for editing
  const [activePageIndex, setActivePageIndex] = useState<number>(-1);

  // Form validation state
  const [validationErrors, setValidationErrors] = useState({
    title: false,
    content: false,
    description: false,
    pages: false,
  });

  // Steps for the form process
  const steps = ['Basic Information', 'Content Creation', 'Add Pages', 'Review & Publish'];

  // Load existing tutorial if in edit mode
  useEffect(() => {
    if (moduleId) {
      setIsEditMode(true);
      loadExistingModule();
    }
  }, [moduleId]);

  // Fetch available tags from existing tutorials
  const [availableTags, setAvailableTags] = useState<string[]>([
    'Git', 'GitHub', 'Version Control', 'Branching', 'Merging', 'Commit', 
    'Pull Request', 'Clone', 'Repository', 'Workflow'
  ]);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        // Fetch published tutorials to extract tags
        const fetchedTutorials = await tutorialService.getAllPublished();
        
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
      } catch (err) {
        console.error('Error fetching tags:', err);
        // Default tags already set in state initialization
      }
    };

    fetchTags();
  }, []);

  const loadExistingModule = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch the module using the service
      const tutorial = await tutorialService.getById(moduleId as string);
      
      // Check if the current user is the author of the module or an admin
      const authorId = typeof tutorial.author === 'object' ? tutorial.author._id : tutorial.author;
      const authorUsername = typeof tutorial.author === 'object' ? tutorial.author.username : 'Unknown';
      
      if (user?.role !== 'admin' && authorId && user?.id !== authorId) {
        setError(`You don't have permission to edit this module. This module was created by ${authorUsername}.`);
        setLoading(false);
        return;
      }
      
      // Update form data with existing module data
      setFormData({
        title: tutorial.title || '',
        content: tutorial.content || '',
        description: tutorial.description || '',
        difficulty: tutorial.difficulty || 'beginner',
        tags: Array.isArray(tutorial.tags) ? tutorial.tags : [],
        exercises: Array.isArray(tutorial.exercises) ? tutorial.exercises : [],
        prerequisites: Array.isArray(tutorial.prerequisites) 
          ? tutorial.prerequisites.map((p: Tutorial | string) => 
              typeof p === 'string' ? p : (p._id || '')) 
          : [],
        pages: Array.isArray(tutorial.pages) ? tutorial.pages : [],
        published: tutorial.published || false,
      });
      
      // Set difficulty star rating based on difficulty
      setDifficultyStarRating(difficultyToStars(tutorial.difficulty));
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading module for editing:', err);
      setError('Module not found or you do not have permission to edit it. Please try again.');
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear validation errors when user types
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors({
        ...validationErrors,
        [name]: false,
      });
    }
  };

  // Handle difficulty change with stars
  const handleDifficultyStarChange = (value: number) => {
    const difficulty = starsToDifficulty(value);
    setDifficultyStarRating(value);
    setFormData({
      ...formData,
      difficulty: difficulty
    });
  };

  // Handle tags change
  const handleTagsChange = (e: SelectChangeEvent<string[]>) => {
    const value = e.target.value;
    setFormData({
      ...formData,
      tags: typeof value === 'string' ? value.split(',') : value,
    });
  };

  // Handle adding a new page
  const handleAddPage = () => {
    const newPage = {
      title: `Page ${formData.pages.length + 1}`,
      content: '',
      order: formData.pages.length
    };
    
    setFormData({
      ...formData,
      pages: [...formData.pages, newPage]
    });
    
    // Switch to the new page for editing
    setActivePageIndex(formData.pages.length);
  };

  // Handle removing a page
  const handleRemovePage = (index: number) => {
    const updatedPages = [...formData.pages];
    updatedPages.splice(index, 1);
    
    // Reorder pages
    const reorderedPages = updatedPages.map((page, idx) => ({
      ...page,
      order: idx
    }));
    
    setFormData({
      ...formData,
      pages: reorderedPages
    });
    
    // If we're removing the currently active page, reset to the previous one
    if (activePageIndex === index) {
      setActivePageIndex(Math.max(0, index - 1));
    } else if (activePageIndex > index) {
      setActivePageIndex(activePageIndex - 1);
    }
    
    // If no pages left, reset active index
    if (updatedPages.length === 0) {
      setActivePageIndex(-1);
    }
  };

  // Handle updating a page
  const handlePageUpdate = (field: 'title' | 'content', value: string) => {
    if (activePageIndex < 0 || activePageIndex >= formData.pages.length) {
      return;
    }
    
    const updatedPages = [...formData.pages];
    updatedPages[activePageIndex] = {
      ...updatedPages[activePageIndex],
      [field]: value
    };
    
    setFormData({
      ...formData,
      pages: updatedPages
    });
  };

  // Handle page selection
  const handleSelectPage = (index: number) => {
    setActivePageIndex(index);
  };

  // Validate current step
  const validateStep = (): boolean => {
    if (activeStep === 0) {
      // Validate basic info
      const errors = {
        title: !formData.title.trim(),
        description: !formData.description.trim(),
        content: validationErrors.content, // Keep existing content validation
        pages: validationErrors.pages, // Keep existing pages validation
      };
      
      setValidationErrors(errors);
      return !errors.title && !errors.description;
    } else if (activeStep === 1) {
      // Validate content
      const errors = {
        ...validationErrors,
        content: !formData.content.trim(),
      };
      
      setValidationErrors(errors);
      return !errors.content;
    } else if (activeStep === 2) {
      // Validate pages - check that all pages have title and content
      const hasInvalidPages = formData.pages.some(page => 
        !page.title.trim() || !page.content.trim()
      );
      
      const errors = {
        ...validationErrors,
        pages: hasInvalidPages
      };
      
      setValidationErrors(errors);
      return !hasInvalidPages;
    }
    
    return true;
  };

  // Handle next step
  const handleNext = () => {
    if (validateStep()) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  // Handle back step
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Toggle preview mode
  const handleTogglePreview = () => {
    setPreviewMode(!previewMode);
  };

  // Insert markdown formatting to content
  const insertFormatting = (format: string) => {
    let formatText = '';
    let cursorPosition = 0;
    
    switch (format) {
      case 'bold':
        formatText = '**bold text**';
        cursorPosition = 2;
        break;
      case 'italic':
        formatText = '*italic text*';
        cursorPosition = 1;
        break;
      case 'list':
        formatText = '\n- List item 1\n- List item 2\n- List item 3\n';
        cursorPosition = 2;
        break;
      case 'code':
        formatText = '```\ncode block\n```';
        cursorPosition = 4;
        break;
      case 'link':
        formatText = '[link text](https://example.com)';
        cursorPosition = 1;
        break;
      default:
        return;
    }
    
    setFormData({
      ...formData,
      content: formData.content + formatText,
    });

    // Clear content validation error if it exists
    if (validationErrors.content) {
      setValidationErrors({
        ...validationErrors,
        content: false,
      });
    }
  };

  // Process markdown to render preview
  const renderMarkdown = (markdown: string): string => {
    // This is a simple implementation - consider using a proper markdown library
    let html = markdown
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
      .replace(/^- (.*?)$/gm, '<li>$1</li>')
      .replace(/<li>(.*?)<\/li>/g, '<ul><li>$1</li></ul>')
      .replace(/<\/ul><ul>/g, '');
    
    // Split by newlines and wrap in paragraphs
    const lines = html.split('\n');
    const paragraphs = lines
      .filter(line => line.trim() !== '')
      .map(line => {
        if (
          !line.startsWith('<ul>') && 
          !line.startsWith('<li>') && 
          !line.startsWith('<pre>') && 
          !line.startsWith('<code>')
        ) {
          return `<p>${line}</p>`;
        }
        return line;
      });
    
    return paragraphs.join('');
  };

  // Validate form before submission
  const validateForm = (): boolean => {
    const errors = {
      title: !formData.title.trim(),
      content: !formData.content.trim(),
      description: !formData.description.trim(),
      pages: formData.pages.some(page => !page.title.trim() || !page.content.trim())
    };

    setValidationErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Check if user is logged in and has appropriate role
      if (!user || (user.role !== 'lecturer' && user.role !== 'admin')) {
        setError('You do not have permission to create modules. Please log in as a lecturer or admin.');
        setLoading(false);
        return;
      }
      
      // Validate that title is not too short
      if (formData.title.length < 5) {
        setError('Title must be at least 5 characters long');
        setLoading(false);
        return;
      }
      
      // Validate content
      if (formData.content.length < 20) {
        setError('Content must be at least 20 characters long');
        setLoading(false);
        return;
      }
      
      // Validate description
      if (formData.description.length < 10) {
        setError('Description must be at least 10 characters long');
        setLoading(false);
        return;
      }
      
      // Validate pages if any exist
      if (formData.pages.length > 0) {
        for (const page of formData.pages) {
          if (page.title.length < 3) {
            setError(`Page title "${page.title}" is too short (minimum 3 characters)`);
            setLoading(false);
            return;
          }
          
          if (page.content.length < 20) {
            setError(`Content for page "${page.title}" is too short (minimum 20 characters)`);
            setLoading(false);
            return;
          }
        }
      }
      
      // Prepare the data to be sent to the server
      const moduleData = {
        ...formData,
        difficultyStars: difficultyStarRating, // Add star rating to the data
        published: formData.published
      } as Partial<Tutorial>;
      
      if (isEditMode && moduleId) {
        // Update existing module
        console.log('Updating module with ID:', moduleId);
        await tutorialService.update(moduleId, moduleData);
        console.log('Module updated successfully');
        setSuccess(true);
        
        if (formData.published) {
          setSuccessMessage(`Module "${formData.title}" has been updated and published successfully!`);
        } else {
          setSuccessMessage(`Draft "${formData.title}" has been saved successfully!`);
        }
      } else {
        // Create new module
        console.log('Creating new module');
        await tutorialService.create(moduleData);
        console.log('Module created successfully');
        setSuccess(true);
        
        if (formData.published) {
          setSuccessMessage(`Module "${formData.title}" has been created and published successfully!`);
        } else {
          setSuccessMessage(`Draft "${formData.title}" has been saved successfully! You can continue editing it later from the Drafts page.`);
        }
        
        // Reset form only for new module creation
        setFormData({
          title: '',
          content: '',
          description: '',
          difficulty: 'beginner',
          tags: [],
          exercises: [],
          prerequisites: [],
          pages: [],
          published: false,
        });
        
        // Reset star rating
        setDifficultyStarRating(1);
        
        // Reset to first step
        setActiveStep(0);
        setActivePageIndex(-1);
      }
      
      setPreviewMode(false);
    } catch (err: any) {
      console.error(isEditMode ? 'Error updating module:' : 'Error creating module:', err);
      
      // Detailed error handling
      if (err.response) {
        // The server responded with an error
        const serverMessage = err.response.data?.message || 'The server rejected the request';
        const detailError = err.response.data?.error || '';
        setError(`Failed to ${isEditMode ? 'update' : 'create'} module: ${serverMessage}. ${detailError}`);
      } else if (err.request) {
        // The request was made but no response was received
        setError('Unable to reach the server. Please check your internet connection and try again.');
      } else if (err.message) {
        // Something else happened in setting up the request
        setError(`Error: ${err.message}`);
      } else {
        // Fallback error message
        setError(`An unexpected error occurred while ${isEditMode ? 'updating' : 'creating'} the module. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSuccess(false);
    setSuccessMessage('');
    setError(null);
  };

  // Redirect to training page on successful creation
  const handleSuccessRedirect = () => {
    setSuccess(false);
    setSuccessMessage('');
    navigate('/tutorials');
  };

  // Render form step content
  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Module Details
              </Typography>
              <TextField
                required
                fullWidth
                label="Module Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                margin="normal"
                error={validationErrors.title}
                helperText={validationErrors.title ? 'Title is required' : ''}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#30363d',
                    },
                    '&:hover fieldset': {
                      borderColor: '#6e7681',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#f05133',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#8b949e',
                  },
                  '& .MuiOutlinedInput-input': {
                    color: '#e6edf3',
                  },
                }}
              />
              <TextField
                required
                fullWidth
                label="Module Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                margin="normal"
                multiline
                rows={4}
                error={validationErrors.description}
                helperText={validationErrors.description ? 'Description is required' : 'A brief overview of what this module covers'}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#30363d',
                    },
                    '&:hover fieldset': {
                      borderColor: '#6e7681',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#f05133',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#8b949e',
                  },
                  '& .MuiOutlinedInput-input': {
                    color: '#e6edf3',
                  },
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <Typography variant="subtitle1" gutterBottom sx={{ color: '#8b949e' }}>
                  Difficulty Level
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <DifficultyStars 
                      difficulty={difficultyStarRating} 
                      readOnly={false}
                      onChange={handleDifficultyStarChange}
                    />
                    <Typography variant="body2" sx={{ color: '#8b949e' }}>
                      {formData.difficulty.charAt(0).toUpperCase() + formData.difficulty.slice(1)}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#8b949e' }}>
                    * 1 star: Beginner, 2 stars: Elementary, 3 stars: Intermediate, 4 stars: Advanced, 5 stars: Expert
                  </Typography>
                </Box>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="tags-label" sx={{ color: '#8b949e' }}>Tags</InputLabel>
                <Select
                  labelId="tags-label"
                  multiple
                  value={formData.tags}
                  onChange={handleTagsChange}
                  input={<OutlinedInput label="Tags" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} />
                      ))}
                    </Box>
                  )}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#30363d',
                      },
                      '&:hover fieldset': {
                        borderColor: '#6e7681',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#f05133',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#8b949e',
                    },
                    '& .MuiOutlinedInput-input': {
                      color: '#e6edf3',
                    },
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
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                <Tooltip title="Bold">
                  <IconButton onClick={() => insertFormatting('bold')}>
                    <BoldIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Italic">
                  <IconButton onClick={() => insertFormatting('italic')}>
                    <ItalicIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="List">
                  <IconButton onClick={() => insertFormatting('list')}>
                    <ListIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Code Block">
                  <IconButton onClick={() => insertFormatting('code')}>
                    <CodeIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Link">
                  <IconButton onClick={() => insertFormatting('link')}>
                    <LinkIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Toggle Preview">
                  <IconButton 
                    onClick={handleTogglePreview}
                    color={previewMode ? "primary" : "default"}
                  >
                    <PreviewIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              
              {previewMode ? (
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Preview Mode
                    </Typography>
                    <Box 
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(formData.content) }} 
                      sx={{ 
                        '& p': { my: 1 },
                        '& ul': { my: 1, pl: 2 },
                        '& pre': { 
                          background: '#21262d', 
                          p: 2, 
                          borderRadius: 1,
                          overflow: 'auto'
                        }
                      }}
                    />
                  </CardContent>
                </Card>
              ) : (
                <TextField
                  required
                  fullWidth
                  label="Module Content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  multiline
                  rows={15}
                  error={validationErrors.content}
                  helperText={validationErrors.content ? 'Content is required' : 'Supports Markdown formatting'}
                />
              )}
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Module Pages
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleAddPage}
                  sx={{
                    backgroundColor: '#f05133',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#d03b1f',
                    },
                  }}
                >
                  Add New Page
                </Button>
              </Box>
              
              {formData.pages.length === 0 ? (
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    backgroundColor: 'rgba(240, 81, 51, 0.05)',
                    borderColor: '#f05133',
                  }}
                >
                  <Typography variant="body1" paragraph>
                    No pages added yet. Add pages to create a multi-page module with different subjects.
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={handleAddPage}
                    sx={{
                      color: '#f05133',
                      borderColor: '#f05133',
                      '&:hover': {
                        backgroundColor: 'rgba(240, 81, 51, 0.1)',
                        borderColor: '#d03b1f',
                      },
                    }}
                  >
                    Add First Page
                  </Button>
                </Paper>
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <Paper 
                      variant="outlined"
                      sx={{ 
                        p: 2, 
                        borderColor: '#30363d',
                      }}
                    >
                      <Typography variant="subtitle2" gutterBottom>
                        Pages
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        {formData.pages.map((page, index) => (
                          <Box 
                            key={index}
                            onClick={() => handleSelectPage(index)}
                            sx={{
                              p: 1.5,
                              mb: 1,
                              borderRadius: 1,
                              cursor: 'pointer',
                              backgroundColor: activePageIndex === index ? 'rgba(240, 81, 51, 0.1)' : 'transparent',
                              border: activePageIndex === index ? '1px solid #f05133' : '1px solid #30363d',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              '&:hover': {
                                backgroundColor: activePageIndex === index ? 'rgba(240, 81, 51, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                              },
                            }}
                          >
                            <Typography variant="body2" noWrap sx={{ maxWidth: '80%' }}>
                              {page.title || `Page ${index + 1}`}
                            </Typography>
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemovePage(index);
                              }}
                              sx={{ color: '#f05133' }}
                            >
                              ×
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={9}>
                    {activePageIndex >= 0 && activePageIndex < formData.pages.length ? (
                      <Paper 
                        variant="outlined"
                        sx={{ 
                          p: 2, 
                          borderColor: '#30363d',
                        }}
                      >
                        <TextField
                          fullWidth
                          label="Page Title"
                          value={formData.pages[activePageIndex].title}
                          onChange={(e) => handlePageUpdate('title', e.target.value)}
                          margin="normal"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': {
                                borderColor: '#30363d',
                              },
                              '&:hover fieldset': {
                                borderColor: '#6e7681',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#f05133',
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: '#8b949e',
                            },
                            '& .MuiOutlinedInput-input': {
                              color: '#e6edf3',
                            },
                          }}
                        />
                        
                        <Box sx={{ mb: 2, mt: 2, display: 'flex', gap: 1 }}>
                          <Tooltip title="Bold">
                            <IconButton onClick={() => {
                              const formatText = '**bold text**';
                              handlePageUpdate('content', formData.pages[activePageIndex].content + formatText);
                            }}>
                              <BoldIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Italic">
                            <IconButton onClick={() => {
                              const formatText = '*italic text*';
                              handlePageUpdate('content', formData.pages[activePageIndex].content + formatText);
                            }}>
                              <ItalicIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="List">
                            <IconButton onClick={() => {
                              const formatText = '\n- List item 1\n- List item 2\n- List item 3\n';
                              handlePageUpdate('content', formData.pages[activePageIndex].content + formatText);
                            }}>
                              <ListIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Code Block">
                            <IconButton onClick={() => {
                              const formatText = '```\ncode block\n```';
                              handlePageUpdate('content', formData.pages[activePageIndex].content + formatText);
                            }}>
                              <CodeIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Link">
                            <IconButton onClick={() => {
                              const formatText = '[link text](https://example.com)';
                              handlePageUpdate('content', formData.pages[activePageIndex].content + formatText);
                            }}>
                              <LinkIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        
                        <TextField
                          fullWidth
                          label="Page Content"
                          value={formData.pages[activePageIndex].content}
                          onChange={(e) => handlePageUpdate('content', e.target.value)}
                          multiline
                          rows={12}
                          margin="normal"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': {
                                borderColor: '#30363d',
                              },
                              '&:hover fieldset': {
                                borderColor: '#6e7681',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#f05133',
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: '#8b949e',
                            },
                            '& .MuiOutlinedInput-input': {
                              color: '#e6edf3',
                            },
                          }}
                        />
                      </Paper>
                    ) : (
                      <Paper 
                        variant="outlined"
                        sx={{ 
                          p: 3, 
                          textAlign: 'center',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          borderColor: '#30363d',
                        }}
                      >
                        <Typography variant="body1" gutterBottom>
                          Select a page to edit or create a new page.
                        </Typography>
                      </Paper>
                    )}
                  </Grid>
                </Grid>
              )}
              
              {validationErrors.pages && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  All pages must have both title and content
                </Alert>
              )}
            </Grid>
          </Grid>
        );
      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {formData.title}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <DifficultyStars difficulty={difficultyStarRating} size="small" />
                  </Box>
                  <Typography variant="body2" paragraph>
                    {formData.description}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    {formData.tags.map((tag) => (
                      <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                    ))}
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle1" gutterBottom>
                    Main Content Preview:
                  </Typography>
                  <Box 
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(formData.content.slice(0, 200) + (formData.content.length > 200 ? '...' : '')) }} 
                    sx={{ 
                      '& p': { my: 1 },
                      '& ul': { my: 1, pl: 2 },
                      '& pre': { 
                        background: '#21262d', 
                        p: 2, 
                        borderRadius: 1,
                        overflow: 'auto'
                      }
                    }}
                  />
                  
                  {formData.pages.length > 0 && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle1" gutterBottom>
                        Additional Pages:
                      </Typography>
                      <Grid container spacing={2}>
                        {formData.pages.map((page, index) => (
                          <Grid item xs={12} sm={6} md={4} key={index}>
                            <Card variant="outlined" sx={{ height: '100%' }}>
                              <CardContent>
                                <Typography variant="subtitle2" gutterBottom>
                                  {page.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                  Page {index + 1}
                                </Typography>
                                <Divider sx={{ my: 1 }} />
                                <Box 
                                  dangerouslySetInnerHTML={{ 
                                    __html: renderMarkdown(page.content.slice(0, 100) + (page.content.length > 100 ? '...' : '')) 
                                  }} 
                                  sx={{ 
                                    '& p': { my: 0.5, fontSize: '0.875rem' },
                                    '& ul': { my: 0.5, pl: 2 },
                                    '& pre': { 
                                      background: '#21262d', 
                                      p: 1, 
                                      borderRadius: 1,
                                      overflow: 'auto',
                                      fontSize: '0.75rem'
                                    }
                                  }}
                                />
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </>
                  )}
                </CardContent>
              </Card>
              
              <FormControl fullWidth sx={{ mt: 3 }}>
                <Grid container alignItems="center">
                  <Grid item>
                    <Typography variant="body2" sx={{ mr: 2 }}>
                      Publish this module now?
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Select
                      value={formData.published ? 'yes' : 'no'}
                      onChange={(e) => setFormData({
                        ...formData,
                        published: e.target.value === 'yes'
                      })}
                      size="small"
                    >
                      <MenuItem value="yes">Yes, publish immediately</MenuItem>
                      <MenuItem value="no">No, save as draft</MenuItem>
                    </Select>
                  </Grid>
                </Grid>
              </FormControl>
            </Grid>
          </Grid>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '1200px', mx: 'auto' }}>
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 3,
          position: 'relative'
        }}
      >
        <IconButton 
          onClick={() => navigate(-1)}
          sx={{ position: 'absolute', left: 0 }}
          aria-label="back"
        >
          <ArrowBackIcon />
        </IconButton>
        
        <Typography 
          variant="h4" 
          component="h1" 
          align="center"
          sx={{ 
            flexGrow: 1,
            color: '#f05133', // Git orange
            fontWeight: 600 
          }}
        >
          {isEditMode ? 'Edit Module' : 'Create New Module'}
        </Typography>
      </Box>
      
      <Stepper 
        activeStep={activeStep} 
        alternativeLabel
        sx={{ 
          mb: 4,
          '& .MuiStepLabel-root .Mui-active': {
            color: '#f05133', // Git orange
          },
          '& .MuiStepLabel-root .Mui-completed': {
            color: '#f05133', // Git orange
          },
        }}
      >
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          mb: 3,
          backgroundColor: '#161b22', // GitHub dark paper background
          borderRadius: 2,
          border: '1px solid #30363d', // GitHub border color
          color: '#e6edf3', // GitHub light text
        }}
      >
        {getStepContent(activeStep)}
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          sx={{
            color: '#e6edf3',
            borderColor: '#30363d',
            '&:hover': {
              borderColor: '#f05133',
              backgroundColor: 'rgba(240, 81, 51, 0.1)',
            }
          }}
          variant="outlined"
          disabled={activeStep === 0}
          onClick={handleBack}
        >
          Back
        </Button>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              sx={{
                backgroundColor: '#f05133', // Git orange
                color: 'white',
                '&:hover': {
                  backgroundColor: '#d03b1f', // Darker Git red
                },
                '&.Mui-disabled': {
                  backgroundColor: 'rgba(240, 81, 51, 0.5)',
                }
              }}
              startIcon={<SaveIcon />}
            >
              {loading ? 
                'Saving...' : 
                (isEditMode ? 'Save Changes' : 'Create Module')
              }
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              sx={{
                backgroundColor: '#f05133', // Git orange
                color: 'white',
                '&:hover': {
                  backgroundColor: '#d03b1f', // Darker Git red
                },
              }}
            >
              Next
            </Button>
          )}
        </Box>
      </Box>
      
      {/* Helper card with tips */}
      <Card 
        variant="outlined" 
        sx={{ 
          mt: 3, 
          backgroundColor: 'rgba(22, 27, 34, 0.7)',
          borderColor: '#f05133',
          border: '1px solid rgba(240, 81, 51, 0.4)'
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <HelpIcon sx={{ mr: 1, color: 'info.main' }} />
            <Typography variant="h6">
              Tips for Creating Great Modules
            </Typography>
          </Box>
          
          <Typography variant="body2" paragraph>
            • Start with clear learning objectives - what will users learn from this module?
          </Typography>
          <Typography variant="body2" paragraph>
            • Break content into smaller, digestible sections with headings
          </Typography>
          <Typography variant="body2" paragraph>
            • Include practical examples and code snippets where relevant
          </Typography>
          <Typography variant="body2">
            • Use markdown formatting for better readability
          </Typography>
        </CardContent>
      </Card>
      
      {/* Loading overlay */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress color="inherit" />
          <Typography variant="h6" sx={{ mt: 2 }}>
            {isEditMode ? 'Loading module...' : 'Creating module...'}
          </Typography>
        </Box>
      </Backdrop>
      
      {/* Success notification */}
      <Snackbar 
        open={success} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity="success"
          sx={{ width: '100%' }}
          action={
            <Button color="inherit" size="small" onClick={handleSuccessRedirect}>
              View Modules
            </Button>
          }
        >
          <AlertTitle>Success</AlertTitle>
          {successMessage}
        </Alert>
      </Snackbar>
      
      {/* Error notification */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity="error">
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateModule; 