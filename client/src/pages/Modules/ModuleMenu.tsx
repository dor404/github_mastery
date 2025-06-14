import React from 'react';
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
  Paper
} from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterAlt as FilterIcon,
  Drafts as DraftIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ModuleMenu: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isLecturerOrAdmin = user?.role === 'lecturer' || user?.role === 'admin';

  // Navigation handlers
  const handleCreateModule = () => navigate('/modules/create');
  const handleEditModules = () => navigate('/modules/edit');
  const handleDeleteModules = () => navigate('/modules/delete');
  const handleSearchModules = () => navigate('/modules/search');
  const handleViewAllModules = () => navigate('/tutorials');
  const handleViewDrafts = () => navigate('/modules/drafts');

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box textAlign="center" mb={6}>
        <Typography variant="h3" component="h1" sx={{ color: '#f05133', fontWeight: 700, mb: 2 }}>
          Module Management
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '800px', mx: 'auto', mb: 3 }}>
          Explore, create, and manage learning modules for Git Mastery
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={handleViewAllModules}
            startIcon={<SearchIcon />}
            sx={{
              backgroundColor: '#f05133',
              color: 'white',
              '&:hover': {
                backgroundColor: '#d03b1f',
              }
            }}
          >
            View All Modules
          </Button>
          
          {isLecturerOrAdmin && (
            <Button
              variant="outlined"
              onClick={handleViewDrafts}
              startIcon={<DraftIcon />}
              sx={{
                borderColor: '#f05133',
                color: '#f05133',
                '&:hover': {
                  backgroundColor: '#f05133',
                  color: 'white',
                }
              }}
            >
              View Drafts
            </Button>
          )}
        </Box>
      </Box>

      {/* Main Content */}
      <Paper 
        elevation={3} 
        sx={{ 
          backgroundColor: '#161b22', 
          borderRadius: '8px', 
          overflow: 'hidden',
          border: '1px solid rgba(240, 81, 51, 0.3)',
          mb: 4
        }}
      >
        <Box sx={{ backgroundColor: '#f05133', py: 2, px: 3 }}>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
            Module Operations
          </Typography>
        </Box>
        
        <Grid container spacing={4} sx={{ p: 4 }}>
          {/* Search/Filter Modules - Full width */}
          <Grid item xs={12}>
            <Card sx={{ 
              height: '100%', 
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SearchIcon sx={{ color: '#f05133', fontSize: 30, mr: 1 }} />
                  <Typography variant="h5" component="h2" sx={{ color: 'white', fontWeight: 600 }}>
                    Search & Filter Modules
                  </Typography>
                </Box>
                <Typography variant="body1" color="rgba(255, 255, 255, 0.7)" paragraph>
                  Browse all modules or filter by difficulty, keywords, or topics to find exactly what you need for your learning journey.
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2 }}>
                <Button 
                  variant="contained" 
                  fullWidth
                  sx={{
                    backgroundColor: '#f05133',
                    color: 'white',
                    textTransform: 'none',
                    fontWeight: 500,
                    py: 1,
                    '&:hover': { backgroundColor: '#d03b1f' },
                  }}
                  onClick={handleSearchModules}
                  startIcon={<FilterIcon />}
                >
                  Browse & Filter Modules
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Lecturer/Admin Only Section */}
          {isLecturerOrAdmin && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                <Typography variant="h6" sx={{ color: '#f05133', fontWeight: 600, my: 2 }}>
                  Instructor Controls
                </Typography>
              </Grid>

              {/* Create Module */}
              <Grid item xs={12} md={4}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <AddIcon sx={{ color: '#f05133', fontSize: 30, mr: 1 }} />
                      <Typography variant="h5" component="h2" sx={{ color: 'white', fontWeight: 600 }}>
                        Create Module
                      </Typography>
                    </Box>
                    <Typography variant="body1" color="rgba(255, 255, 255, 0.7)" paragraph>
                      Create a new learning module with custom content, difficulty levels, and interactive exercises.
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ p: 2 }}>
                    <Button 
                      variant="contained" 
                      fullWidth
                      sx={{
                        backgroundColor: '#f05133',
                        color: 'white',
                        textTransform: 'none',
                        fontWeight: 500,
                        py: 1,
                        '&:hover': { backgroundColor: '#d03b1f' },
                      }}
                      onClick={handleCreateModule}
                    >
                      Create New Module
                    </Button>
                  </CardActions>
                </Card>
              </Grid>

              {/* Edit Modules */}
              <Grid item xs={12} md={4}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <EditIcon sx={{ color: '#f05133', fontSize: 30, mr: 1 }} />
                      <Typography variant="h5" component="h2" sx={{ color: 'white', fontWeight: 600 }}>
                        Edit Modules
                      </Typography>
                    </Box>
                    <Typography variant="body1" color="rgba(255, 255, 255, 0.7)" paragraph>
                      Update existing modules to keep content current, fix errors, or improve learning materials.
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ p: 2 }}>
                    <Button 
                      variant="contained" 
                      fullWidth
                      sx={{
                        backgroundColor: '#f05133',
                        color: 'white',
                        textTransform: 'none',
                        fontWeight: 500,
                        py: 1,
                        '&:hover': { backgroundColor: '#d03b1f' },
                      }}
                      onClick={handleEditModules}
                    >
                      Manage & Edit Modules
                    </Button>
                  </CardActions>
                </Card>
              </Grid>

              {/* Delete Modules */}
              <Grid item xs={12} md={4}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <DeleteIcon sx={{ color: '#f05133', fontSize: 30, mr: 1 }} />
                      <Typography variant="h5" component="h2" sx={{ color: 'white', fontWeight: 600 }}>
                        Delete Modules
                      </Typography>
                    </Box>
                    <Typography variant="body1" color="rgba(255, 255, 255, 0.7)" paragraph>
                      Remove outdated or duplicate modules to maintain a clean and relevant learning platform.
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ p: 2 }}>
                    <Button 
                      variant="contained" 
                      fullWidth
                      sx={{
                        backgroundColor: '#f05133',
                        color: 'white',
                        textTransform: 'none',
                        fontWeight: 500,
                        py: 1,
                        '&:hover': { backgroundColor: '#d03b1f' },
                      }}
                      onClick={handleDeleteModules}
                    >
                      Delete Modules
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>
    </Container>
  );
};

export default ModuleMenu; 