import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Container,
  useTheme,
  Paper,
  CardContent,
  Divider
} from '@mui/material';
import {
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  ArrowForward as ArrowForwardIcon,
  Quiz as QuizIcon,
  AccountTree as AccountTreeIcon,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import GuidedButton from '../../components/Common/GuidedButton';
import { useAuth } from '../../context/AuthContext';

const Home: React.FC = () => {
  const theme = useTheme();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleFeatureClick = (path: string) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: path } } });
    } else {
      navigate(path);
    }
  };

  const features = [
    {
      icon: <SchoolIcon sx={{ fontSize: 48, color: '#FFDE21' }} />,
      title: 'Tutorials',
      description: 'Learn Git through step-by-step interactive tutorials designed for all skill levels',
      path: '/tutorials',
      color: '#bbdefb', // light blue
    },
    {
      icon: <QuizIcon sx={{ fontSize: 48, color: '#2e7d32' }} />,
      title: 'Quizzes',
      description: 'Test your Git knowledge with interactive quizzes and reinforce your learning',
      path: '/quizzes',
      color: '#66bb6a', // Changed to Material-UI green[400] for background
    },
    {
      icon: <AssignmentIcon sx={{ fontSize: 48, color: 'secondary.main' }} />,
      title: 'Practice Exercises',
      description: 'Reinforce your learning with hands-on exercises and real-world scenarios',
      path: '/training',
      color: '#f8bbd0', // light pink
    },
    {
      icon: <AccountTreeIcon sx={{ fontSize: 48, color: '#f05133' }} />,
      title: 'Git Visualization',
      description: 'Interactive Git graph visualization to understand branching and merging concepts',
      path: '/git-visualization',
      color: '#ffcdd2', // light red
    }
  ]; 

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#0d1117', // Dark GitHub background
        display: 'flex',
        flexDirection: 'column',
        pb: isAuthenticated ? '0' : '100px',
      }}
    >
      <Container maxWidth="lg" sx={{ flexGrow: 1, pt: 4 }}>
        {/* Hero Section */}
        <Box
          sx={{
            textAlign: 'center',
            mb: 8,
            mt: 4,
            animation: 'fadeIn 1s ease-in',
            '@keyframes fadeIn': {
              '0%': {
                opacity: 0,
                transform: 'translateY(20px)',
              },
              '100%': {
                opacity: 1,
                transform: 'translateY(0)',
              },
            },
          }}
        >
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(45deg, #f05133 30%, #6e5494 90%)', // Git orange to GitHub purple
              backgroundClip: 'text',
              textFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 3,
            }}
          >
            Master Git & GitHub
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: '#e6edf3', // Light GitHub text color
              mb: 4,
              maxWidth: '800px',
              mx: 'auto',
              lineHeight: 1.6,
            }}
          >
            Learn version control with Git through interactive tutorials,
            hands-on practice, and real-world simulations. Perfect for beginners
            and advanced users alike.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 6 }}>
            <Button
              variant="contained"
              size="large"
              component={RouterLink}
              to="/training"
              sx={{
                borderRadius: '28px',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                textTransform: 'none',
                backgroundColor: '#f05133', // Git orange
                color: 'white',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  backgroundColor: '#c41e3a', // Darker Git red
                  transition: 'all 0.3s ease',
                },
              }}
              endIcon={<ArrowForwardIcon />}
            >
              Start Learning
            </Button>
            <Button
              variant="outlined"
              size="large"
              component={RouterLink}
              to="/learn"
              sx={{
                borderRadius: '28px',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                textTransform: 'none',
                borderColor: '#30363d',
                color: '#e6edf3',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease',
                  borderColor: '#58a6ff',
                  backgroundColor: 'rgba(88, 166, 255, 0.1)',
                },
              }}
            >
              Learn More
            </Button>
          </Box>
        </Box>

        {/* Features Section */}
        <Grid container spacing={4} sx={{ mt: 4 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} lg={3} key={feature.title}>
              <Paper
                elevation={0}
                sx={{
                  height: '100%',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  background: '#161b22', // GitHub dark paper background
                  backdropFilter: 'blur(10px)',
                  border: '1px solid #30363d', // GitHub border color
                  animation: 'slideUp 0.5s ease-out forwards',
                  animationDelay: `${index * 0.2}s`,
                  opacity: 0,
                  '@keyframes slideUp': {
                    '0%': {
                      opacity: 0,
                      transform: 'translateY(20px)',
                    },
                    '100%': {
                      opacity: 1,
                      transform: 'translateY(0)',
                    },
                  },
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  },
                  cursor: 'pointer',
                }}
                onClick={() => handleFeatureClick(feature.path)}
              >
                <CardContent
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    p: 4,
                  }}
                >
                  <Box
                    sx={{
                      mb: 2,
                      p: 2,
                      borderRadius: '50%',
                      background: '#0d1117', // Dark background
                      boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography
                    variant="h5"
                    component="h2"
                    gutterBottom
                    sx={{ fontWeight: 600, mb: 2, color: '#e6edf3' }} // Light text
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    color="#8b949e" // GitHub secondary text color
                    sx={{ mb: 3, lineHeight: 1.6 }}
                  >
                    {feature.description}
                  </Typography>
                  <Button
                    variant="outlined"
                    sx={{
                      mt: 'auto',
                      borderRadius: '28px',
                      textTransform: 'none',
                      borderColor: '#30363d', // GitHub border color
                      color: '#58a6ff', // GitHub bright blue
                      '&:hover': {
                        transform: 'translateX(4px)',
                        transition: 'transform 0.3s ease',
                        borderColor: '#58a6ff',
                      },
                    }}
                    endIcon={<ArrowForwardIcon />}
                  >
                    Explore
                  </Button>
                </CardContent>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Call to Action Bottom Bar - Only visible for unauthenticated users */}
      {!isAuthenticated && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(45deg, #f05133 30%, #c41e3a 90%)', // Git orange to dark red
            color: 'white',
            py: 2,
            zIndex: 1000,
            boxShadow: '0px -2px 10px rgba(0,0,0,0.3)',
          }}
        >
          <Container maxWidth="lg">
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box sx={{ flex: 1, minWidth: '200px' }}>
                <Typography
                  variant="h5"
                  component="h2"
                  sx={{
                    fontWeight: 700,
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}
                >
                  Ready to Begin Your Git Journey?
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{
                    opacity: 0.9,
                  }}
                >
                  Start mastering Git today
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="large"
                component={RouterLink}
                to="/training"
                sx={{
                  borderRadius: '28px',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  textTransform: 'none',
                  backgroundColor: '#0d1117', // Dark background
                  color: '#e6edf3', // Light text
                  border: '1px solid #30363d',
                  '&:hover': {
                    backgroundColor: '#161b22',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  },
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                }}
                endIcon={<ArrowForwardIcon />}
              >
                Get Started
              </Button>
            </Box>
          </Container>
        </Box>
      )}
    </Box>
  );
};

export default Home; 