import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Divider,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepButton,
  Breadcrumbs,
  Link,
  ButtonGroup,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CompletedIcon,
  Timer as InProgressIcon,
  MenuBook as PageIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { Tutorial } from '../../types/tutorial';
import tutorialService from '../../services/tutorialService';
import { useAuth } from '../../context/AuthContext';
import DifficultyStars from '../Common/DifficultyStars';

// Add a new type for tutorial progress
interface TutorialProgress {
  tutorialId: string;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed';
  lastAccessedAt?: Date;
  currentPage?: number;
}

const TutorialViewer: React.FC = () => {
  const { tutorialId } = useParams<{ tutorialId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // State management
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<TutorialProgress | null>(null);
  const [activePageIndex, setActivePageIndex] = useState(0);
  
  // Get user-specific progress storage key
  const getProgressStorageKey = () => {
    return `tutorialProgress_${user?.id || 'guest'}`;
  };
  
  // Process markdown to HTML (simple implementation)
  const renderMarkdown = (markdown: string): string => {
    // This is a simple implementation - in a real app, use a proper markdown library
    let html = markdown
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
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

  // Function to fetch tutorial data
  const fetchTutorial = async () => {
    if (!tutorialId) return;

    try {
      setLoading(true);
      setError(null);
      const fetchedTutorial = await tutorialService.getPublishedById(tutorialId);
      setTutorial(fetchedTutorial);
      
      // Load progress from localStorage
      const storageKey = getProgressStorageKey();
      const savedProgressData = localStorage.getItem(storageKey);
      
      if (savedProgressData) {
        const allProgress = JSON.parse(savedProgressData);
        const tutorialProgress = allProgress[tutorialId];
        
        if (tutorialProgress) {
          setProgress(tutorialProgress);
          setActivePageIndex(tutorialProgress.currentPage || 0);
        } else {
          initializeNewProgress();
        }
      } else {
        initializeNewProgress();
      }
    } catch (err) {
      console.error('Error fetching tutorial:', err);
      setError('Failed to load tutorial. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Initialize new progress
  const initializeNewProgress = () => {
    const newProgress = {
      tutorialId: tutorialId!,
      progress: 0,
      status: 'not_started' as const,
      lastAccessedAt: new Date(),
      currentPage: 0
    };
    setProgress(newProgress);
    
    // Update localStorage
    const storageKey = getProgressStorageKey();
    const savedProgressData = localStorage.getItem(storageKey);
    const allProgress = savedProgressData ? JSON.parse(savedProgressData) : {};
    
    localStorage.setItem(storageKey, JSON.stringify({
      ...allProgress,
      [tutorialId!]: newProgress
    }));
  };

  // Function to sync progress with server
  const syncProgressWithServer = async (tutorialId: string, progressData: TutorialProgress) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No auth token found, skipping server sync');
        return;
      }
      
      console.log('Syncing tutorial progress with server:', {
        tutorialId,
        status: progressData.status,
        currentPage: progressData.currentPage || 0,
        totalPages: tutorial?.pages?.length || 0
      });
      
      const response = await fetch(`http://localhost:5001/api/tutorials/progress/${tutorialId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: progressData.status,
          currentPage: progressData.currentPage || 0,
          totalPages: tutorial?.pages?.length || 0
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to sync tutorial progress:', response.status, errorText);
      } else {
        const result = await response.json();
        console.log('Tutorial progress synced successfully:', result);
      }
    } catch (error) {
      console.error('Error syncing tutorial progress:', error);
    }
  };

  // Effect to fetch tutorial when ID changes
  useEffect(() => {
    fetchTutorial();
  }, [tutorialId, location.pathname]);

  // Effect to update progress when page changes
  useEffect(() => {
    if (!tutorialId || !progress || !tutorial) return;
    
    const totalPages = tutorial.pages?.length || 0;
    const mainContent = 1;
    const totalSteps = totalPages + mainContent;
    
    const progressPercentage = Math.min(
      Math.round((activePageIndex + 1) / totalSteps * 100),
      100
    );
    
    // Mark as completed when reaching the last page (100% progress)
    const newStatus = progressPercentage >= 100 ? 'completed' as const :
                     progressPercentage > 0 ? 'in_progress' as const :
                     'not_started' as const;

    const updatedProgress = {
      ...progress,
      progress: progressPercentage,
      status: newStatus,
      lastAccessedAt: new Date(),
      currentPage: activePageIndex
    };

    setProgress(updatedProgress);
    
    // Update localStorage
    const storageKey = getProgressStorageKey();
    const savedProgressData = localStorage.getItem(storageKey);
    const allProgress = savedProgressData ? JSON.parse(savedProgressData) : {};
    
    localStorage.setItem(storageKey, JSON.stringify({
      ...allProgress,
      [tutorialId]: updatedProgress
    }));
    
    // Always sync with server, especially when completed
    syncProgressWithServer(tutorialId, updatedProgress);
    
    // Log completion for debugging
    if (newStatus === 'completed') {
      console.log(`Tutorial ${tutorialId} marked as COMPLETED for user`);
    }
  }, [activePageIndex, tutorial, tutorialId]);

  // Also sync when tutorial is first loaded to ensure server has the record
  useEffect(() => {
    if (tutorialId && progress && tutorial) {
      syncProgressWithServer(tutorialId, progress);
    }
  }, [tutorialId, tutorial]);

  // Handle page navigation
  const handlePageChange = (pageIndex: number) => {
    setActivePageIndex(pageIndex);
  };

  // Handle next page
  const handleNextPage = () => {
    if (!tutorial) return;
    
    const totalPages = tutorial.pages?.length || 0;
    if (activePageIndex < totalPages) {
      setActivePageIndex(prevIndex => prevIndex + 1);
    }
  };

  // Handle previous page
  const handlePrevPage = () => {
    if (activePageIndex > 0) {
      setActivePageIndex(prevIndex => prevIndex - 1);
    }
  };

  // Get current page content
  const getCurrentContent = () => {
    if (!tutorial) return null;
    
    // If on main content page (index 0)
    if (activePageIndex === 0) {
      return (
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {tutorial.title}
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, my: 2, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DifficultyStars difficulty={tutorial.difficulty} size="medium" />
              <Typography variant="body2" color="text.secondary">
                {tutorial.difficulty.charAt(0).toUpperCase() + tutorial.difficulty.slice(1)}
              </Typography>
            </Box>
            
            {tutorial.tags?.map((tag, index) => (
              <Chip key={index} label={tag} size="small" variant="outlined" />
            ))}
          </Box>
          
          <Box 
            dangerouslySetInnerHTML={{ __html: renderMarkdown(tutorial.content) }} 
            sx={{ 
              '& p': { my: 1.5 },
              '& code': { 
                backgroundColor: 'rgba(0, 0, 0, 0.1)', 
                padding: '2px 4px', 
                borderRadius: '4px',
                fontFamily: 'monospace'
              },
              '& pre': { 
                backgroundColor: 'rgba(0, 0, 0, 0.1)', 
                padding: 2, 
                borderRadius: '4px',
                overflow: 'auto'
              }
            }}
          />
        </Box>
      );
    }
    
    // If on an additional page
    const pageIndex = activePageIndex - 1;
    if (tutorial.pages && tutorial.pages[pageIndex]) {
      const page = tutorial.pages[pageIndex];
      return (
        <Box>
          <Typography variant="h4" component="h2" gutterBottom>
            {page.title}
          </Typography>
          
          <Box 
            dangerouslySetInnerHTML={{ __html: renderMarkdown(page.content) }} 
            sx={{ 
              '& p': { my: 1.5 },
              '& code': { 
                backgroundColor: 'rgba(0, 0, 0, 0.1)', 
                padding: '2px 4px', 
                borderRadius: '4px',
                fontFamily: 'monospace'
              },
              '& pre': { 
                backgroundColor: 'rgba(0, 0, 0, 0.1)', 
                padding: 2, 
                borderRadius: '4px',
                overflow: 'auto'
              }
            }}
          />
        </Box>
      );
    }
    
    return <Alert severity="error">Page not found</Alert>;
  };

  // Get difficulty color
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

  // Get progress status chip
  const getProgressStatusChip = () => {
    if (!progress) return null;
    
    switch (progress.status) {
      case 'completed':
        return <Chip icon={<CompletedIcon />} label="Completed" color="success" />;
      case 'in_progress':
        return <Chip icon={<InProgressIcon />} label="In Progress" color="primary" />;
      default:
        return <Chip label="Not Started" variant="outlined" />;
    }
  };

  // Render the stepper showing all pages
  const renderPageStepper = () => {
    if (!tutorial) return null;
    
    const steps = [
      { label: 'Main Content', index: 0 },
      ...(tutorial.pages?.map((page, idx) => ({ 
        label: page.title, 
        index: idx + 1
      })) || [])
    ];
    
    return (
      <Stepper 
        activeStep={activePageIndex} 
        alternativeLabel 
        nonLinear
        sx={{ mt: 4, mb: 2 }}
      >
        {steps.map((step) => (
          <Step key={step.index} completed={progress ? step.index < progress.progress / (100 / steps.length) : false}>
            <StepButton onClick={() => handlePageChange(step.index)}>
              <StepLabel>{step.label}</StepLabel>
            </StepButton>
          </Step>
        ))}
      </Stepper>
    );
  };

  return (
    <Box 
      component="main" 
      sx={{ 
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh',
        pt: 8,
        pb: 4
      }}
    >
      <Container maxWidth="lg">
        <Paper 
          elevation={2}
          sx={{
            p: 4,
            position: 'relative',
            zIndex: 2,
            backgroundColor: 'background.paper',
            minHeight: '70vh'
          }}
        >
          {/* Breadcrumbs navigation */}
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
            <Link
              component={RouterLink}
              to="/"
              color="inherit"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              Home
            </Link>
            <Link
              component={RouterLink}
              to="/tutorials"
              color="inherit"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <PageIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              Tutorials
            </Link>
            <Typography color="text.primary">
              {tutorial?.title || 'Loading...'}
            </Typography>
          </Breadcrumbs>

          {/* Loading state */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          )}

          {/* Error state */}
          {error && (
            <Alert severity="error" sx={{ mb: 4 }}>
              {error}
            </Alert>
          )}

          {/* Tutorial content */}
          {!loading && !error && tutorial && (
            <>
              {/* Progress status bar */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Button 
                  startIcon={<ArrowBackIcon />}
                  onClick={() => navigate('/tutorials')}
                >
                  Back to Tutorials
                </Button>
                {getProgressStatusChip()}
              </Box>

              {/* Get current content */}
              <Box sx={{ mb: 4 }}>
                <Paper sx={{ p: 4, borderRadius: '8px' }}>
                  {getCurrentContent()}
                </Paper>
              </Box>
              
              {/* Page navigation buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<ArrowBackIcon />}
                  onClick={handlePrevPage}
                  disabled={activePageIndex === 0}
                >
                  Previous
                </Button>
                
                <Button
                  variant="contained"
                  color="primary"
                  endIcon={<ArrowForwardIcon />}
                  onClick={handleNextPage}
                  disabled={!tutorial || activePageIndex >= (tutorial.pages?.length || 0)}
                >
                  Next
                </Button>
              </Box>

              {/* Page stepper */}
              {renderPageStepper()}
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default TutorialViewer; 